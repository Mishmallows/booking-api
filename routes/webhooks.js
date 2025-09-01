const express = require('express');
const router = express.Router();

router.post('/webhook/calcom', (req, res) => {
  const { triggerEvent, payload } = req.body;

  console.log(`🔔 Webhook received: ${triggerEvent}`);
  console.log('Payload:', payload);

  // TODO: Save booking info to database or in-memory cache
  // Example: store bookingUid, title, equipmentType, startTime, endTime

  res.status(200).send({ received: true });
});

module.exports = router;
