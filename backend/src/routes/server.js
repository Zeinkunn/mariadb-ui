const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/server/status
router.get('/status', async (req, res) => {
    try {
        const rows = await db.query('SHOW GLOBAL STATUS');
        const obj = {};
        rows.forEach(r => { obj[r.Variable_name] = r.Value; });
        res.json(obj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/server/variables
router.get('/variables', async (req, res) => {
    try {
        const rows = await db.query('SHOW GLOBAL VARIABLES');
        const obj = {};
        rows.forEach(r => { obj[r.Variable_name] = r.Value; });
        res.json(obj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/server/variables/:name
router.put('/variables/:name', async (req, res) => {
    const { value } = req.body;
    try {
        await db.query(`SET GLOBAL \`${req.params.name}\` = ?`, [value]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/server/processes
router.get('/processes', async (req, res) => {
    try {
        const rows = await db.query('SHOW FULL PROCESSLIST');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/server/processes/:id
router.delete('/processes/:id', async (req, res) => {
    try {
        await db.query(`KILL ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/server/charsets
router.get('/charsets', async (req, res) => {
    try {
        const rows = await db.query('SHOW CHARACTER SET');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/server/collations
router.get('/collations', async (req, res) => {
    try {
        const rows = await db.query('SHOW COLLATION');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
