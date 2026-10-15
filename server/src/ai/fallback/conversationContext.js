/**
 * Conversation Context Resolver
 * 
 * Detects follow-up queries and enriches them with context from chat history.
 * This gives the AI "memory" of what was previously discussed, so short 
 * follow-ups like "price?" after "how much iphone 17?" are resolved correctly.
 */
// ─── Lightweight Language Detection ──────────────────────────
// Self-contained to avoid circular dependency with localBrain
// (localBrain imports generateSmartSummary from this module)

const TL_WORDS_SET = new Set([
    'kumusta', 'musta', 'saan', 'ano', 'sino', 'kailan', 'paano', 'bakit',
    'nasaan', 'taga', 'galing', 'salamat', 'paalam', 'ingat', 'ayos', 'ka',
    'mo', 'si', 'ang', 'mga', 'ng', 'na', 'sa', 'at', 'ba', 'po', 'opo',
    'astig', 'lodi', 'petmalu', 'yayaman', 'pautang', 'niya', 'kanya', 'nila',
]);

function detectLanguage(query) {
    const words = query.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    const matches = words.filter(w => TL_WORDS_SET.has(w));
    return matches.length > 0 ? 'tl' : 'en';
}

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

// ─── Conversation Profile Builder (Rule 1, 17) ──────────────

/**
 * buildConversationProfile(history)
 *
 * Analyzes the full conversation history to extract a rich profile
 * used by the persona engine for all 20 behavioral rules.
 *
 * @param {Array} history - Array of { role, content } messages
 * @returns {Object} profile
 */
function buildConversationProfile(history) {
    const profile = {
        topicsDiscussed: [],
        mentionedEntities: [],
        userMood: 'neutral',
        turnCount: 0,
        lastBotResponse: '',
        lastUserQuery: '',
        isReturningUser: false,
    };

    if (!history || history.length === 0) return profile;

    const userMessages = history.filter(m => m.role === 'user');
    const botMessages = history.filter(m => m.role === 'assistant');

    profile.turnCount = userMessages.length;

    // Extract the last bot response
    if (botMessages.length > 0) {
        profile.lastBotResponse = botMessages[botMessages.length - 1].content || '';
    }

    // Extract last user query
    if (userMessages.length > 0) {
        profile.lastUserQuery = userMessages[userMessages.length - 1].content || '';
    }

    // ── Topic Extraction ──────────────────────────────────
    const topicStopWords = new Set([
        'what', 'who', 'where', 'when', 'how', 'why', 'is', 'are', 'was', 'were',
        'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'shall',
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'about', 'tell', 'me', 'show', 'give', 'please',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
        'ano', 'sino', 'saan', 'kailan', 'paano', 'bakit', 'ang', 'ng', 'sa',
        'mo', 'ko', 'niya', 'ka', 'ba', 'na', 'po', 'mga', 'si', 'ni',
    ]);

    const seenTopics = new Set();

    for (const msg of userMessages) {
        const words = msg.content.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !topicStopWords.has(w));

        // Take the most meaningful words as topic keywords
        const meaningful = words.slice(0, 3).join(' ');
        if (meaningful && !seenTopics.has(meaningful)) {
            seenTopics.add(meaningful);
            profile.topicsDiscussed.push(meaningful);
        }
    }

    // ── Entity Extraction (names, projects, tech) ─────────
    const knownEntities = [
        'charles', 'countryside steakhouse', 'vibebuilds', 'vibe builds', 'dynbooth', 'ismeye', 'altermatch',
        'react', 'vue', 'node', 'express', 'supabase', 'firebase', 'javascript', 'typescript',
        'tailwind', 'html', 'css', 'docker', 'git', 'figma', 'vite',
    ];

    for (const msg of userMessages) {
        const lower = msg.content.toLowerCase();
        for (const entity of knownEntities) {
            if (lower.includes(entity) && !profile.mentionedEntities.includes(entity)) {
                profile.mentionedEntities.push(entity);
            }
        }
    }

    // ── Mood Trending ─────────────────────────────────────
    // Look at the last 3 user messages for mood trend
    const recentUser = userMessages.slice(-3);
    const moodScores = { positive: 0, negative: 0, neutral: 0 };

    const positiveWords = /\b(thanks|good|great|awesome|nice|cool|love|happy|wow|amazing|galing|salamat|astig|husay)\b/i;
    const negativeWords = /\b(bad|wrong|frustrated|angry|annoyed|confused|sad|stressed|hate|ugh|nakakainis|bobo|mali)\b/i;

    for (const msg of recentUser) {
        if (positiveWords.test(msg.content)) moodScores.positive++;
        else if (negativeWords.test(msg.content)) moodScores.negative++;
        else moodScores.neutral++;
    }

    if (moodScores.positive > moodScores.negative) profile.userMood = 'positive';
    else if (moodScores.negative > moodScores.positive) profile.userMood = 'negative';
    else profile.userMood = 'neutral';

    return profile;
}

// ─── Smart Summary (Rule 5) ─────────────────────────────────

/**
 * generateSmartSummary(history, lang)
 *
 * Generates a human-readable, grouped summary of the conversation
 * instead of just listing raw queries.
 *
 * @param {Array} history - Array of { role, content } messages
 * @param {string} lang - 'en' or 'tl'
 * @returns {string} A natural-language summary
 */
function generateSmartSummary(history, lang) {
    if (!history || history.length < 2) {
        return lang === 'tl'
            ? 'Wala pa tayong napapag-usapan! Ano ang gusto mong malaman?'
            : "We haven't discussed anything yet! What would you like to know?";
    }

    const profile = buildConversationProfile(history);

    // Group topics into categories
    const categories = {
        portfolio: [],  // skills, projects, experience
        personal: [],   // owner identity, hobbies, location
        meta: [],       // bot identity, help, greetings
        external: [],   // web searches, definitions
    };

    const portfolioKeywords = ['skills', 'tech', 'stack', 'project', 'experience', 'work', 'resume', 'hire', 'available', 'portfolio'];
    const personalKeywords = ['charles', 'who', 'location', 'hobbies', 'contact', 'email'];
    const metaKeywords = ['help', 'who are you', 'what can', 'hello', 'hi', 'bye', 'thanks'];

    for (const topic of profile.topicsDiscussed) {
        const lower = topic.toLowerCase();
        if (portfolioKeywords.some(k => lower.includes(k))) {
            categories.portfolio.push(topic);
        } else if (personalKeywords.some(k => lower.includes(k))) {
            categories.personal.push(topic);
        } else if (metaKeywords.some(k => lower.includes(k))) {
            categories.meta.push(topic);
        } else {
            categories.external.push(topic);
        }
    }

    // Build natural language summary
    const parts = [];

    if (categories.portfolio.length > 0) {
        parts.push(lang === 'tl'
            ? `📋 **Portfolio**: Nag-usap tayo tungkol sa ${categories.portfolio.join(', ')}`
            : `📋 **Portfolio**: We discussed ${categories.portfolio.join(', ')}`);
    }
    if (categories.personal.length > 0) {
        parts.push(lang === 'tl'
            ? `👤 **Personal**: Tinanong mo tungkol sa ${categories.personal.join(', ')}`
            : `👤 **Personal**: You asked about ${categories.personal.join(', ')}`);
    }
    if (categories.external.length > 0) {
        parts.push(lang === 'tl'
            ? `🔍 **Web Search**: Nag-search tayo para sa ${categories.external.join(', ')}`
            : `🔍 **Web Search**: We searched for ${categories.external.join(', ')}`);
    }

    if (parts.length === 0) {
        return lang === 'tl'
            ? 'Nagkaroon tayo ng ilang maikling usapan. Ano pa ang gusto mong pag-usapan?'
            : "We've had a brief exchange. What else would you like to explore?";
    }

    const header = lang === 'tl'
        ? `**Buod ng ating pag-uusap** (${profile.turnCount} na tanong):\n\n`
        : `**Conversation Summary** (${profile.turnCount} questions):\n\n`;

    const footer = lang === 'tl'
        ? '\n\nAno ang susunod na gusto mong pag-usapan?'
        : '\n\nWhat would you like to explore next?';

    return header + parts.join('\n') + footer;
}

// ─── User Mention Finder (Rule 6) ───────────────────────────

/**
 * findUserMention(history, keyword)
 *
 * Scans conversation history for a previous user mention of a keyword.
 * Returns the message content if found, or null.
 *
 * @param {Array} history - Array of { role, content } messages
 * @param {string} keyword - The keyword to search for
 * @returns {string|null} The user message containing the keyword, or null
 */
function findUserMention(history, keyword) {
    if (!history || !keyword) return null;

    const kw = keyword.toLowerCase();
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'user' && msg.content.toLowerCase().includes(kw)) {
            return msg.content;
        }
    }

    return null;
}

module.exports = { resolveFollowUp, isFollowUp, extractTopic, buildConversationProfile, generateSmartSummary, findUserMention };
