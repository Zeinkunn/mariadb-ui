const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/connect
router.post('/', async (req, res) => {
    const { host, port, user, password } = req.body;
    if (!user) return res.status(400).json({ error: 'User is required' });

    try {
        const pool = db.createPool({ host, port, user, password });
        // Test connection
        const conn = await pool.getConnection();
        const rows = await conn.query('SELECT VERSION() as version, USER() as currentUser');
        conn.release();
        res.json({
            success: true,
            version: rows[0].version,
            currentUser: rows[0].currentUser,
        });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// GET /api/connect/status
router.get('/status', (req, res) => {
    const pool = db.getPool();
    const config = db.getConfig();
    if (!pool) return res.json({ connected: false });
    res.json({ connected: true, config: { host: config.host, port: config.port, user: config.user } });
});

// DELETE /api/connect
router.delete('/', (req, res) => {
    const pool = db.getPool();
    if (pool) pool.end().catch(() => { });
    res.json({ success: true });
});

module.exports = router;
