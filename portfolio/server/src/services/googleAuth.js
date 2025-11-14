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

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Unable to parse Google token payload');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}

module.exports = { verifyIdToken };

