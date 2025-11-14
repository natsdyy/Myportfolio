const express = require('express');
const { pool } = require('../db');
const { verifyIdToken } = require('../services/googleAuth');

const router = express.Router();

// Get current user info with role
router.post('/me', async (req, res) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ error: 'idToken is required' });
    }

    const profile = await verifyIdToken(idToken);

    // Get or create account
    const accountResult = await pool.query(
      `
      INSERT INTO accounts (google_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id) DO UPDATE
        SET email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
      RETURNING id, google_id, email, name, avatar_url, role_id, created_at;
    `,
      [profile.googleId, profile.email, profile.name, profile.avatarUrl]
    );

    const account = accountResult.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    res.json({
      account: {
        ...account,
        role,
      },
    });
  } catch (error) {
    console.error('[auth] Error getting user info', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

module.exports = router;

