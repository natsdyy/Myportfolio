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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = {
  pool,
  ensureTables,
};

