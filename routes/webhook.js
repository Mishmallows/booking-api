const express = require('express');
const router = express.Router();

router.post('/calcom', (req, res) => {
  try {
    const {
      triggerEvent,
      createdAt,
      title,
      startTime,
      endTime,
      uid
    } = req.body;

    const attendeeName = req.body['attendees.0.name'];
    const attendeeEmail = req.body['attendees.0.email'];

    console.log('🔔 Webhook received:', triggerEvent);
    console.log('UID:', uid);
    console.log('Title:', title);
    console.log('Start:', startTime);
    console.log('End:', endTime);
    console.log('Created At:', createdAt);
    console.log('Attendee Name:', attendeeName);
    console.log('Attendee Email:', attendeeEmail);

    // You can now save this to a database or cache

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

module.exports = router;
