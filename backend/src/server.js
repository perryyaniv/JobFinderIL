require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const jobRoutes = require('./routes/jobs');
const scrapeRoutes = require('./routes/scrape');
const { initScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// ------ Middleware ------

// Security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
}));

// JSON body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path !== '/api/health') {
            logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

// ------ Routes ------

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// Job routes
app.use('/api/jobs', jobRoutes);

// Scrape management routes
app.use('/api/scrape', scrapeRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

// ------ Start Server ------

connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`JobFinder API server running on port ${PORT}`);
        logger.info(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);

        // Initialize the scraping scheduler
        if (process.env.NODE_ENV !== 'test') {
            initScheduler();
        }
    });
});

module.exports = app;
