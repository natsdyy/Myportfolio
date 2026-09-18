const express = require('express');
const axios = require('axios');
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
  console.log('[contact] Request body keys:', Object.keys(req.body || {}));

  try {
    const { recaptchaToken, name, email, subject, message } = req.body || {};

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }

    console.log('[contact] Verifying reCAPTCHA...');
    await verifyRecaptcha(recaptchaToken);
    console.log('[contact] reCAPTCHA verified successfully');

    // Send email via SMTP (no database — email-only)
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log('[contact] Sending contact email...');
      const emailInfo = await sendContactEmail({
        fromEmail: email,
        fromName: name || 'Anonymous',
        subject: subject || null,
        message: message,
      });
      
      emailSent = true;
      console.log('[contact] ✅ Email sent successfully:', {
        messageId: emailInfo.messageId,
        accepted: emailInfo.accepted,
        rejected: emailInfo.rejected,
      });
    } catch (err) {
      emailError = err;
      console.error('[contact] ❌ Email error:', err.message);
    }

    res.status(201).json({
      message: 'Message received',
      emailSent,
      emailError: emailError ? {
        message: emailError.message,
        code: emailError.code
      } : null,
    });
  } catch (error) {
    console.error('[contact] Error handling message:', error);
    const statusCode = error.message?.includes('required') || error.message?.includes('verification failed') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to submit message'
    });
  }
});

module.exports = router;
