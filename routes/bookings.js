const express = require('express');
const router = express.Router();
const calcomService = require('../services/calcom');
const { validateRescheduleRequest, validateCancelRequest, validateApiKey } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * POST /api/reschedule
 * Reschedule a booking
 */
router.post('/reschedule', validateApiKey, validateRescheduleRequest, async (req, res) => {
    try {
        const { bookingUid, startTime, endTime, rescheduledBy, reschedulingReason } = req.body;
        
        logger.info('Processing reschedule request:', { 
            bookingUid, 
            startTime, 
            endTime, 
            rescheduledBy 
        });

        const result = await calcomService.rescheduleBooking({
            bookingUid,
            startTime,
            endTime,
            rescheduledBy,
            reschedulingReason
        });

        if (result.success) {
            res.status(result.status || 200).json({
                success: true,
                message: 'Booking rescheduled successfully',
                data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.status || 400).json(result);
        }

    } catch (error) {
        logger.error('Unexpected error in reschedule endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while processing reschedule request',
                timestamp: new Date().toISOString()
            }
        });
    }
});
/** 
 * GET /api/bookings 
 * Fetch upcoming bookings 
 */
router.get('/bookings', validateApiKey, async (req, res) => {
    try {
        const bookings = await calcomService.getUpcomingBookings(); // You’ll define this in services/calcom.js

        res.status(200).json({
            success: true,
            data: { bookings },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch bookings',
                timestamp: new Date().toISOString()
            }
        });
    }
});
/**
 * POST /api/cancel
 * Cancel a booking
 */
router.post('/cancel', validateApiKey, validateCancelRequest, async (req, res) => {
    try {
        const { bookingUid, cancellationReason } = req.body;
        
        logger.info('Processing cancel request:', { 
            bookingUid, 
            reason: cancellationReason 
        });

        const result = await calcomService.cancelBooking({
            bookingUid,
            cancellationReason
        });

        if (result.success) {
            res.status(result.status || 200).json({
                success: true,
                message: 'Booking cancelled successfully',
                data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.status || 400).json(result);
        }

    } catch (error) {
        logger.error('Unexpected error in cancel endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while processing cancellation request',
                timestamp: new Date().toISOString()
            }
        });
    }
});

module.exports = router;
