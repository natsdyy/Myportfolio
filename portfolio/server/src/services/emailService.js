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
  const businessEmail = process.env.SMTP_TO || process.env.SMTP_USER || process.env.SMTP_FROM;
  const businessName = process.env.SMTP_FROM_NAME || 'Charles Louie Alvaran';

  // Send email TO your business email
  // Note: SMTP requires 'from' to be your authenticated email, but we set replyTo to the form submitter
  const mailOptions = {
    from: `"${fromName} (via Contact Form)" <${process.env.SMTP_USER}>`, // Must use authenticated email for SMTP
    to: businessEmail, // Send to your business email
    replyTo: fromEmail, // So you can reply directly to the form submitter
    subject: subject || `New Contact Form Message from ${fromName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Message</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        </div>
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
          <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
      </div>
    `,
    text: `
New Contact Form Message

From: ${fromName} (${fromEmail})
${subject ? `Subject: ${subject}\n` : ''}

Message:
${message}
    `.trim(),
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = {
  sendContactEmail,
};

