const nodemailer = require('nodemailer');
const axios = require('axios');

// Try to use Resend package if available, otherwise use HTTP API
let Resend;
try {
  Resend = require('resend');
} catch (e) {
  // Resend package not installed, will use HTTP API instead
  Resend = null;
}

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';

  console.log('[email-service] Creating transporter:', {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    hasPass: !!process.env.SMTP_PASS
  });

  // Build transporter config
  const transporterConfig = {
    host,
    port,
    secure, // true for 465, false for 587 (TLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Increased timeouts for Railway network
    connectionTimeout: 30000,
    socketTimeout: 30000,
    greetingTimeout: 15000,
  };

  // Add TLS options for port 587 (TLS)
  if (port === 587) {
    transporterConfig.tls = {
      rejectUnauthorized: false,
      // Use modern TLS ciphers
      ciphers: 'SSLv3'
    };
    transporterConfig.secure = false; // Explicitly set for TLS
  }

  // For port 465 (SSL), use secure connection
  if (port === 465) {
    transporterConfig.secure = true;
  }

  return nodemailer.createTransport(transporterConfig);
};

// Try using Resend (HTTP API) first, fall back to SMTP if Resend is not configured
const sendContactEmailViaResend = async ({ fromEmail, fromName, subject, message }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const businessEmail = process.env.SMTP_TO || process.env.SMTP_USER || process.env.SMTP_FROM || 'businessemail.charlesalvaran@gmail.com';
  const businessName = process.env.SMTP_FROM_NAME || 'Charles Louie Alvaran';

  console.log('[email-service] Using Resend API to send email');
  
  // Resend 'from' email must be from a verified domain
  // Use onboarding@resend.dev for testing, or your verified domain for production
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  const emailData = {
    from: `${businessName} <${resendFromEmail}>`,
    to: [businessEmail],
    replyTo: `${fromName} <${fromEmail}>`, // This can be any email - recipients will reply here
    subject: subject || `New Contact Form Message from ${fromName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">New Contact Form Message</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${fromName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${fromEmail}</p>
          ${subject ? `<p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
          <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This message was sent from your portfolio contact form at ${process.env.VITE_API_BASE_URL || 'cladev.up.railway.app'}</p>
        </div>
      </div>
    `,
    text: `
New Contact Form Message

From: ${fromName}
Email: ${fromEmail}
${subject ? `Subject: ${subject}\n` : ''}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from your portfolio contact form.
    `.trim(),
  };

  try {
    // Use Resend package if available, otherwise use HTTP API
    if (Resend) {
      const resend = new Resend(resendApiKey);
      
      // Resend requires verified domain for custom 'from' email
      // Use onboarding@resend.dev for testing, or your verified domain for production
      const fromEmailForResend = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      console.log('[email-service] Sending via Resend with from:', fromEmailForResend);
      
      const result = await resend.emails.send({
        from: fromEmailForResend,
        to: [businessEmail],
        replyTo: fromEmail,
        subject: subject || `New Contact Form Message from ${fromName}`,
        html: emailData.html,
        text: emailData.text
      });

      console.log('[email-service] ✅ Email sent via Resend:', result);
      return {
        messageId: result.data?.id,
        accepted: [businessEmail],
        rejected: [],
        response: 'Email sent via Resend API'
      };
    } else {
      // Fallback to HTTP API
      const response = await axios.post('https://api.resend.com/emails', emailData, {
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[email-service] ✅ Email sent via Resend HTTP API:', response.data);
      return {
        messageId: response.data.id,
        accepted: [businessEmail],
        rejected: [],
        response: 'Email sent via Resend HTTP API'
      };
    }
  } catch (error) {
    console.error('[email-service] Resend API error:', error.response?.data || error.message);
    throw new Error(`Resend API error: ${error.response?.data?.message || error.message}`);
  }
};

const sendContactEmail = async ({ fromEmail, fromName, subject, message }) => {
  // Try Resend first (HTTP API - works better with Railway)
  console.log('[email-service] Checking email service configuration...');
  console.log('[email-service] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
  
  if (process.env.RESEND_API_KEY) {
    console.log('[email-service] ✅ Using Resend API (HTTP - works with Railway)');
    try {
      return await sendContactEmailViaResend({ fromEmail, fromName, subject, message });
    } catch (resendError) {
      console.warn('[email-service] ⚠️ Resend failed, falling back to SMTP:', resendError.message);
      // Fall through to SMTP
    }
  } else {
    console.warn('[email-service] ⚠️ RESEND_API_KEY not set - using SMTP (may not work on Railway)');
    console.warn('[email-service] 💡 To fix: Add RESEND_API_KEY to Railway variables (see RESEND_SETUP.md)');
  }

  // Fall back to SMTP
  console.log('[email-service] Attempting SMTP connection (may fail on Railway)...');
  const transporter = createTransporter();
  
  // Ensure we use SMTP_TO if set, otherwise fall back to SMTP_USER
  // Priority: SMTP_TO > SMTP_USER > SMTP_FROM
  const businessEmail = process.env.SMTP_TO || process.env.SMTP_USER || process.env.SMTP_FROM || 'businessemail.charlesalvaran@gmail.com';
  const businessName = process.env.SMTP_FROM_NAME || 'Charles Louie Alvaran';
  const smtpUser = process.env.SMTP_USER;

  if (!businessEmail) {
    throw new Error('No recipient email configured. Please set SMTP_TO or SMTP_USER environment variable.');
  }

  console.log('[email-service] Email configuration:', {
    SMTP_TO: process.env.SMTP_TO || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER || 'NOT SET',
    SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
    recipientEmail: businessEmail,
    senderEmail: smtpUser
  });

  console.log('[email-service] Sending email:', {
    to: businessEmail,
    from: smtpUser,
    replyTo: fromEmail,
    subject: subject || `New Contact Form Message from ${fromName}`
  });

  // Send email TO your business email
  // Note: SMTP requires 'from' to be your authenticated email, but we set replyTo to the form submitter
  const mailOptions = {
    from: `"${businessName}" <${smtpUser}>`, // Use business name as sender name, but authenticated email
    to: businessEmail, // Send to your business email
    replyTo: `${fromName} <${fromEmail}>`, // So you can reply directly to the form submitter
    subject: subject || `New Contact Form Message from ${fromName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">New Contact Form Message</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${fromName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${fromEmail}</p>
          ${subject ? `<p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
          <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This message was sent from your portfolio contact form at ${process.env.VITE_API_BASE_URL || 'cladev.up.railway.app'}</p>
        </div>
      </div>
    `,
    text: `
New Contact Form Message

From: ${fromName}
Email: ${fromEmail}
${subject ? `Subject: ${subject}\n` : ''}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from your portfolio contact form.
    `.trim(),
  };

  // Verify connection before sending
  try {
    console.log('[email-service] ========== VERIFYING SMTP CONNECTION ==========');
    console.log('[email-service] Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('[email-service] Port:', process.env.SMTP_PORT || '587');
    console.log('[email-service] Secure:', process.env.SMTP_SECURE === 'true');
    console.log('[email-service] User:', process.env.SMTP_USER);
    console.log('[email-service] Has Password:', !!process.env.SMTP_PASS);
    console.log('[email-service] Password length:', process.env.SMTP_PASS?.length || 0);
    
    await transporter.verify();
    console.log('[email-service] ✅ SMTP connection verified successfully');
    console.log('[email-service] ===============================================');
  } catch (verifyError) {
    console.error('[email-service] ❌ SMTP VERIFICATION FAILED');
    console.error('[email-service] Error details:', {
      message: verifyError.message,
      code: verifyError.code,
      command: verifyError.command,
      response: verifyError.response,
      responseCode: verifyError.responseCode,
      errno: verifyError.errno,
      syscall: verifyError.syscall,
      address: verifyError.address,
      port: verifyError.port
    });
    console.error('[email-service] Full error:', JSON.stringify(verifyError, Object.getOwnPropertyNames(verifyError)));
    console.error('[email-service] ===============================================');
    
    // Provide helpful error messages
    if (verifyError.code === 'EAUTH' || verifyError.responseCode === 535) {
      throw new Error('SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS. For Gmail, you need to use an App Password (16 characters), not your regular password. Go to https://myaccount.google.com/apppasswords to generate one.');
    } else if (verifyError.code === 'ECONNECTION' || verifyError.code === 'ETIMEDOUT') {
      throw new Error(`SMTP connection failed. Could not connect to ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || '587'}. Please check your SMTP_HOST and SMTP_PORT settings.`);
    } else {
      throw new Error(`SMTP verification failed: ${verifyError.message} (Code: ${verifyError.code}, Response: ${verifyError.responseCode})`);
    }
  }

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[email-service] Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    
    if (info.rejected && info.rejected.length > 0) {
      console.warn('[email-service] Email was rejected:', info.rejected);
      throw new Error(`Email was rejected by server: ${info.rejected.join(', ')}`);
    }
    
    return info;
  } catch (sendError) {
    console.error('[email-service] Error sending email:', {
      message: sendError.message,
      code: sendError.code,
      command: sendError.command,
      response: sendError.response,
      responseCode: sendError.responseCode
    });
    throw sendError;
  }
};

module.exports = {
  sendContactEmail,
};

