/**
 * Shared HTTP handler for POST /api/ai/chat.
 *
 * Framework-agnostic (plain Node req/res), so the exact same code serves:
 *   - Vercel serverless:  api/ai/chat.js
 *   - Local Express dev:  server/src/routes/aiRoutes.js
 *
 * Request body:  { query: string, history?: [{ role, content }], stream?: boolean }
 *
 * Streaming response (default, `text/event-stream`), one JSON object per event:
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"done","sources":[{label,url}],"mode":"ai"}
 *   data: {"type":"error","message":"..."}
 *
 * Non-streaming (`stream: false`): JSON { answer, sources, mode }.
 */

const { generateReply } = require('./index');

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 15;
const MAX_QUERY_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 30000;

// Best-effort, per-instance rate limiter (use Vercel Firewall / Upstash for hard limits).
const rateBuckets = new Map();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return String(forwarded).split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    if (rateBuckets.size > 1000) {
        for (const [key, bucket] of rateBuckets) {
            if (now - bucket.windowStart > RATE_WINDOW_MS) rateBuckets.delete(key);
        }
    }
    const bucket = rateBuckets.get(ip);
    if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
        rateBuckets.set(ip, { windowStart: now, count: 1 });
        return false;
    }
    bucket.count += 1;
    return bucket.count > RATE_MAX_REQUESTS;
}

function sendJson(res, status, data) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
}

function validate(body) {
    const { query, history, stream } = body || {};
    if (typeof query !== 'string' || !query.trim()) {
        return { error: 'Query is required' };
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return { error: `Query must be at most ${MAX_QUERY_LENGTH} characters` };
    }
    return {
        query: query.trim(),
        history: Array.isArray(history) ? history : [],
        stream: stream !== false,
    };
}

async function handleChatRequest(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    if (isRateLimited(getClientIp(req))) {
        return sendJson(res, 429, { error: 'Too many requests. Please slow down and try again shortly.' });
    }

    const input = validate(req.body);
    if (input.error) return sendJson(res, 400, { error: input.error });

    // Abort upstream work if the client disconnects or we hit the timeout.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), REQUEST_TIMEOUT_MS);
    res.on('close', () => {
        if (!res.writableEnded) controller.abort();
    });

    try {
        if (!input.stream) {
            const result = await generateReply({ query: input.query, history: input.history, signal: controller.signal });
            return sendJson(res, 200, result);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const send = (event) => {
            if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
        };

        try {
            const result = await generateReply({
                query: input.query,
                history: input.history,
                signal: controller.signal,
                onDelta: (text) => send({ type: 'delta', text }),
            });
            send({ type: 'done', sources: result.sources, mode: result.mode });
        } catch (err) {
            if (!controller.signal.aborted || controller.signal.reason?.message === 'timeout') {
                console.error('[chat] Stream error:', err.message);
                send({ type: 'error', message: 'Sorry, something went wrong on my end. Please try again.' });
            }
        }
        res.end();
    } catch (err) {
        console.error('[chat] Error:', err.message);
        if (!res.headersSent) {
            const timedOut = controller.signal.reason?.message === 'timeout';
            sendJson(res, timedOut ? 504 : 500, {
                error: timedOut ? 'The request took too long. Please try again.' : 'Internal server error',
            });
        }
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { handleChatRequest };
