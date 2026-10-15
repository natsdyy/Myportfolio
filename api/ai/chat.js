// Vercel serverless function for the AI assistant chat → POST /api/ai/chat.
// All logic lives in server/src/ai so local Express dev and Vercel share one implementation.

import chatHttp from '../../server/src/ai/http.js';

export default function handler(req, res) {
    return chatHttp.handleChatRequest(req, res);
}
