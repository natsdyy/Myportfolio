const dotenv = require('dotenv');

dotenv.config();

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS || ''),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
};

module.exports = { config };

