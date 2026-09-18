// Vercel serverless function for the AI assistant chat.
// Maps to POST /api/ai/chat.
//
// Depends only on axios + cheerio (plus the in-repo scraper/AI modules).
// Fully serverless — no external database or browser binary required.

import searchAgent from '../../server/src/agents/searchAgent.js';

const { processUserQuery } = searchAgent;

// ── Simple in-memory rate limiter ─────────────────────────────
// Note: this is per-instance and best-effort. For guaranteed limits use
// Vercel's built-in rate limiting or a store like Upstash.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 10;
const MAX_QUERY_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 25000;
const rateBuckets = new Map();

function pruneBuckets(now) {
    if (rateBuckets.size < 1000) return;
    for (const [ip, bucket] of rateBuckets) {
        if (now - bucket.windowStart > RATE_WINDOW_MS) rateBuckets.delete(ip);
    }
}

function isRateLimited(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || 'unknown';
    const now = Date.now();
    pruneBuckets(now);

    const bucket = rateBuckets.get(ip);
    if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
        rateBuckets.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    bucket.count += 1;
    return bucket.count > RATE_MAX_REQUESTS;
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (isRateLimited(req)) {
        return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    const { query, history } = req.body || {};

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH) {
        return res.status(400).json({ error: `Query must be a string of at most ${MAX_QUERY_LENGTH} characters` });
    }

    try {
        const result = await withTimeout(
            processUserQuery(query, Array.isArray(history) ? history : []),
            REQUEST_TIMEOUT_MS
        );
        return res.json(result);
    } catch (error) {
        console.error('Chat Route Error:', error.message);
        if (error.message === 'Request timed out') {
            return res.status(504).json({ error: 'The request took too long. Please try again.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}
