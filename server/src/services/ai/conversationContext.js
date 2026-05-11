/**
 * Conversation Context Resolver
 * 
 * Detects follow-up queries and enriches them with context from chat history.
 * This gives the AI "memory" of what was previously discussed, so short 
 * follow-ups like "price?" after "how much iphone 17?" are resolved correctly.
 */

const { detectLanguage } = require('./localBrain');

// ─── Follow-Up Signal Detection ──────────────────────────────

// Words/patterns that strongly indicate a follow-up question
const FOLLOWUP_SIGNALS_EN = [
    'it', 'its', 'that', 'this', 'those', 'these', 'them', 'they',
    'more', 'also', 'and', 'what about', 'how about', 'tell me more',
    'details', 'explain', 'why', 'really', 'sure', 'yes', 'yeah',
    'elaborate', 'expand', 'continue', 'go on', 'example', 'examples'
];

const FOLLOWUP_SIGNALS_TL = [
    'yun', 'iyon', 'niya', 'nila', 'siya', 'ito', 'yan', 'dun',
    'pa', 'din', 'rin', 'nga', 'naman', 'ba', 'ulit',
    'dagdag', 'detalye', 'paano', 'bakit', 'talaga', 'oo', 'sige',
    'ano pa', 'paano yun', 'bakit ganun'
];

// Words that indicate the user is starting a NEW topic (not a follow-up)
const NEW_TOPIC_SIGNALS = [
    'hello', 'hi', 'hey', 'kumusta', 'musta',
    'who is', 'sino si', 'what is your', 'ano ang',
    'search for', 'look up', 'define',
    'bye', 'goodbye', 'paalam', 'thanks', 'salamat'
];

/**
 * extractTopic(history)
 * 
 * Extracts the most recent conversation topic from chat history.
 * Looks at the last user query and assistant response to determine
 * what the conversation is about.
 * 
 * Returns { topic: string, lastUserQuery: string, lastAssistantResponse: string }
 */
function extractTopic(history) {
    if (!history || history.length < 2) return null;

    // Find the last user-assistant exchange (before the current message)
    let lastUserQuery = null;
    let lastAssistantResponse = null;

    // History comes in as array of { role, content } objects
    // Walk backwards to find the most recent complete exchange
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!lastAssistantResponse && msg.role === 'assistant') {
            lastAssistantResponse = msg.content;
        }
        if (!lastUserQuery && msg.role === 'user') {
            lastUserQuery = msg.content;
        }
        if (lastUserQuery && lastAssistantResponse) break;
    }

    if (!lastUserQuery) return null;

    // Extract the core topic from the last user query
    // Remove common question words to isolate the subject
    const topic = lastUserQuery
        .toLowerCase()
        .replace(/^(what is|who is|where is|when is|how much is|how much|how is|how do|how does|what are|who are|what|who|where|when|how|why|is|define|search|look up|tell me about|show me|magkano ang|magkano|ano ang|sino si|sino ang|saan ang|saan ka sa|paano ang|ano ba ang|ano ba|sino ba si|tungkol kay|tungkol sa)\s*/i, '')
        .replace(/[?!.,]+$/, '')
        .trim();

    return {
        topic,
        lastUserQuery,
        lastAssistantResponse: lastAssistantResponse || ''
    };
}

/**
 * isFollowUp(query, history)
 * 
 * Determines if the current query is a follow-up to the previous conversation.
 * 
 * A query is a follow-up if:
 * 1. It's short (1-6 words)
 * 2. It contains follow-up signals (pronouns, continuation words)
 * 3. It's NOT a clear new-topic starter
 * 4. There IS previous history to reference
 */
function isFollowUp(query, history) {
    if (!history || history.length < 2) return false;

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);
    const cleanWords = words.map(w => w.replace(/[?!.,]/g, ''));

    // Long queries are usually self-contained
    if (words.length > 6) return false;

    // Check if it's clearly a new topic
    const isNewTopic = NEW_TOPIC_SIGNALS.some(signal => q.includes(signal));
    if (isNewTopic) return false;

    // Short queries (1-3 words) with no clear intent are almost always follow-ups
    if (words.length <= 3) {
        // Check for explicit follow-up signals
        const hasFollowUpSignal = [...FOLLOWUP_SIGNALS_EN, ...FOLLOWUP_SIGNALS_TL]
            .some(signal => q.includes(signal));
        
        if (hasFollowUpSignal) return true;

        // Very short queries (1-2 words) that aren't greetings/goodbyes are likely follow-ups
        if (words.length <= 2) {
            // Single word queries like "price?", "specs?", "features?" are almost always follow-ups
            const isSingleWordQuestion = words.length === 1 && q.replace(/[?!]/g, '').length > 1;
            if (isSingleWordQuestion) return true;

            // Two-word queries like "how much?", "what about?", "and color?"
            const twoWordFollowUp = words.length === 2;
            if (twoWordFollowUp) return true;
        }
    }

    // 4-6 word queries with pronouns are follow-ups ("what color is it?", "how much does it cost?")
    if (words.length <= 6) {
        const hasPronouns = ['it', 'its', 'that', 'this', 'yun', 'niya', 'siya', 'ito']
            .some(p => cleanWords.includes(p));
        if (hasPronouns) return true;
    }

    return false;
}

/**
 * resolveFollowUp(query, history)
 * 
 * Main entry point. Takes the raw user query and chat history,
 * and returns an enriched query if it's a follow-up, or the
 * original query if it's a new topic.
 * 
 * Returns { resolved: string, wasFollowUp: boolean, originalQuery: string, topic: string|null }
 */
function resolveFollowUp(query, history) {
    const result = {
        resolved: query,
        wasFollowUp: false,
        originalQuery: query,
        topic: null
    };

    if (!isFollowUp(query, history)) {
        return result;
    }

    const context = extractTopic(history);
    if (!context || !context.topic) {
        return result;
    }

    const lang = detectLanguage(query) === 'tl' ? 'tl' : 
                 detectLanguage(context.lastUserQuery) === 'tl' ? 'tl' : 'en';

    const q = query.toLowerCase().replace(/[?!.,]+$/, '').trim();
    const topic = context.topic;

    result.wasFollowUp = true;
    result.topic = topic;

    // ─── Resolution Strategies ────────────────────────────

    // Strategy 1: Single word follow-up → "[word] of [topic]" or "[word] ng [topic]"
    const words = q.split(/\s+/);
    if (words.length === 1) {
        result.resolved = lang === 'tl' 
            ? `${q} ng ${topic}` 
            : `${q} of ${topic}`;
        return result;
    }

    // Strategy 2: "more" / "details" / "pa" → "more about [topic]"
    if (['more', 'details', 'more details', 'elaborate', 'explain'].includes(q)) {
        result.resolved = lang === 'tl'
            ? `dagdag na detalye tungkol sa ${topic}`
            : `more details about ${topic}`;
        return result;
    }
    if (['pa', 'dagdag', 'detalye', 'dagdag pa'].includes(q)) {
        result.resolved = `dagdag na detalye tungkol sa ${topic}`;
        return result;
    }

    // Strategy 3: Pronoun replacement ("how much is it?" → "how much is [topic]?")
    let resolved = q;
    resolved = resolved.replace(/\b(it|that|this)\b/gi, topic);
    resolved = resolved.replace(/\b(yun|iyon|ito|yan)\b/gi, topic);
    resolved = resolved.replace(/\b(niya|siya)\b/gi, `ni ${topic}`);

    if (resolved !== q) {
        result.resolved = resolved;
        return result;
    }

    // Strategy 4: Generic concatenation for short queries
    result.resolved = lang === 'tl' 
        ? `${q} ng ${topic}`
        : `${q} ${topic}`;
    
    return result;
}

module.exports = { resolveFollowUp, isFollowUp, extractTopic };
