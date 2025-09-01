const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./utils/logger');
const bookingsRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount webhook routes AFTER JSON middleware
const webhookRoutes = require('./routes/webhook');
app.use('/webhook', webhookRoutes);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        ip: req.ip
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Cal.com Integration API'
    });
});

// API routes
app.use('/api', bookingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Cal.com Integration API Server',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            reschedule: 'POST /api/reschedule',
            cancel: 'POST /api/cancel'
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Endpoint not found',
            path: req.originalUrl,
            method: req.method
        }
    });
});

// Start server
app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
    
    // Check for required environment variables
    if (!process.env.CAL_API_KEY) {
        logger.warn('CAL_API_KEY environment variable is not set');
    }
});

module.exports = app;
