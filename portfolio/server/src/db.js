const { Pool } = require('pg');
const { config } = require('./config');

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Set it in your environment variables.');
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl:
    process.env.PGSSLMODE === 'disable'
      ? false
      : {
          rejectUnauthorized: false,
        },
});

async function ensureTables() {
  // Create roles table first
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Insert default roles if they don't exist
  await pool.query(`
    INSERT INTO roles (name, description)
    VALUES ('user', 'Regular user with basic access'), ('admin', 'Administrator with full access')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Create accounts/users table with role reference
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      avatar_url TEXT,
      phone_number TEXT,
      country_code TEXT,
      role_id INTEGER NOT NULL DEFAULT 1 REFERENCES roles(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT check_auth_method CHECK (
        (google_id IS NOT NULL) OR (username IS NOT NULL AND password_hash IS NOT NULL)
      )
    );
  `);

  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
    CREATE INDEX IF NOT EXISTS idx_accounts_google_id ON accounts(google_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_role_id ON accounts(role_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      subject TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Email verification codes for sign-up (OTP)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = {
  pool,
  ensureTables,
};

