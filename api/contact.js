// Vercel serverless function for the contact form.
// Maps to POST /api/contact.
//
// Email-only — no database required. Validates reCAPTCHA then sends
// the message via SMTP/Resend.

import nodemailer from 'nodemailer';

// ── reCAPTCHA verification ────────────────────────────────────
async function verifyRecaptcha(token) {
    if (!token) throw new Error('reCAPTCHA token is required');

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.warn('[contact] reCAPTCHA secret key not configured, skipping verification');
        return true;
    }

    const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
        { method: 'POST' }
    );
    const data = await response.json();

    if (!data.success) {
        const codes = data['error-codes'] || [];
        console.error('[contact] reCAPTCHA verification failed:', codes);
        if (codes.includes('timeout-or-duplicate')) {
            throw new Error('reCAPTCHA token expired. Please try again.');
        }
        throw new Error('reCAPTCHA verification failed');
    }

    return true;
}

// ── Email sender ──────────────────────────────────────────────
async function sendEmail({ fromEmail, fromName, subject, message }) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Portfolio Contact'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: process.env.SMTP_TO || process.env.SMTP_USER,
        replyTo: fromEmail,
        subject: subject || `New message from ${fromName}`,
        text: `From: ${fromName} <${fromEmail}>\n\n${message}`,
        html: `<p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
    };

    return transporter.sendMail(mailOptions);
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        await verifyRecaptcha(recaptchaToken);

        let emailSent = false;
        let emailError = null;

        try {
            await sendEmail({
                fromEmail: email,
                fromName: name || 'Anonymous',
                subject: subject || null,
                message,
            });
            emailSent = true;
        } catch (err) {
            emailError = err;
            console.error('[contact] Email error:', err.message);
        }

        return res.status(201).json({
            message: 'Message received',
            emailSent,
            emailError: emailError ? { message: emailError.message, code: emailError.code } : null,
        });
    } catch (error) {
        console.error('[contact] Error:', error.message);
        const statusCode = error.message?.includes('required') || error.message?.includes('verification') ? 400 : 500;
        return res.status(statusCode).json({ error: error.message || 'Failed to submit message' });
    }
};
