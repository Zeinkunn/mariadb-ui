const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/databases/:db/tables/:tbl/schema
router.get('/:tbl/schema', async (req, res) => {
    const { db: database, tbl } = req.params;
    try {
        const columns = await db.queryDb(database, `
      SELECT 
        COLUMN_NAME as name,
        ORDINAL_POSITION as position,
        COLUMN_DEFAULT as \`default\`,
        IS_NULLABLE as nullable,
        DATA_TYPE as dataType,
        COLUMN_TYPE as columnType,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        NUMERIC_PRECISION as numericPrecision,
        NUMERIC_SCALE as numericScale,
        COLUMN_KEY as \`key\`,
        EXTRA as extra,
        COLUMN_COMMENT as comment
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [database, tbl]);

        const indexes = await db.queryDb(database, `SHOW INDEX FROM \`${tbl}\``);
        const createSql = await db.queryDb(database, `SHOW CREATE TABLE \`${tbl}\``);

        res.json({
            columns,
            indexes,
            createSql: createSql[0]['Create Table'] || createSql[0]['Create View'],
        });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// POST /api/databases/:db/tables/:tbl/schema/columns (add column)
router.post('/:tbl/schema/columns', async (req, res) => {
    const { db: database, tbl } = req.params;
    const { name, columnType, nullable, defaultValue, comment, after } = req.body;
    try {
        let sql = `ALTER TABLE \`${tbl}\` ADD COLUMN \`${name}\` ${columnType}`;
        if (!nullable) sql += ' NOT NULL';
        if (defaultValue !== undefined && defaultValue !== '') sql += ` DEFAULT '${defaultValue}'`;
        if (comment) sql += ` COMMENT '${comment}'`;
        if (after) sql += ` AFTER \`${after}\``;
        await db.queryDb(database, sql);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// PUT /api/databases/:db/tables/:tbl/schema/columns/:col (modify column)
router.put('/:tbl/schema/columns/:col', async (req, res) => {
    const { db: database, tbl, col } = req.params;
    const { name, columnType, nullable, defaultValue, comment } = req.body;
    try {
        let sql = `ALTER TABLE \`${tbl}\` CHANGE \`${col}\` \`${name || col}\` ${columnType}`;
        if (!nullable) sql += ' NOT NULL';
        if (defaultValue !== undefined && defaultValue !== '') sql += ` DEFAULT '${defaultValue}'`;
        if (comment) sql += ` COMMENT '${comment}'`;
        await db.queryDb(database, sql);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// DELETE /api/databases/:db/tables/:tbl/schema/columns/:col
router.delete('/:tbl/schema/columns/:col', async (req, res) => {
    const { db: database, tbl, col } = req.params;
    try {
        await db.queryDb(database, `ALTER TABLE \`${tbl}\` DROP COLUMN \`${col}\``);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// POST /api/databases/:db/tables (create table)
router.post('/', async (req, res) => {
    const { db: database } = req.params;
    const { name, columns, engine, charset } = req.body;
    try {
        const colDefs = columns.map(c => {
            let def = `\`${c.name}\` ${c.columnType}`;
            if (c.nullable === false) def += ' NOT NULL';
            if (c.autoIncrement) def += ' AUTO_INCREMENT';
            if (c.default !== undefined && c.default !== '') def += ` DEFAULT '${c.default}'`;
            return def;
        });
        const pks = columns.filter(c => c.primaryKey).map(c => `\`${c.name}\``);
        if (pks.length) colDefs.push(`PRIMARY KEY (${pks.join(', ')})`);
        let sql = `CREATE TABLE \`${name}\` (${colDefs.join(', ')})`;
        if (engine) sql += ` ENGINE=${engine}`;
        if (charset) sql += ` DEFAULT CHARSET=${charset}`;
        await db.queryDb(database, sql);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// DELETE /api/databases/:db/tables/:tbl
router.delete('/:tbl', async (req, res) => {
    const { db: database, tbl } = req.params;
    const { type } = req.query; // 'view' or 'table'
    try {
        const drop = type === 'VIEW' ? 'DROP VIEW' : 'DROP TABLE';
        await db.queryDb(database, `${drop} \`${tbl}\``);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// POST /api/databases/:db/tables/:tbl/truncate
router.post('/:tbl/truncate', async (req, res) => {
    const { db: database, tbl } = req.params;
    try {
        await db.queryDb(database, `TRUNCATE TABLE \`${tbl}\``);
        res.json({ success: true });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

module.exports = router;
