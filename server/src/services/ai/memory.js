/**
 * In-memory Memory (serverless-friendly)
 *
 * Keeps a bounded in-memory cache per function instance — the bot
 * "remembers" repeat answers within a warm instance without any external
 * database or credentials.
 *
 * For durable, cross-instance memory you could add a hosted store (Upstash
 * Redis, Vercel KV, etc.) — intentionally omitted to keep the AI fully
 * serverless and dependency-free.
 */

const ANSWER_CACHE_LIMIT = 500;
const answerCache = new Map(); // normalized query -> answer

function normalizeKey(text) {
    return (text || '').toLowerCase().trim();
}

function cacheSet(map, key, value, limit) {
    if (map.size >= limit) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
    }
    map.set(key, value);
}

/**
 * Remember an answer in-memory for future recall.
 */
async function logChatMessage(query, answer, sources = []) {
    cacheSet(answerCache, normalizeKey(query), answer, ANSWER_CACHE_LIMIT);
}

/**
 * Check for an exact cached answer for this query.
 */
async function checkCachedAnswer(query) {
    const key = normalizeKey(query);
    return answerCache.has(key) ? answerCache.get(key) : null;
}

module.exports = { logChatMessage, checkCachedAnswer };
