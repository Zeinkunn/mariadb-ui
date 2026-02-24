const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const upload = multer({ dest: '/tmp/mariadb-ui-uploads/' });

// GET /api/export/:database  → SQL dump
router.get('/:database', async (req, res) => {
    const { database } = req.params;
    const { tables } = req.query; // optional comma-separated table list

    try {
        let conn;
        const pool = db.getPool();
        if (!pool) throw new Error('Not connected');
        conn = await pool.getConnection();
        await conn.query(`USE \`${database}\``);

        let tableList;
        if (tables) {
            tableList = tables.split(',').map(t => t.trim());
        } else {
            const rows = await conn.query('SHOW TABLES');
            tableList = rows.map(r => Object.values(r)[0]);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${database}.sql"`);

        res.write(`-- MariaDB Web UI Export\n-- Database: ${database}\n-- Generated: ${new Date().toISOString()}\n\n`);
        res.write(`CREATE DATABASE IF NOT EXISTS \`${database}\`;\nUSE \`${database}\`;\n\n`);

        for (const tbl of tableList) {
            const createRows = await conn.query(`SHOW CREATE TABLE \`${tbl}\``);
            const createSql = createRows[0]['Create Table'] || createRows[0]['Create View'];
            res.write(`DROP TABLE IF EXISTS \`${tbl}\`;\n${createSql};\n\n`);

            const rows = await conn.query(`SELECT * FROM \`${tbl}\``);
            if (rows.length > 0) {
                const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
                const chunks = [];
                for (let i = 0; i < rows.length; i += 100) {
                    const slice = rows.slice(i, i + 100);
                    const values = slice.map(row =>
                        '(' + Object.values(row).map(v =>
                            v === null ? 'NULL' : `'${String(v).replace(/'/g, "\\'")}'`
                        ).join(', ') + ')'
                    ).join(',\n');
                    chunks.push(`INSERT INTO \`${tbl}\` (${cols}) VALUES\n${values};\n`);
                }
                res.write(chunks.join('\n') + '\n');
            }
        }

        conn.release();
        res.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/export/:database/:table/csv
router.get('/:database/:table/csv', async (req, res) => {
    const { database, table } = req.params;
    try {
        const rows = await db.queryDb(database, `SELECT * FROM \`${table}\``);
        if (!rows.length) return res.send('');
        const cols = Object.keys(rows[0]);
        const csv = [cols.join(','), ...rows.map(r =>
            cols.map(c => {
                const val = r[c];
                if (val === null) return '';
                const str = String(val);
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(',')
        )].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${database}-${table}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/import  → execute uploaded .sql file
router.post('/', upload.single('file'), async (req, res) => {
    const { database } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const fs = require('fs');
        const sql = fs.readFileSync(req.file.path, 'utf8');
        fs.unlinkSync(req.file.path);

        const pool = db.getPool();
        if (!pool) throw new Error('Not connected');
        let conn = await pool.getConnection();
        if (database) await conn.query(`USE \`${database}\``);
        await conn.query(sql);
        conn.release();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
