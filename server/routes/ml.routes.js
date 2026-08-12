const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// ML Service proxy routes
router.use(authenticate);

router.post('/predict/wait-time', async (req, res) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${mlUrl}/predict/wait-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      return res.json({
        success: true,
        data: {
          predictedWaitTime: Math.floor(Math.random() * 30) + 5,
          confidence: 0.75,
          note: 'ML service unavailable — using estimate.',
        },
      });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    // Fallback when ML service is not running
    res.json({
      success: true,
      data: {
        predictedWaitTime: Math.floor(Math.random() * 30) + 5,
        confidence: 0.6,
        note: 'ML service unavailable — using estimate.',
      },
    });
  }
});

router.post('/predict/disease-risk', async (req, res) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${mlUrl}/predict/disease-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      return res.json({
        success: true,
        data: {
          risks: [
            { disease: 'Hypertension', probability: 0.35, severity: 'moderate' },
            { disease: 'Type 2 Diabetes', probability: 0.22, severity: 'low' },
          ],
          note: 'ML service unavailable — using sample predictions.',
        },
      });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    res.json({
      success: true,
      data: {
        risks: [
          { disease: 'Hypertension', probability: 0.35, severity: 'moderate' },
          { disease: 'Type 2 Diabetes', probability: 0.22, severity: 'low' },
        ],
        note: 'ML service unavailable — using sample predictions.',
      },
    });
  }
});

module.exports = router;
