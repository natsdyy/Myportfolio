require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
});

async function setAdmin(email) {
  try {
    // Get admin role ID
    const roleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
    if (roleResult.rows.length === 0) {
      console.error('Admin role not found. Make sure database is initialized.');
      process.exit(1);
    }
    const adminRoleId = roleResult.rows[0].id;

    // Update user to admin
    const result = await pool.query(
      `UPDATE accounts SET role_id = $1 WHERE email = $2 RETURNING id, email, name, role_id`,
      [adminRoleId, email]
    );

    if (result.rows.length === 0) {
      console.log(`No account found with email: ${email}`);
      console.log('Available accounts:');
      const accounts = await pool.query(`SELECT email, name FROM accounts LIMIT 10`);
      accounts.rows.forEach((acc) => console.log(`  - ${acc.email} (${acc.name})`));
      process.exit(1);
    }

    const account = result.rows[0];
    console.log(`✅ Successfully set ${account.email} as admin!`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Name: ${account.name || 'N/A'}`);
    console.log(`   Role ID: ${account.role_id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error setting admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node set-admin.js <email>');
  console.error('Example: node set-admin.js user@example.com');
  process.exit(1);
}

setAdmin(email);

