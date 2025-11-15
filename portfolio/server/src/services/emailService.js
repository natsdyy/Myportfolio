const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendContactEmail = async ({ fromEmail, fromName, subject, message }) => {
  const transporter = createTransporter();
  
  // Ensure we use SMTP_TO if set, otherwise fall back to SMTP_USER
  const businessEmail = process.env.SMTP_TO || process.env.SMTP_USER || process.env.SMTP_FROM;
  const businessName = process.env.SMTP_FROM_NAME || 'Charles Louie Alvaran';
  const smtpUser = process.env.SMTP_USER;

  if (!businessEmail) {
    throw new Error('No recipient email configured. Please set SMTP_TO or SMTP_USER environment variable.');
  }

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

  // Verify connection and send email
  try {
    await transporter.verify();
    console.log('[email-service] SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('[email-service] SMTP verification failed:', verifyError);
    throw new Error(`SMTP connection failed: ${verifyError.message}`);
  }

  const info = await transporter.sendMail(mailOptions);
  console.log('[email-service] Email sent:', {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected
  });
  
  return info;
};

module.exports = {
  sendContactEmail,
};

