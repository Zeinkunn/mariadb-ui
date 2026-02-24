const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const rows = await db.query(`
      SELECT User as user, Host as host, plugin 
      FROM mysql.user ORDER BY User, Host
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users (create user)
router.post('/', async (req, res) => {
    const { user, host = '%', password } = req.body;
    if (!user) return res.status(400).json({ error: 'Username required' });
    try {
        await db.query(`CREATE USER '${user}'@'${host}' IDENTIFIED BY ?`, [password || '']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:user/:host/password
router.put('/:user/:host/password', async (req, res) => {
    const { user, host } = req.params;
    const { password } = req.body;
    try {
        await db.query(`ALTER USER '${user}'@'${host}' IDENTIFIED BY ?`, [password]);
        await db.query(`FLUSH PRIVILEGES`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:user/:host
router.delete('/:user/:host', async (req, res) => {
    const { user, host } = req.params;
    try {
        await db.query(`DROP USER '${user}'@'${host}'`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:user/:host/grants
router.get('/:user/:host/grants', async (req, res) => {
    const { user, host } = req.params;
    try {
        const rows = await db.query(`SHOW GRANTS FOR '${user}'@'${host}'`);
        res.json(rows.map(r => Object.values(r)[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:user/:host/grants (grant)
router.post('/:user/:host/grants', async (req, res) => {
    const { user, host } = req.params;
    const { privileges, on, withGrant } = req.body;
    // on: { database: '*', table: '*' }
    const db_tbl = `\`${on.database || '*'}\`.\`${on.table || '*'}\``;
    const privStr = on.database === '*' && on.table === '*' ? privileges : privileges;
    try {
        let sql = `GRANT ${privStr} ON ${db_tbl} TO '${user}'@'${host}'`;
        if (withGrant) sql += ' WITH GRANT OPTION';
        await db.query(sql);
        await db.query('FLUSH PRIVILEGES');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:user/:host/grants (revoke)
router.delete('/:user/:host/grants', async (req, res) => {
    const { user, host } = req.params;
    const { privileges, on } = req.body;
    const db_tbl = `\`${on.database || '*'}\`.\`${on.table || '*'}\``;
    try {
        await db.query(`REVOKE ${privileges} ON ${db_tbl} FROM '${user}'@'${host}'`);
        await db.query('FLUSH PRIVILEGES');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
