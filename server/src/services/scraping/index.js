/**
 * Unified Scraper Manager (From Scratch)
 * 
 * The "Traffic Controller" for all scrapers.
 * Takes a query, determines which sources to use,
 * runs them in PARALLEL, and merges the results.
 * 
 * This is 100% custom code — no frameworks.
 */

const { scrapeGoogle } = require('./google');
const { scrapeWikipedia } = require('./wikipedia');
const { scrapeReddit } = require('./reddit');
const { lookupWord, formatDefinition } = require('./dictionary');

/**
 * Source routing map
 * Determines which scrapers to run based on query intent.
 */
const SOURCE_ROUTES = {
    knowledge: ['wikipedia', 'google'],
    opinion:   ['reddit', 'google'],
    definition:['dictionary'],
    shopping:  ['google'],
    news:      ['google'],
    general:   ['google', 'wikipedia'],
};

/**
 * Detect what type of information the user is looking for
 * @param {string} query
 * @returns {string} Route key from SOURCE_ROUTES
 */
function detectQueryType(query) {
    const q = query.toLowerCase();

    // Dictionary / vocabulary
    if (/\b(define|definition|meaning of|what does .+ mean|vocabulary|synonym|antonym|word meaning)\b/.test(q)) {
        return 'definition';
    }

    // Opinion / review / recommendation
    if (/\b(reddit|opinion|review|recommend|should i|worth it|best|worst|experience with|thoughts on)\b/.test(q)) {
        return 'opinion';
    }

    // Shopping / products
    if (/\b(how much|price|cost|buy|cheap|expensive|shop|shopee|lazada|amazon|product|deal|discount)\b/.test(q)) {
        return 'shopping';
    }

    // News / current events
    if (/\b(news|latest|today|breaking|current|happening|update|trending)\b/.test(q)) {
        return 'news';
    }

    // Knowledge / educational
    if (/\b(what is|who is|who was|explain|how does|why does|tell me about|history of|science|theory)\b/.test(q)) {
        return 'knowledge';
    }

    return 'general';
}

/**
 * Extract the target word from a definition query
 * e.g., "define eloquent" → "eloquent"
 *       "what does serendipity mean" → "serendipity"
 */
function extractWord(query) {
    const q = query.toLowerCase().trim();
    
    // "define X" or "definition of X"
    let match = q.match(/\b(?:define|definition of)\s+(.+)/);
    if (match) return match[1].trim();

    // "meaning of X"
    match = q.match(/\bmeaning of\s+(.+)/);
    if (match) return match[1].trim();

    // "what does X mean"
    match = q.match(/\bwhat does\s+(.+?)\s+mean/);
    if (match) return match[1].trim();

    // Fallback: use last word
    const words = q.split(/\s+/);
    return words[words.length - 1];
}

/**
 * Run multiple scrapers in parallel and merge results
 * @param {string} query - User's query
 * @param {string} queryType - Type detected by detectQueryType
 * @returns {Object} { context, sources, resultCount }
 */
async function searchMultipleSources(query, queryType = null) {
    const type = queryType || detectQueryType(query);
    const sourcesToUse = SOURCE_ROUTES[type] || SOURCE_ROUTES.general;

    console.log(`[scraper-manager] Query type: "${type}" → Sources: [${sourcesToUse.join(', ')}]`);

    // Build scraper tasks
    const tasks = [];

    if (sourcesToUse.includes('google')) {
        let googleQuery = query;
        
        // ── SHOPPING INTENT OVERRIDE ──
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
                .replace(/[^a-zA-Z0-9 ]/g, '') // Remove punctuation
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

    // Run ALL scrapers in parallel for maximum speed
    const allResults = await Promise.all(tasks);

    // Build context string from all results
    let context = '';
    let totalResults = 0;
    const activeSources = [];

    for (const { source, results } of allResults) {
        if (!results || results.length === 0) continue;
        
        activeSources.push(source);
        totalResults += results.length;

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
        sources: activeSources,
        resultCount: totalResults
    };
}

module.exports = { searchMultipleSources, detectQueryType, extractWord };
