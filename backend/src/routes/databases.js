const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/databases
router.get('/', async (req, res) => {
    try {
        const rows = await db.query('SHOW DATABASES');
        res.json(rows.map(r => r.Database));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/databases
router.post('/', async (req, res) => {
    const { name, charset, collation } = req.body;
    if (!name) return res.status(400).json({ error: 'Database name required' });
    try {
        let sql = `CREATE DATABASE \`${name}\``;
        if (charset) sql += ` CHARACTER SET ${charset}`;
        if (collation) sql += ` COLLATE ${collation}`;
        await db.query(sql);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/databases/:db
router.delete('/:db', async (req, res) => {
    try {
        await db.query(`DROP DATABASE \`${req.params.db}\``);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/databases/:db/tables
router.get('/:db/tables', async (req, res) => {
    try {
        const rows = await db.queryDb(req.params.db, `
      SELECT 
        TABLE_NAME as name,
        TABLE_TYPE as type,
        TABLE_ROWS as \`rows\`,
        DATA_LENGTH as dataSize,
        INDEX_LENGTH as indexSize,
        CREATE_TIME as createTime,
        TABLE_COMMENT as comment,
        ENGINE as engine,
        TABLE_COLLATION as collation
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [req.params.db]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/databases/:db/info
router.get('/:db/info', async (req, res) => {
    try {
        const rows = await db.query(`
      SELECT DEFAULT_CHARACTER_SET_NAME as charset, DEFAULT_COLLATION_NAME as collation
      FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?
    `, [req.params.db]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
