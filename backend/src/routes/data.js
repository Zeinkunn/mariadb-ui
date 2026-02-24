const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/databases/:db/tables/:tbl/data
router.get('/:tbl/data', async (req, res) => {
    const { db: database, tbl } = req.params;
    const { page = 1, limit = 100, sort, order, search, column } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Get columns
        const cols = await db.queryDb(database, `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION`, [database, tbl]);

        let where = '';
        let params = [];
        if (search && column) {
            where = `WHERE \`${column}\` LIKE ?`;
            params.push(`%${search}%`);
        }

        let orderClause = '';
        if (sort) {
            orderClause = `ORDER BY \`${sort}\` ${order === 'desc' ? 'DESC' : 'ASC'}`;
        }

        const countResult = await db.queryDb(database, `SELECT COUNT(*) as total FROM \`${tbl}\` ${where}`, params);
        const total = Number(countResult[0].total);

        const rows = await db.queryDb(database, `SELECT * FROM \`${tbl}\` ${where} ${orderClause} LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

        res.json({ rows, total, columns: cols.map(c => c.COLUMN_NAME), page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// POST /api/databases/:db/tables/:tbl/data (insert row)
router.post('/:tbl/data', async (req, res) => {
    const { db: database, tbl } = req.params;
    const row = req.body;
    try {
        const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
        const vals = Object.values(row);
        const placeholders = vals.map(() => '?').join(', ');
        const result = await db.queryDb(database, `INSERT INTO \`${tbl}\` (${keys}) VALUES (${placeholders})`, vals);
        res.json({ success: true, insertId: result.insertId?.toString() });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// PUT /api/databases/:db/tables/:tbl/data (update row by primary key fields)
router.put('/:tbl/data', async (req, res) => {
    const { db: database, tbl } = req.params;
    const { where, set } = req.body;
    try {
        const setClause = Object.keys(set).map(k => `\`${k}\` = ?`).join(', ');
        const setVals = Object.values(set);
        const whereClause = Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
        const whereVals = Object.values(where);
        const result = await db.queryDb(database, `UPDATE \`${tbl}\` SET ${setClause} WHERE ${whereClause}`, [...setVals, ...whereVals]);
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

// DELETE /api/databases/:db/tables/:tbl/data (delete rows by where)
router.delete('/:tbl/data', async (req, res) => {
    const { db: database, tbl } = req.params;
    const { where } = req.body;
    try {
        const whereClause = Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
        const whereVals = Object.values(where);
        const result = await db.queryDb(database, `DELETE FROM \`${tbl}\` WHERE ${whereClause}`, whereVals);
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error("DEBUG:", err); res.status(500).json({ error: err.message });
    }
});

module.exports = router;
