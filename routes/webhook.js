const express = require('express');
const router = express.Router();

// ✅ This is your in-memory cache
const bookingCache = [];

router.post('/calcom', (req, res) => {
  try {
    const { triggerEvent, uid, title, startTime, endTime } = req.body;
    const attendeeName = req.body['attendees.0.name'];
    const attendeeEmail = req.body['attendees.0.email'];

    console.log('📥 Incoming webhook:', triggerEvent, uid);

    if (triggerEvent === 'BOOKING_CREATED') {
      bookingCache.push({
        uid,
        title,
        startTime,
        endTime,
        attendeeName,
        attendeeEmail,
        status: 'Created'
      });
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      const index = bookingCache.findIndex(b => b.uid === uid);
      if (index !== -1) bookingCache[index].status = 'Cancelled';
    }

    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      const index = bookingCache.findIndex(b => b.uid === uid);
      if (index !== -1) bookingCache[index].status = 'Rescheduled';
    }

    res.status(200).send({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  }
});

module.exports = { router, bookingCache };
