const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Equipment types and their API keys
const EQUIPMENT_TYPES = {
    'PROJECTOR': process.env.CAL_API_KEY_PROJECTOR,
    'PLATINUM_SPEAKER': process.env.CAL_API_KEY_PLATINUM_SPEAKER,
    'LOGITECH1': process.env.CAL_API_KEY_LOGITECH1,
    'LOGITECH2': process.env.CAL_API_KEY_LOGITECH2
};

// Get API key for equipment type
const getApiKeyForEquipment = (equipmentType) => {
    return EQUIPMENT_TYPES[equipmentType?.toUpperCase()];
};

// Equipment type validation middleware
const validateEquipmentType = (req, res, next) => {
    const { equipmentType } = req.body;
    
    if (!equipmentType || typeof equipmentType !== 'string') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'equipmentType is required and must be a string',
                validTypes: Object.keys(EQUIPMENT_TYPES)
            }
        });
    }
    
    const apiKey = getApiKeyForEquipment(equipmentType);
    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: {
                message: `Invalid equipment type: ${equipmentType}`,
                validTypes: Object.keys(EQUIPMENT_TYPES)
            }
        });
    }
    
    next();
};

// Validation for reschedule endpoint
const validateRescheduleRequest = (req, res, next) => {
    const { bookingUid, startTime, endTime, rescheduledBy, reschedulingReason, equipmentType } = req.body;
    const errors = [];

    if (!bookingUid || typeof bookingUid !== 'string') {
        errors.push('bookingUid is required and must be a string');
    }
    if (!startTime || typeof startTime !== 'string') {
        errors.push('startTime is required and must be a string');
    }
    if (!endTime || typeof endTime !== 'string') {
        errors.push('endTime is required and must be a string');
    }
    if (!rescheduledBy || typeof rescheduledBy !== 'string') {
        errors.push('rescheduledBy is required and must be a string');
    }
    if (!reschedulingReason || typeof reschedulingReason !== 'string') {
        errors.push('reschedulingReason is required and must be a string');
    }
    if (!equipmentType || typeof equipmentType !== 'string') {
        errors.push('equipmentType is required and must be a string');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors
            }
        });
    }
    next();
};

// Validation for cancel endpoint
const validateCancelRequest = (req, res, next) => {
    const { bookingUid, cancellationReason, equipmentType } = req.body;
    const errors = [];

    if (!bookingUid || typeof bookingUid !== 'string') {
        errors.push('bookingUid is required and must be a string');
    }
    if (!cancellationReason || typeof cancellationReason !== 'string') {
        errors.push('cancellationReason is required and must be a string');
    }
    if (!equipmentType || typeof equipmentType !== 'string') {
        errors.push('equipmentType is required and must be a string');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors
            }
        });
    }
    next();
};

// Create Cal.com API client for specific equipment
const createCalcomClient = (equipmentType) => {
    const apiKey = getApiKeyForEquipment(equipmentType);
    return axios.create({
        baseURL: 'https://api.cal.com/v2',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13'
        }
    });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Cal.com Integration API'
    });
});

// GET /bookings endpoint - fetch upcoming bookings for all equipment
app.get('/bookings', async (req, res) => {
    try {
        console.log('Fetching upcoming bookings for all equipment types');
        
        const allBookings = [];
        const equipmentTypes = Object.keys(EQUIPMENT_TYPES);
        
        // Fetch bookings for each equipment type
        for (const equipmentType of equipmentTypes) {
            try {
                const calcomClient = createCalcomClient(equipmentType);
                const response = await calcomClient.get('/bookings');
                
                // Process and format bookings for this equipment
                if (response.data && response.data.bookings) {
                    const formattedBookings = response.data.bookings
                        .filter(booking => {
                            // Only include upcoming bookings
                            const startTime = new Date(booking.startTime);
                            return startTime > new Date();
                        })
                        .map(booking => ({
                            uid: booking.uid,
                            equipmentType: equipmentType,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            attendeeEmail: booking.attendees?.[0]?.email || 'No email',
                            title: booking.title || 'Equipment Booking',
                            status: booking.status
                        }));
                    
                    allBookings.push(...formattedBookings);
                }
            } catch (equipmentError) {
                console.error(`Failed to fetch bookings for ${equipmentType}:`, equipmentError.message);
                // Continue with other equipment types even if one fails
            }
        }
        
        // Sort by start time
        allBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        res.status(200).json({
            success: true,
            data: {
                bookings: allBookings,
                totalCount: allBookings.length,
                equipmentTypes: equipmentTypes
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Failed to fetch bookings:', error.message);
        
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch upcoming bookings',
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Cal.com Integration API Server',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            bookings: 'GET /bookings',
            reschedule: 'POST /reschedule',
            cancel: 'POST /cancel'
        },
        supportedEquipment: Object.keys(EQUIPMENT_TYPES)
    });
});

// POST /reschedule endpoint
app.post('/reschedule', validateEquipmentType, validateRescheduleRequest, async (req, res) => {
    try {
        const { bookingUid, startTime, endTime, rescheduledBy, reschedulingReason, equipmentType } = req.body;
        
        console.log('Processing reschedule request:', { bookingUid, startTime, endTime, equipmentType });

        const calcomClient = createCalcomClient(equipmentType);
        const payload = {
            bookingUid,
            startTime,
            endTime,
            rescheduledBy,
            reschedulingReason
        };

        const response = await calcomClient.patch(`/bookings/${bookingUid}/reschedule`, {
            start: startTime,
            reschedulingReason
        });
        
        res.status(response.status || 200).json({
            success: true,
            message: 'Booking rescheduled successfully',
            data: response.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to reschedule booking:', error.message);
        
        let errorResponse = {
            success: false,
            error: {
                message: 'Failed to reschedule booking',
                timestamp: new Date().toISOString()
            }
        };

        if (error.response) {
            errorResponse.error.details = error.response.data;
            res.status(error.response.status).json(errorResponse);
        } else {
            res.status(500).json(errorResponse);
        }
    }
});

// POST /cancel endpoint
app.post('/cancel', validateEquipmentType, validateCancelRequest, async (req, res) => {
    try {
        const { bookingUid, cancellationReason, equipmentType } = req.body;
        
        console.log('Processing cancel request:', { bookingUid, equipmentType });

        const calcomClient = createCalcomClient(equipmentType);
        const payload = {
            bookingUid,
            cancellationReason
        };

        const response = await calcomClient.delete(`/bookings/${bookingUid}/cancel`, {
            data: {
                cancellationReason,
                allRemainingBookings: false
            }
        });
        
        res.status(response.status || 200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: response.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to cancel booking:', error.message);
        
        let errorResponse = {
            success: false,
            error: {
                message: 'Failed to cancel booking',
                timestamp: new Date().toISOString()
            }
        };

        if (error.response) {
            errorResponse.error.details = error.response.data;
            res.status(error.response.status).json(errorResponse);
        } else {
            res.status(500).json(errorResponse);
        }
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
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
    console.log(`Server running on http://${HOST}:${PORT}`);
    
    if (!process.env.CAL_API_KEY) {
        console.warn('CAL_API_KEY environment variable is not set');
    }
});

module.exports = app;