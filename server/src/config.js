const dotenv = require('dotenv');
const path = require('path');

// Load .env from the server directory (not the project root)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

console.log('[config] Allowed origins:', config.allowedOrigins);
console.log('[config] Supabase URL set:', !!process.env.SUPABASE_URL);
console.log('[config] Supabase Key set:', !!process.env.SUPABASE_KEY);

module.exports = { config };

