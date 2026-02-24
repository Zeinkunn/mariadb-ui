const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Global BigInt serialization for JSON
BigInt.prototype.toJSON = function () { return this.toString() };

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/connect', require('./routes/connection'));
app.use('/api/query', require('./routes/query'));
app.use('/api/users', require('./routes/users'));
app.use('/api/server', require('./routes/server'));
app.use('/api/export', require('./routes/importexport'));
app.use('/api/import', require('./routes/importexport'));
app.use('/api/databases', require('./routes/databases'));

// Table-level routes (nested under databases)
const tablesRouter = require('./routes/tables');
const dataRouter = require('./routes/data');
app.use('/api/databases/:db/tables', tablesRouter);
app.use('/api/databases/:db/tables', dataRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`MariaDB UI backend running on http://localhost:${PORT}`);
});
