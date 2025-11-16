const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { config } = require('../config');
const { verifyIdToken } = require('../services/googleAuth');
const { sendOtpEmail } = require('../services/emailService');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Send OTP for email verification during sign up
router.post('/signup/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification record
    await pool.query(
      `
      INSERT INTO email_verifications (email, otp_code, expires_at, used)
      VALUES ($1, $2, $3, FALSE)
      ON CONFLICT (email) DO UPDATE
        SET otp_code = EXCLUDED.otp_code,
            expires_at = EXCLUDED.expires_at,
            used = FALSE,
            created_at = NOW();
    `,
      [email, code, expiresAt]
    );

    await sendOtpEmail({ toEmail: email, code });

    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('[auth] Send OTP error', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Sign up endpoint with OTP verification
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, phone, countryCode, otp } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check OTP
    const otpResult = await pool.query(
      `SELECT id, otp_code, expires_at, used FROM email_verifications WHERE email = $1`,
      [email]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    const otpRecord = otpResult.rows[0];

    if (otpRecord.used) {
      return res.status(400).json({ error: 'Verification code has already been used' });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if username or email already exists
    const existingUser = await pool.query(
      `SELECT id, username, email FROM accounts WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (existing.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create account
    const result = await pool.query(
      `
      INSERT INTO accounts (username, email, password_hash, phone_number, country_code, name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, phone_number, country_code, name, role_id, created_at;
    `,
      [username, email, passwordHash, phone || null, countryCode || null, username]
    );

    const account = result.rows[0];

    // Mark OTP as used
    await pool.query(`UPDATE email_verifications SET used = TRUE WHERE id = $1`, [otpRecord.id]);

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    res.status(201).json({
      message: 'Account created successfully',
      email: account.email,
      account: {
        ...account,
        role,
      },
    });
  } catch (error) {
    console.error('[auth] Signup error', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email or username
    const userResult = await pool.query(
      `SELECT id, username, email, password_hash, name, role_id, phone_number, country_code, created_at
       FROM accounts 
       WHERE email = $1 OR username = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const account = userResult.rows[0];

    if (!account.password_hash) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Please use Google to log in.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, account.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: account.id,
        email: account.email,
        username: account.username,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      account: {
        id: account.id,
        username: account.username,
        email: account.email,
        name: account.name,
        phone_number: account.phone_number,
        country_code: account.country_code,
        role,
        created_at: account.created_at,
      },
    });
  } catch (error) {
    console.error('[auth] Login error', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user info (supports both Google OAuth and JWT)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const accountResult = await pool.query(
      `SELECT id, username, email, name, avatar_url, phone_number, country_code, role_id, created_at
       FROM accounts 
       WHERE id = $1 OR email = $2`,
      [req.userId, req.userEmail]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    res.json({
      account: {
        ...account,
        role,
      },
    });
  } catch (error) {
    console.error('[auth] Error getting user info', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Google OAuth endpoint (keep for backward compatibility)
router.post('/me', async (req, res) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ error: 'idToken is required' });
    }

    const profile = await verifyIdToken(idToken);

    // Get or create account
    const accountResult = await pool.query(
      `
      INSERT INTO accounts (google_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id) DO UPDATE
        SET email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
      RETURNING id, google_id, email, name, avatar_url, username, phone_number, country_code, role_id, created_at;
    `,
      [profile.googleId, profile.email, profile.name, profile.avatarUrl]
    );

    const account = accountResult.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    // Check if profile is incomplete (missing username or phone)
    const needsProfileCompletion = !account.username || !account.phone_number;

    res.json({
      account: {
        ...account,
        role,
      },
      needsProfileCompletion,
    });
  } catch (error) {
    console.error('[auth] Error getting user info', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Complete Google profile (add username and phone)
router.post('/complete-profile', async (req, res) => {
  try {
    const { idToken, username, phone, countryCode } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ error: 'idToken is required' });
    }

    if (!username || !phone || !countryCode) {
      return res.status(400).json({ error: 'Username, phone, and country code are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Verify Google token and get profile
    const profile = await verifyIdToken(idToken);

    // Check if username is already taken
    const existingUser = await pool.query(
      `SELECT id FROM accounts WHERE username = $1 AND google_id != $2`,
      [username, profile.googleId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Update account with username and phone
    const result = await pool.query(
      `
      UPDATE accounts
      SET username = $1,
          phone_number = $2,
          country_code = $3,
          updated_at = NOW()
      WHERE google_id = $4
      RETURNING id, username, email, name, avatar_url, phone_number, country_code, role_id, created_at;
    `,
      [username, phone, countryCode, profile.googleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    res.json({
      account: {
        ...account,
        role,
      },
      message: 'Profile completed successfully',
    });
  } catch (error) {
    console.error('[auth] Error completing profile', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// Update profile (name and password only)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, password, currentPassword } = req.body || {};

    // At least one field must be provided
    if (!name && !password) {
      return res.status(400).json({ error: 'Name or password must be provided' });
    }

    // If updating password, current password is required
    if (password && !currentPassword) {
      return res.status(400).json({ error: 'Current password is required to change password' });
    }

    // Get current account
    const accountResult = await pool.query(
      `SELECT id, password_hash FROM accounts WHERE id = $1 OR email = $2`,
      [req.userId, req.userEmail]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];

    // Verify current password if changing password
    if (password) {
      if (!account.password_hash) {
        return res.status(400).json({ error: 'This account uses Google sign-in. Password cannot be set.' });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, account.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    // Add WHERE clause
    values.push(req.userId);
    const updateQuery = `
      UPDATE accounts
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, username, email, name, avatar_url, phone_number, country_code, role_id, created_at;
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updatedAccount = result.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [updatedAccount.role_id]
    );
    const role = roleResult.rows[0];

    res.json({
      account: {
        ...updatedAccount,
        role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[auth] Error updating profile', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update profile for Google users (name only, no password)
router.put('/profile/google', async (req, res) => {
  try {
    const { idToken, name } = req.body || {};

    if (!idToken) {
      return res.status(401).json({ error: 'idToken is required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Verify Google token and get profile
    const profile = await verifyIdToken(idToken);

    // Update account name
    const result = await pool.query(
      `
      UPDATE accounts
      SET name = $1, updated_at = NOW()
      WHERE google_id = $2
      RETURNING id, username, email, name, avatar_url, phone_number, country_code, role_id, created_at;
    `,
      [name, profile.googleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.rows[0];

    // Get role information
    const roleResult = await pool.query(
      `SELECT id, name, description FROM roles WHERE id = $1`,
      [account.role_id]
    );
    const role = roleResult.rows[0];

    res.json({
      account: {
        ...account,
        role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[auth] Error updating Google profile', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
