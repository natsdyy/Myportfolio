const { searchMultipleSources, detectQueryType } = require('../services/scraping/index');
const { tryLocalAnswer } = require('../services/ai/localBrain');
const { logChatMessage, getSupabaseContext, checkCachedAnswer } = require('../services/supabase');

/**
 * Search Agent v3 (100% Local Intelligence + Supabase)
 * 
 * Flow:
 * 0. Check SUPABASE CACHE (long-term memory)
 * 1. Try LOCAL BRAIN (instant, hardcoded portfolio data)
 * 2. Try SUPABASE KNOWLEDGE (custom cloud-stored info)
 * 3. Try MULTI-SOURCE SCRAPING (Wikipedia, Reddit, Dictionary, Google)
 * 4. SYNTHESIZE answer locally (no external LLM API)
 * 5. LOG to Supabase for future learning
 */
async function processUserQuery(query, history = []) {
    console.log(`\n[agent] ════════════════════════════════════`);
    console.log(`[agent] Processing: "${query}"`);

    // ── Step 0: Check Long-Term Memory (Supabase Cache) ────
    console.log(`[agent] Checking memory...`);
    const cachedAnswer = await checkCachedAnswer(query);
    if (cachedAnswer) {
        console.log(`[agent] ✅ Remembered from memory`);
        return {
            answer: cachedAnswer,
            searched: false,
            sources: ['Memory (Supabase)'],
            mode: 'local'
        };
    }

    // ── Step 1: Try Local Brain (Portfolio Data) ──────────
    const localAnswer = tryLocalAnswer(query);
    if (localAnswer) {
        console.log(`[agent] ✅ Answered via Local Brain`);
        await logChatMessage(query, localAnswer, ['local-brain']);
        return {
            answer: localAnswer,
            searched: false,
            sources: ['Local Brain'],
            mode: 'local'
        };
    }

    // ── Step 2: Try Supabase Knowledge Base ───────────────
    console.log(`[agent] Checking Supabase for custom knowledge...`);
    const supabaseContext = await getSupabaseContext(query);
    if (supabaseContext) {
        console.log(`[agent] ✅ Answered via Supabase`);
        await logChatMessage(query, supabaseContext, ['supabase']);
        return {
            answer: supabaseContext,
            searched: true,
            sources: ['Supabase DB'],
            mode: 'local'
        };
    }

    // ── Step 3: Multi-Source Scraping ─────────────────────
    console.log(`[agent] Searching multiple sources...`);
    const queryType = detectQueryType(query);
    let searchData = { context: '', sources: [], resultCount: 0 };

    try {
        searchData = await searchMultipleSources(query, queryType);
    } catch (err) {
        console.error(`[agent] Search failed:`, err.message);
    }

    const hasContext = searchData.context.length > 0;

    // ── Step 4: Local Synthesis (Formatting) ──────────────
    let finalAnswer = "";

    if (hasContext) {
        console.log(`[agent] 📝 Synthesizing answer from ${searchData.resultCount} results...`);
        finalAnswer = formatSearchAnswer(query, searchData);
    } else {
        console.log(`[agent] ⚠️ No info found.`);
        finalAnswer = `I couldn't find specific information about "${query}" in my knowledge base or via web search. Could you try rephrasing your question? I'm best at answering things about Charles' projects, tech topics, or word definitions!`;
    }

    // ── Step 5: Log interaction ───────────────────────────
    await logChatMessage(query, finalAnswer, searchData.sources);

    return {
        answer: finalAnswer,
        searched: hasContext,
        sources: searchData.sources,
        mode: hasContext ? 'search' : 'local'
    };
}

/**
 * Local Synthesis Engine
 * Formats scraped data into a clean, readable response without using an LLM.
 */
function formatSearchAnswer(query, searchData) {
    const { context, sources } = searchData;
    
    // Split context by the separator we used in scraper manager
    const sections = context.split('===');
    let formatted = `I found some information regarding "**${query}**":\n\n`;

    // Only take the first few relevant sections to avoid wall of text
    const relevantSections = sections.filter(s => s.trim().length > 0).slice(0, 2);

    relevantSections.forEach(section => {
        const lines = section.trim().split('\n');
        const header = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        formatted += `### 📍 From ${header}\n${content}\n\n`;
    });

    formatted += `*Note: I am running in Local Intelligence mode.*`;

    return formatted;
}

module.exports = { processUserQuery };
