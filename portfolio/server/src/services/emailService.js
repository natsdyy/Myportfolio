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
  const businessEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const businessName = process.env.SMTP_FROM_NAME || 'Charles Louie Alvaran';

  // Send acknowledgment email TO the form submitter FROM your business email
  const mailOptions = {
    from: `"${businessName}" <${businessEmail}>`,
    to: fromEmail, // Send to the person who filled the form
    replyTo: businessEmail,
    subject: subject || 'Thank you for contacting me',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Thank you for your message!</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Hi ${fromName},
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          I've received your message and will get back to you soon.
        </p>
        ${subject ? `<p style="color: #4b5563; line-height: 1.6;"><strong>Subject:</strong> ${subject}</p>` : ''}
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">
          Best regards,<br>
          ${businessName}
        </p>
      </div>
    `,
    text: `
Thank you for your message!

Hi ${fromName},

I've received your message and will get back to you soon.

${subject ? `Subject: ${subject}\n` : ''}
Your message:
${message}

Best regards,
${businessName}
    `.trim(),
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = {
  sendContactEmail,
};

