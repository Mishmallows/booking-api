const logger = require('../utils/logger');

/**
 * Validates reschedule request body
 */
const validateRescheduleRequest = (req, res, next) => {
    const { bookingUid, startTime, endTime, rescheduledBy, reschedulingReason } = req.body;
    const errors = [];

    // Required field validation
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

    // Date validation
    if (startTime && !isValidDate(startTime)) {
        errors.push('startTime must be a valid ISO 8601 date string');
    }

    if (endTime && !isValidDate(endTime)) {
        errors.push('endTime must be a valid ISO 8601 date string');
    }

    // Time range validation
    if (startTime && endTime && isValidDate(startTime) && isValidDate(endTime)) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (start >= end) {
            errors.push('startTime must be before endTime');
        }

        if (start < new Date()) {
            errors.push('startTime cannot be in the past');
        }
    }

    if (errors.length > 0) {
        logger.warn('Reschedule request validation failed:', { errors, body: req.body });
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

/**
 * Validates cancel request body
 */
const validateCancelRequest = (req, res, next) => {
    const { bookingUid, cancellationReason } = req.body;
    const errors = [];

    // Required field validation
    if (!bookingUid || typeof bookingUid !== 'string') {
        errors.push('bookingUid is required and must be a string');
    }

    if (!cancellationReason || typeof cancellationReason !== 'string') {
        errors.push('cancellationReason is required and must be a string');
    }

    // Length validation
    if (cancellationReason && cancellationReason.length < 3) {
        errors.push('cancellationReason must be at least 3 characters long');
    }

    if (errors.length > 0) {
        logger.warn('Cancel request validation failed:', { errors, body: req.body });
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

/**
 * Validates API key presence
 */
const validateApiKey = (req, res, next) => {
    const apiKey = process.env.CAL_API_KEY;
    
    if (!apiKey) {
        logger.error('CAL_API_KEY environment variable is not configured');
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server configuration error: API key not configured'
            }
        });
    }

    next();
};

/**
 * Helper function to validate ISO 8601 date strings
 */
const isValidDate = (dateString) => {
    try {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.includes('T');
    } catch {
        return false;
    }
};

module.exports = {
    validateRescheduleRequest,
    validateCancelRequest,
    validateApiKey
};
