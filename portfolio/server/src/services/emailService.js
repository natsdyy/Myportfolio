const nodemailer = require('nodemailer');
const axios = require('axios');

// Load Resend package
const { Resend } = require('resend');

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
  
  // Prepare email HTML and text content with emojis and better design
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Contact Form Message</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">You've received a new message from your portfolio</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: #ffffff; padding: 30px 20px;">
        <!-- Sender Info Card -->
        <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 24px; margin-right: 10px;">👤</span>
            <h3 style="color: #1e40af; margin: 0; font-size: 16px; font-weight: 600;">Sender Information</h3>
          </div>
          <div style="margin-left: 34px;">
            <p style="margin: 8px 0; color: #1e293b;">
              <span style="font-weight: 600;">📧 From:</span> <span style="color: #3b82f6;">${fromName}</span>
            </p>
            <p style="margin: 8px 0; color: #1e293b;">
              <span style="font-weight: 600;">✉️ Email:</span> <a href="mailto:${fromEmail}" style="color: #3b82f6; text-decoration: none;">${fromEmail}</a>
            </p>
            ${subject ? `
            <p style="margin: 8px 0; color: #1e293b;">
              <span style="font-weight: 600;">📋 Subject:</span> <span style="color: #64748b;">${subject}</span>
            </p>
            ` : ''}
            <p style="margin: 8px 0; color: #1e293b;">
              <span style="font-weight: 600;">📅 Date:</span> <span style="color: #64748b;">${new Date().toLocaleString()}</span>
            </p>
          </div>
        </div>
        
        <!-- Message Card -->
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">💭</span>
            <h3 style="color: #1e293b; margin: 0; font-size: 16px; font-weight: 600;">Message</h3>
          </div>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 3px solid #8b5cf6;">
            <p style="color: #475569; white-space: pre-wrap; line-height: 1.7; margin: 0; font-size: 15px;">${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          <span style="font-size: 14px;">🔗</span> This message was sent from your portfolio contact form at 
          <a href="${process.env.VITE_API_BASE_URL || 'https://cladev.up.railway.app'}" style="color: #3b82f6; text-decoration: none;">${process.env.VITE_API_BASE_URL || 'cladev.up.railway.app'}</a>
        </p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p style="color: #cbd5e1; font-size: 11px; margin: 0;">✨ Powered by Resend</p>
        </div>
      </div>
    </div>
  `;
  
  const emailText = `
💬 New Contact Form Message

👤 From: ${fromName}
📧 Email: ${fromEmail}
${subject ? `📋 Subject: ${subject}\n` : ''}
📅 Date: ${new Date().toLocaleString()}

💭 Message:
${message}

---
🔗 This message was sent from your portfolio contact form at ${process.env.VITE_API_BASE_URL || 'cladev.up.railway.app'}
✨ Powered by Resend
  `.trim();

  try {
    // Initialize Resend with API key (matching sample code pattern)
    const resend = new Resend(resendApiKey);
    
    // Resend requires verified domain for custom 'from' email
    // Use onboarding@resend.dev for testing, or your verified domain for production
    const fromEmailForResend = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const emailSubject = subject || `New Contact Form Message from ${fromName}`;
    
    console.log('[email-service] Sending via Resend with from:', fromEmailForResend);
    console.log('[email-service] Sending to:', businessEmail);
    console.log('[email-service] Subject:', emailSubject);
    
    // Send email using Resend API (matching sample code pattern exactly)
    const result = await resend.emails.send({
      from: fromEmailForResend,
      to: businessEmail,
      replyTo: fromEmail,
      subject: emailSubject,
      html: emailHtml
    });

    console.log('[email-service] ✅ Email sent via Resend:', result);
    return {
      messageId: result.data?.id,
      accepted: [businessEmail],
      rejected: [],
      response: 'Email sent via Resend API'
    };
  } catch (error) {
    console.error('[email-service] ❌ Resend API error:', error);
    console.error('[email-service] Error details:', error.response?.data || error.message);
    
    // Provide more helpful error messages
    if (error.message?.includes('domain')) {
      throw new Error(`Resend API error: The 'from' email domain must be verified. Use 'onboarding@resend.dev' for testing, or verify your domain in Resend dashboard.`);
    }
    
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

