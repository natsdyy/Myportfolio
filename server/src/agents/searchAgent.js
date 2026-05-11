const { searchMultipleSources, detectQueryType } = require('../services/scraping/index');
const { tryLocalAnswer, detectLanguage } = require('../services/ai/localBrain');
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
        const rawAnswer = synthesizeAnswer(query, searchData.structured, queryType);
        finalAnswer = wrapWithPersonality(rawAnswer, queryType, query);
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

/**
 * wrapWithPersonality
 * 
 * Adds a knowledgeable, human-like persona to the raw data.
 * Makes the AI sound like it "knows all" as requested.
 */
function wrapWithPersonality(answer, type, query) {
    if (!answer) return null;

    const lang = detectLanguage(query);
    
    const intros = {
        definition: lang === 'tl' ? [
            `Ito ang nahanap ko para sa "${query}" sa aking linguistic database:`,
            `Ah, "${query}"! Isang magandang salita. Narito ang ibig sabihin nito:`,
            `Naghahanap ka ba ng kahulugan ng "${query}"? Ito ang detalye:`
        ] : [
            `I've analyzed the term "${query}" for you. Here is the official breakdown:`,
            `Ah, "${query}"! That's a fascinating word. According to my linguistic database:`,
            `Looking for the meaning of "${query}"? I've got you covered:`,
            `My dictionary modules return the following for "${query}":`
        ],
        knowledge: lang === 'tl' ? [
            `Ito ang mga impormasyong nahanap ko tungkol sa "${query}":`,
            `Tungkol sa "${query}", narito ang summary ng aking kaalaman:`,
            `Nag-access ako sa aking knowledge bank para sa "${query}":`
        ] : [
            `I've accessed my knowledge bank regarding "${query}". Here's the most accurate summary:`,
            `Ah, "${query}"! I have a lot of data on that. Here is what you need to know:`,
            `I've synthesized the latest information about "${query}" for you:`,
            `Searching my core intelligence for "${query}"... Here is the breakdown:`
        ],
        shopping: lang === 'tl' ? [
            `Nahanap ko ang mga presyo at detalye para sa "${query}":`,
            `Gusto mo bang bumili ng "${query}"? Ito ang mga listings na nakita ko:`
        ] : [
            `I've tracked down some pricing and availability for "${query}":`,
            `Looking to get "${query}"? I've scanned the current retail landscape for you:`,
            `I found some listings for "${query}"! Here's the deal:`
        ],
        opinion: lang === 'tl' ? [
            `Sinuri ko ang mga diskusyon tungkol sa "${query}". Ito ang sabi nila:`,
            `Maraming nagsasalita tungkol sa "${query}". Narito ang consensus:`
        ] : [
            `I've been scanning global discussions about "${query}". Here is the current consensus:`,
            `People are talking about "${query}"! I've analyzed the latest threads for you:`,
            `I've checked the discussion boards regarding "${query}". Here's what they're saying:`
        ],
        general: lang === 'tl' ? [
            `Nag-scan ako para sa "${query}" at ito ang nahanap ko:`,
            `Narito ang intelligence na nakuha ko tungkol sa "${query}":`
        ] : [
            `I've performed a high-level scan for "${query}" and found this:`,
            `Here is the intelligence I've gathered on "${query}":`,
            `Synthesizing data for "${query}"... Here is what I found:`
        ]
    };

    const outros = lang === 'tl' ? [
        "Sana ay nakatulong ito! May iba ka pa bang gustong itanong?",
        "Iyan ang pinakabagong info na mayroon ako. Ano pa ang maihahanda ko para sa iyo?",
        "Interesante, 'di ba? Sabihan mo lang ako kung kailangan mo pa ng detalye!",
        "Lagi akong nandito para sumagot. Ano ang susunod nating pag-uusapan?"
    ] : [
        "I hope that clarifies things for you! Is there anything else you're curious about?",
        "That's the most up-to-date info I have on file. What else can I find for you?",
        "Fascinating stuff, isn't it? Let me know if you need more details!",
        "I'm always here if you have more questions. What's next on your mind?",
        "I've got plenty more data if you need it. Just ask!"
    ];

    const intro = pickRandom(intros[type] || intros.general);
    const outro = pickRandom(outros);

    return `${intro}\n\n${answer}\n\n${outro}`;
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { processUserQuery };