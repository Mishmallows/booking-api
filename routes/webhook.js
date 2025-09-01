const express = require('express');
const router = express.Router();

// In-memory cache for webhook-synced bookings
const bookingCache = [];

router.post('/calcom', (req, res) => {
  try {
    const {
      triggerEvent,
      uid,
      title,
      startTime,
      endTime,
      createdAt
    } = req.body;

    const attendeeName = req.body['attendees.0.name'];
    const attendeeEmail = req.body['attendees.0.email'];

    console.log('✅ Webhook received:', triggerEvent);
    console.log('Body:', req.body);

    if (triggerEvent === 'BOOKING_CREATED') {
      bookingCache.push({
        uid,
        title,
        startTime,
        endTime,
        createdAt,
        attendeeName,
        attendeeEmail
      });
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      const index = bookingCache.findIndex(b => b.uid === uid);
      if (index !== -1) bookingCache.splice(index, 1);
    }

    res.status(200).send({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).send({
      success: false,
      error: {
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Export both the route and the cache
module.exports = { router, bookingCache };
