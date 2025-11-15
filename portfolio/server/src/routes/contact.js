const express = require('express');
const axios = require('axios');
const { pool } = require('../db');
const { verifyIdToken } = require('../services/googleAuth');
const { sendContactEmail } = require('../services/emailService');
const { config } = require('../config');

const router = express.Router();

// Handle OPTIONS for this route
router.options('/contact', (req, res) => {
  res.sendStatus(200);
});

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
      const errorCodes = response.data['error-codes'] || [];
      console.error('[contact] reCAPTCHA verification failed:', errorCodes);
      
      // Provide more specific error messages
      if (errorCodes.includes('invalid-input-secret') || errorCodes.includes('invalid-input-response')) {
        throw new Error('reCAPTCHA configuration error. Please check your keys.');
      }
      if (errorCodes.includes('timeout-or-duplicate')) {
        throw new Error('reCAPTCHA token expired. Please try again.');
      }
      
      throw new Error('reCAPTCHA verification failed');
    }

    return true;
  } catch (error) {
    console.error('[contact] reCAPTCHA verification error', error);
    throw new Error('reCAPTCHA verification failed');
  }
};

router.post('/contact', async (req, res) => {
  console.log('[contact] POST /contact route hit!');
  console.log('[contact] Request method:', req.method);
  console.log('[contact] Request path:', req.path);
  console.log('[contact] Request body keys:', Object.keys(req.body || {}));
  console.log('[contact] Received request:', {
    hasIdToken: !!req.body?.idToken,
    hasRecaptchaToken: !!req.body?.recaptchaToken,
    hasMessage: !!req.body?.message,
    messageLength: req.body?.message?.length
  });

  try {
    const { idToken, recaptchaToken, subject, message } = req.body || {};

    if (!idToken) {
      console.error('[contact] Missing idToken');
      return res.status(400).json({ error: 'idToken is required' });
    }
    if (!recaptchaToken) {
      console.error('[contact] Missing recaptchaToken');
      return res.status(400).json({ error: 'reCAPTCHA token is required' });
    }
    if (!message || typeof message !== 'string') {
      console.error('[contact] Missing or invalid message');
      return res.status(400).json({ error: 'message is required' });
    }

    console.log('[contact] Verifying reCAPTCHA...');
    // Verify reCAPTCHA
    await verifyRecaptcha(recaptchaToken);
    console.log('[contact] reCAPTCHA verified successfully');

    console.log('[contact] Verifying Google ID token...');
    const profile = await verifyIdToken(idToken);
    console.log('[contact] Google ID token verified:', { email: profile.email, name: profile.name });

    console.log('[contact] Saving account to database...');
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
    console.log('[contact] Message saved to database:', savedMessage.id);

    // Send email via SMTP
    try {
      console.log('[contact] Sending email via SMTP...');
      console.log('[contact] SMTP Config:', {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_TO: process.env.SMTP_TO,
        SMTP_FROM: process.env.SMTP_FROM,
        hasSMTP_PASS: !!process.env.SMTP_PASS
      });
      
      const emailInfo = await sendContactEmail({
        fromEmail: account.email,
        fromName: account.name,
        subject: subject || null,
        message: message,
      });
      
      console.log('[contact] Email sent successfully:', {
        messageId: emailInfo.messageId,
        accepted: emailInfo.accepted,
        rejected: emailInfo.rejected,
        response: emailInfo.response
      });
    } catch (emailError) {
      // Log comprehensive error information
      console.error('[contact] ========== EMAIL ERROR ==========');
      console.error('[contact] Error message:', emailError.message);
      console.error('[contact] Error code:', emailError.code);
      console.error('[contact] Error command:', emailError.command);
      console.error('[contact] Error response:', emailError.response);
      console.error('[contact] Error responseCode:', emailError.responseCode);
      console.error('[contact] Error stack:', emailError.stack);
      console.error('[contact] Full error object:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
      console.error('[contact] =================================');
      
      // Still return success to user, but log the error prominently
      // This way we can see what's wrong in logs without breaking the user experience
    }

    console.log('[contact] Request completed successfully');
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
    console.error('[contact] Error handling message:', error);
    console.error('[contact] Error stack:', error.stack);
    const statusCode = error.message?.includes('required') || error.message?.includes('verification failed') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to submit message',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

