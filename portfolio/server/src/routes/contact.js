const express = require('express');
const axios = require('axios');
const { pool } = require('../db');
const { verifyIdToken } = require('../services/googleAuth');
const { sendContactEmail } = require('../services/emailService');
const { config } = require('../config');

const router = express.Router();

const verifyRecaptcha = async (token) => {
  if (!token) {
    throw new Error('reCAPTCHA token is required');
  }

  if (!config.recaptchaSecretKey) {
    console.warn('[contact] reCAPTCHA secret key not configured, skipping verification');
    return true;
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: config.recaptchaSecretKey,
          response: token,
        },
      }
    );

    if (!response.data.success) {
      throw new Error('reCAPTCHA verification failed');
    }

    return true;
  } catch (error) {
    console.error('[contact] reCAPTCHA verification error', error);
    throw new Error('reCAPTCHA verification failed');
  }
};

router.post('/contact', async (req, res) => {
  try {
    const { idToken, recaptchaToken, subject, message } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // Verify reCAPTCHA
    await verifyRecaptcha(recaptchaToken);

    const profile = await verifyIdToken(idToken);

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

    const messageResult = await pool.query(
      `
      INSERT INTO messages (account_id, subject, body)
      VALUES ($1, $2, $3)
      RETURNING id, subject, body, created_at;
    `,
      [account.id, subject || null, message]
    );

    const savedMessage = messageResult.rows[0];

    // Send email via SMTP
    try {
      await sendContactEmail({
        fromEmail: account.email,
        fromName: account.name,
        subject: subject || null,
        message: message,
      });
    } catch (emailError) {
      console.error('[contact] Error sending email', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.status(201).json({
      message: 'Message received',
      data: {
        message: savedMessage,
        account: {
          ...account,
          role,
        },
      },
    });
  } catch (error) {
    console.error('[contact] Error handling message', error);
    res.status(500).json({ error: error.message || 'Failed to submit message' });
  }
});

module.exports = router;

