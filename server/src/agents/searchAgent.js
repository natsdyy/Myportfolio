const { searchMultipleSources, detectQueryType } = require('../services/scraping/index');
const { tryLocalAnswer } = require('../services/ai/localBrain');
const { logChatMessage, getSupabaseContext, checkCachedAnswer } = require('../services/supabase');

/**
 * Search Agent v4 — Structured Synthesis (100% Local, No API)
 *
 * Flow:
 * 0. Check SUPABASE CACHE (long-term memory)
 * 1. Try LOCAL BRAIN (instant, hardcoded portfolio data)
 * 2. Try SUPABASE KNOWLEDGE (custom cloud-stored info)
 * 3. Try MULTI-SOURCE SCRAPING (Wikipedia, Reddit, Dictionary, Google)
 * 4. SYNTHESIZE from structured data (no string parsing, no regex hacks)
 * 5. LOG to Supabase for future learning
 */
async function processUserQuery(query, history = []) {
    console.log(`\n[agent] ════════════════════════════════════`);
    console.log(`[agent] Processing: "${query}"`);

    // ── Step 0: Supabase Cache ────────────────────────────
    const cachedAnswer = await checkCachedAnswer(query);
    if (cachedAnswer) {
        console.log(`[agent] ✅ Remembered from memory`);
        return { answer: cachedAnswer, searched: false, sources: ['Memory (Supabase)'], mode: 'memory' };
    }

    // ── Step 1: Local Brain ───────────────────────────────
    const localAnswer = tryLocalAnswer(query);
    if (localAnswer) {
        console.log(`[agent] ✅ Answered via Local Brain`);
        await logChatMessage(query, localAnswer, ['local-brain']);
        return { answer: localAnswer, searched: false, sources: ['Local Brain'], mode: 'local' };
    }

    // ── Step 2: Supabase Knowledge ────────────────────────
    const supabaseContext = await getSupabaseContext(query);
    if (supabaseContext) {
        console.log(`[agent] ✅ Answered via Supabase`);
        await logChatMessage(query, supabaseContext, ['supabase']);
        return { answer: supabaseContext, searched: true, sources: ['Supabase DB'], mode: 'local' };
    }

    // ── Step 3: Multi-Source Scraping ─────────────────────
    console.log(`[agent] Searching multiple sources...`);
    const queryType = detectQueryType(query);
    let searchData = { context: '', structured: {}, sources: [], resultCount: 0 };

    try {
        searchData = await searchMultipleSources(query, queryType);
    } catch (err) {
        console.error(`[agent] Search failed:`, err.message);
    }

    const hasResults = searchData.resultCount > 0;

    // ── Step 4: Synthesize ────────────────────────────────
    let finalAnswer = '';

    if (hasResults) {
        console.log(`[agent] 📝 Synthesizing from ${searchData.resultCount} results...`);
        finalAnswer = synthesizeAnswer(query, searchData.structured, queryType);
    }

    if (!finalAnswer) {
        finalAnswer = `I couldn't find specific details about "${query}" right now. I'm best at answering things about Charles' projects, tech topics, or word definitions — maybe try rephrasing?`;
    }

    // ── Step 5: Log ───────────────────────────────────────
    await logChatMessage(query, finalAnswer, searchData.sources);

    return {
        answer: finalAnswer,
        searched: hasResults,
        sources: searchData.sources,
        mode: hasResults ? 'search' : 'local'
    };
}

// ─── Synthesis Engine ─────────────────────────────────────────

/**
 * synthesizeAnswer
 *
 * Works directly on structured scraper output:
 *   structured.wikipedia → [{ title, extract, link }]
 *   structured.google    → [{ title, snippet, link }]
 *   structured.reddit    → [{ title, body, subreddit, link }]
 *   structured.dictionary→ [{ word, phonetic, meanings }]
 *
 * No regex. No string parsing. No 250-char truncation.
 */
function synthesizeAnswer(query, structured, queryType) {
    switch (queryType) {
        case 'definition': return synthesizeDefinition(structured);
        case 'shopping':   return synthesizeShopping(structured);
        case 'knowledge':  return synthesizeKnowledge(structured);
        case 'opinion':    return synthesizeOpinion(structured);
        default:           return synthesizeGeneral(structured);
    }
}

// ── Definition ────────────────────────────────────────────────

function synthesizeDefinition(structured) {
    const dict = structured.dictionary?.[0];
    if (!dict) return null;

    const word = dict.word || '';
    const phonetic = dict.phonetic ? ` (${dict.phonetic})` : '';
    const meanings = dict.meanings || [];
    if (meanings.length === 0) return null;

    let answer = `**${word}**${phonetic}\n\n`;

    let shown = 0;
    for (const meaning of meanings) {
        if (shown >= 3) break;
        const pos = meaning.partOfSpeech || '';
        const defs = meaning.definitions || [];
        if (defs.length === 0) continue;

        answer += `*${pos}*\n`;
        answer += `${defs[0].definition}\n`;
        if (defs[0].example) answer += `> "${defs[0].example}"\n`;
        answer += '\n';
        shown++;
    }

    const synonyms = meanings[0]?.synonyms?.slice(0, 5) || [];
    if (synonyms.length > 0) {
        answer += `**Synonyms:** ${synonyms.join(', ')}`;
    }

    return answer.trim();
}

// ── Shopping ──────────────────────────────────────────────────

function synthesizeShopping(structured) {
    const results = structured.google || [];
    if (results.length === 0) return null;

    // Prefer results that mention prices
    const priceResults = results.filter(r =>
        /₱|php|peso|\$|price|cost|\d[\d,.]/.test((r.snippet || '').toLowerCase())
    );
    const toUse = priceResults.length > 0 ? priceResults : results;

    const best = toUse[0];
    let answer = trimToSentence(best.snippet || best.title, 400);

    // Add a second result if meaningfully different
    if (toUse[1]?.snippet) {
        const extra = trimToSentence(toUse[1].snippet, 200);
        if (isDifferent(answer, extra)) answer += ` ${extra}`;
    }

    if (!answer) return null;

    answer = finalize(answer) + ' Prices may vary depending on retailer and region.';

    if (best.link) {
        const label = (best.title || 'View listing').substring(0, 50);
        answer += `\n\n[${label}](${best.link})`;
    }

    return answer;
}

// ── Knowledge (What is / Who is / Explain) ────────────────────

function synthesizeKnowledge(structured) {
    const wiki = structured.wikipedia?.[0];
    const google = structured.google?.[0];

    if (wiki?.extract) {
        let answer = trimToSentence(wiki.extract, 500);

        if (google?.snippet) {
            const extra = trimToSentence(google.snippet, 200);
            if (isDifferent(answer, extra)) answer += ` ${extra}`;
        }

        answer = finalize(answer);
        if (wiki.link) answer += `\n\n[Read more on Wikipedia](${wiki.link})`;
        return answer;
    }

    return synthesizeGeneral(structured);
}

// ── Opinion / Reddit ──────────────────────────────────────────

function synthesizeOpinion(structured) {
    const reddit = structured.reddit || [];
    const google = structured.google || [];

    let answer = '';
    let topLink = null;

    if (reddit.length > 0) {
        const best = reddit.find(r => r.body?.length > 50) || reddit[0];
        answer = trimToSentence(best.body || best.title, 400);
        topLink = best.link;

        const second = reddit.find(r => r !== best && r.body?.length > 50);
        if (second?.body) {
            const extra = trimToSentence(second.body, 200);
            if (isDifferent(answer, extra)) answer += ` Others also note: ${extra}`;
        }
    }

    if (google.length > 0 && google[0].snippet) {
        const extra = trimToSentence(google[0].snippet, 200);
        if (isDifferent(answer, extra)) answer += answer ? ` ${extra}` : extra;
    }

    if (!answer) return null;

    answer = finalize(answer);
    if (topLink) answer += `\n\n[Join the discussion on Reddit](${topLink})`;

    return answer;
}

// ── General Fallback ──────────────────────────────────────────

function synthesizeGeneral(structured) {
    const google = structured.google || [];
    const wiki = structured.wikipedia || [];

    let answer = '';
    let link = null;

    if (google[0]?.snippet) {
        answer = trimToSentence(google[0].snippet, 450);
        link = google[0].link ? { label: (google[0].title || 'Read more').substring(0, 50), url: google[0].link } : null;

        if (wiki[0]?.extract) {
            const extra = trimToSentence(wiki[0].extract, 200);
            if (isDifferent(answer, extra)) {
                answer += ` ${extra}`;
                link = { label: 'Read more on Wikipedia', url: wiki[0].link };
            }
        }
    } else if (wiki[0]?.extract) {
        answer = trimToSentence(wiki[0].extract, 500);
        link = { label: 'Read more on Wikipedia', url: wiki[0].link };
    }

    if (!answer) return null;

    answer = finalize(answer);
    if (link?.url) answer += `\n\n[${link.label}](${link.url})`;

    return answer;
}

// ─── Utilities ────────────────────────────────────────────────

function trimToSentence(text, maxLen = 450) {
    if (!text) return '';
    text = text.trim();
    if (text.length <= maxLen) return text;
    const cut = text.substring(0, maxLen);
    const last = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return last > 80 ? text.substring(0, last + 1) : cut.trimEnd() + '...';
}

function finalize(text) {
    text = text.trim();
    if (!/[.!?]$/.test(text)) text += '.';
    return text;
}

function isDifferent(a, b) {
    if (!b || b.length < 40) return false;
    return a.substring(0, 80).toLowerCase() !== b.substring(0, 80).toLowerCase();
}

module.exports = { processUserQuery };