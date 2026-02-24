const mariadb = require('mariadb');

let pool = null;
let currentConfig = null;

function createPool(config) {
    if (pool) {
        pool.end().catch(() => { });
    }
    currentConfig = config;
    pool = mariadb.createPool({
        host: config.host || 'localhost',
        port: parseInt(config.port) || 3306,
        user: config.user,
        password: config.password,
        connectionLimit: 10,
        acquireTimeout: 10000,
        connectTimeout: 10000,
        multipleStatements: true,
    });
    return pool;
}

function getPool() {
    return pool;
}

function getConfig() {
    return currentConfig;
}

async function query(sql, params) {
    if (!pool) throw new Error('Not connected to any database.');
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(sql, params);
        return result;
    } finally {
        if (conn) conn.release();
    }
}

async function queryDb(database, sql, params) {
    if (!pool) throw new Error('Not connected to any database.');
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`USE \`${database}\``);
        const result = await conn.query(sql, params);
        return result;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { createPool, getPool, getConfig, query, queryDb };
