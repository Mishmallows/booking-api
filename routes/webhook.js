const express = require('express');
const router = express.Router();

router.post('/calcom', (req, res) => {
  try {
    console.log('✅ Webhook ping received');
    console.log('Body:', req.body);

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
