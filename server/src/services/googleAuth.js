const { OAuth2Client } = require('google-auth-library');
const { config } = require('../config');

if (!config.googleClientId) {
  console.warn('[google-auth] GOOGLE_CLIENT_ID is not set. Token verification will fail.');
}

const oauthClient = new OAuth2Client(config.googleClientId);

async function verifyIdToken(idToken) {
  if (!idToken) {
    throw new Error('Missing Google ID token');
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
      // Allow 10 minutes (600 seconds) of clock skew tolerance
      // This handles cases where server time is slightly off or token arrives late
      clockTolerance: 600,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Unable to parse Google token payload');
    }

    // Check if token is very close to expiration and warn
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    if (timeUntilExpiry < 60 && timeUntilExpiry > -600) {
      console.warn(`[google-auth] Token expiring soon (${timeUntilExpiry}s remaining)`);
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    };
  } catch (error) {
    // Provide more helpful error message for expired tokens
    if (error.message && error.message.includes('Token used too late')) {
      throw new Error('Google token has expired. Please sign in again.');
    }
    throw error;
  }
}

module.exports = { verifyIdToken };

