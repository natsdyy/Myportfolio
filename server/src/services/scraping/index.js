/**
 * Unified Scraper Manager v2
 *
 * Returns both a structured `results` array AND the `context` string.
 * The structured data lets searchAgent.js synthesize properly
 * without regex-parsing markdown back out of a flat string.
 */

const { scrapeGoogle } = require('./google');
const { scrapeWikipedia } = require('./wikipedia');
const { scrapeReddit } = require('./reddit');
const { lookupWord, formatDefinition } = require('./dictionary');

const SOURCE_ROUTES = {
    knowledge:  ['wikipedia', 'google'],
    opinion:    ['reddit', 'google'],
    definition: ['dictionary', 'wikipedia', 'google'],
    shopping:   ['google'],
    news:       ['google'],
    general:    ['google', 'wikipedia'],
};

function detectQueryType(query) {
    const q = query.toLowerCase();

    if (/\b(define|definition|meaning of|what does .+ mean|vocabulary|synonym|antonym|word meaning|ibig sabihin ng|ano meaning ng)\b/.test(q))
        return 'definition';

    if (/\b(reddit|opinion|review|recommend|should i|worth it|best|worst|experience with|thoughts on|anong masasabi|maganda ba|review ng)\b/.test(q))
        return 'opinion';

    if (/\b(how much|price|cost|buy|cheap|expensive|shop|shopee|lazada|amazon|product|deal|discount|magkano|presyo|saan makakabili)\b/.test(q))
        return 'shopping';

    if (/\b(news|latest|today|breaking|current|happening|update|trending|balita|anong bago)\b/.test(q))
        return 'news';

    if (/\b(what is|who is|who was|explain|how does|why does|tell me about|history of|science|theory|sino si|ano ang|sino ang|ano ba ang|tungkol kay|tungkol sa|sino ba si)\b/.test(q))
        return 'knowledge';

    return 'general';
}

function extractWord(query) {
    const q = query.toLowerCase().trim();
    let match = q.match(/\b(?:define|definition of)\s+(.+)/);
    if (match) return match[1].trim();
    match = q.match(/\bmeaning of\s+(.+)/);
    if (match) return match[1].trim();
    match = q.match(/\bwhat does\s+(.+?)\s+mean/);
    if (match) return match[1].trim();
    return q.split(/\s+/).pop();
}

async function searchMultipleSources(query, queryType = null) {
    const type = queryType || detectQueryType(query);
    const sourcesToUse = SOURCE_ROUTES[type] || SOURCE_ROUTES.general;

    console.log(`[scraper-manager] Query type: "${type}" → Sources: [${sourcesToUse.join(', ')}]`);

    const tasks = [];

    if (sourcesToUse.includes('google')) {
        let googleQuery = query;

        if (type === 'shopping') {
            let item = query.toLowerCase()
                .replace(/how much is (a|an|the)?\s*/g, '')
                .replace(/what is the price of (a|an|the)?\s*/g, '')
                .replace(/price of (a|an|the)?\s*/g, '')
                .replace(/cost of (a|an|the)?\s*/g, '')
                .replace(/how much does (a|an|the)?\s*/g, '')
                .replace(/how much/g, '')
                .replace(/ cost/g, '')
                .replace(/ price/g, '')
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .trim();

            const platforms = [];
            if (!item.includes('shopee')) platforms.push('site:shopee.ph');
            if (!item.includes('lazada')) platforms.push('site:lazada.com.ph');
            if (!item.includes('amazon')) platforms.push('site:amazon.com');

            const siteModifiers = platforms.length > 0 ? platforms.join(' OR ') : '';
            googleQuery = `${item} price ${siteModifiers}`.trim();
            console.log(`[scraper-manager] 🛒 Modified shopping query: "${googleQuery}"`);
        }

        tasks.push(
            scrapeGoogle(googleQuery)
                .then(results => ({ source: 'google', results }))
                .catch(() => ({ source: 'google', results: [] }))
        );
    }

    if (sourcesToUse.includes('wikipedia')) {
        tasks.push(
            scrapeWikipedia(query, 2)
                .then(results => ({ source: 'wikipedia', results }))
                .catch(() => ({ source: 'wikipedia', results: [] }))
        );
    }

    if (sourcesToUse.includes('reddit')) {
        tasks.push(
            scrapeReddit(query, 3)
                .then(results => ({ source: 'reddit', results }))
                .catch(() => ({ source: 'reddit', results: [] }))
        );
    }

    if (sourcesToUse.includes('dictionary')) {
        const word = extractWord(query);
        tasks.push(
            lookupWord(word)
                .then(result => ({ source: 'dictionary', results: result ? [result] : [] }))
                .catch(() => ({ source: 'dictionary', results: [] }))
        );
    }

    const allResults = await Promise.all(tasks);

    // Build BOTH structured data AND context string
    let context = '';
    let totalResults = 0;
    const activeSources = [];

    // structured: { google: [], wikipedia: [], reddit: [], dictionary: [] }
    const structured = {};

    for (const { source, results } of allResults) {
        if (!results || results.length === 0) continue;

        activeSources.push(source);
        totalResults += results.length;
        structured[source] = results;

        // Keep building context string for backward compatibility
        if (source === 'google') {
            context += `\n\n=== WEB SEARCH RESULTS ===\n`;
            for (const r of results) {
                context += `[${r.title}](${r.link})\n${r.snippet}\n\n`;
            }
        }

        if (source === 'wikipedia') {
            context += `\n\n=== WIKIPEDIA ===\n`;
            for (const r of results) {
                context += `**${r.title}**\n${r.extract}\n[View Article](${r.link})\n\n`;
            }
        }

        if (source === 'reddit') {
            context += `\n\n=== COMMUNITY DISCUSSIONS (REDDIT) ===\n`;
            for (const r of results) {
                context += `**[r/${r.subreddit}] ${r.title}**\n`;
                if (r.body) context += `${r.body.substring(0, 250)}...\n`;
                context += `[Join Discussion](${r.link})\n\n`;
            }
        }

        if (source === 'dictionary') {
            context += `\n\n=== DICTIONARY ===\n`;
            for (const r of results) {
                context += formatDefinition(r) + '\n';
            }
        }
    }

    console.log(`[scraper-manager] ✅ Found ${totalResults} results from [${activeSources.join(', ')}]`);

    return {
        context: context.trim(),
        structured,               // ← NEW: clean objects, no parsing needed
        sources: activeSources,
        resultCount: totalResults,
    };
}

module.exports = { searchMultipleSources, detectQueryType, extractWord };