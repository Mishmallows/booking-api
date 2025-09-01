const express = require('express');
const router = express.Router();

router.post('/calcom', (req, res) => {
  try {
    const data = req.body;

    console.log(`🔔 Webhook received: ${data.triggerEvent}`);
    console.log('Booking UID:', data.bookingUid);
    console.log('Equipment Type:', data.equipmentType);
    console.log('Start Time:', data.startTime);
    console.log('End Time:', data.endTime);
    console.log('Attendee Email:', data.attendeeEmail);

    // TODO: Save to database or cache

    res.status(200).send({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
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
