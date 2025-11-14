const express = require('express');
const { pool } = require('../db');
const { verifyIdToken } = require('../services/googleAuth');

const router = express.Router();

router.post('/contact', async (req, res) => {
  try {
    const { idToken, subject, message } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const profile = await verifyIdToken(idToken);

    const userResult = await pool.query(
      `
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id) DO UPDATE
        SET email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url
      RETURNING id, google_id, email, name, avatar_url, created_at;
    `,
      [profile.googleId, profile.email, profile.name, profile.avatarUrl]
    );

    const user = userResult.rows[0];

    const messageResult = await pool.query(
      `
      INSERT INTO messages (user_id, subject, body)
      VALUES ($1, $2, $3)
      RETURNING id, subject, body, created_at;
    `,
      [user.id, subject || null, message]
    );

    const savedMessage = messageResult.rows[0];

    res.status(201).json({
      message: 'Message received',
      data: {
        message: savedMessage,
        user,
      },
    });
  } catch (error) {
    console.error('[contact] Error handling message', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

module.exports = router;

