/**
 * AI Assistant — main pipeline.
 *
 *   ┌─ Gemini LLM (if GEMINI_API_KEY is set) ── streamed, grounded with Google Search
 *   │        │ fails before sending anything?
 *   │        ▼
 *   └─ Local fallback (rule-based brain + web scrapers) ── ./fallback/localAgent.js
 *
 * Both paths return the same shape:
 *   { answer: string, sources: Array<{ label, url? }>, mode: 'ai' | 'local' | 'search' | 'memory' }
 */

const { streamGemini, isGeminiConfigured } = require('./providers/gemini');
const { buildSystemPrompt } = require('./systemPrompt');
const { processUserQuery: runLocalAgent } = require('./fallback/localAgent');
const { buildConversationProfile } = require('./fallback/conversationContext');

const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CHARS = 2000;

/** Keep only well-formed, recent history entries. */
function sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-MAX_HISTORY_MESSAGES)
        .map(m => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_CHARS) }));
}

function normalizeSources(sources) {
    return (sources || [])
        .map(s => (typeof s === 'string' ? { label: s } : s))
        .filter(s => s && s.label);
}

async function runFallback(query, history, onDelta) {
    const result = await runLocalAgent(query, history);
    onDelta?.(result.answer);
    return { answer: result.answer, sources: normalizeSources(result.sources), mode: result.mode };
}

/**
 * Generate a reply. `onDelta(text)` is called with incremental text chunks
 * (the fallback emits its whole answer as one chunk).
 */
async function generateReply({ query, history = [], onDelta, signal } = {}) {
    const cleanHistory = sanitizeHistory(history);

    if (!isGeminiConfigured()) {
        return runFallback(query, cleanHistory, onDelta);
    }

    let emitted = '';
    try {
        const conversationState = buildConversationProfile(cleanHistory, query);
        const { text, sources } = await streamGemini({
            systemPrompt: buildSystemPrompt({ conversationState }),
            history: cleanHistory,
            query,
            signal,
            onDelta: (delta) => {
                emitted += delta;
                onDelta?.(delta);
            },
        });
        return { answer: text, sources, mode: 'ai' };
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.error('[ai] Gemini failed:', err.message);

        // Already streamed part of an answer — finish gracefully instead of repeating.
        if (emitted) {
            const note = '\n\n_…my response was cut off. Feel free to ask me to continue._';
            onDelta?.(note);
            return { answer: emitted + note, sources: [], mode: 'ai' };
        }
        return runFallback(query, cleanHistory, onDelta);
    }
}

module.exports = { generateReply, sanitizeHistory };
