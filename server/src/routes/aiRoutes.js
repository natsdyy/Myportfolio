const express = require('express');
const { handleChatRequest } = require('../ai/http');

// Local dev / Express deployments. Vercel uses api/ai/chat.js — both call the same handler.
const router = express.Router();

router.post('/chat', handleChatRequest);

module.exports = router;
