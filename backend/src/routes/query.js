const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/query
router.post('/', async (req, res) => {
    const { sql, database } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL is required' });

    let conn;
    try {
        const pool = db.getPool();
        if (!pool) throw new Error('Not connected');
        conn = await pool.getConnection();

        if (database) await conn.query(`USE \`${database}\``);

        const start = Date.now();
        const result = await conn.query({ sql, bigIntAsNumber: true });
        const duration = Date.now() - start;

        // Normalize single vs multiple result sets
        const normalize = (r) => {
            if (!r) return { rows: [], fields: [], affectedRows: 0, info: '' };
            if (Array.isArray(r) && r.length > 0 && Array.isArray(r[0])) {
                // multiple result sets
                return r.map(normalize);
            }
            if (Array.isArray(r)) {
                return { rows: r, affectedRows: 0 };
            }
            return {
                rows: [],
                affectedRows: Number(r.affectedRows || 0),
                insertId: r.insertId?.toString(),
                warningCount: r.warningCount,
                info: r.info || '',
            };
        };

        res.json({ result: normalize(result), duration });
    } catch (err) {
        res.status(400).json({ error: err.message, code: err.code });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
