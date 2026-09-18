const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Serverless Search Scraper (DuckDuckGo HTML Edition)
 *
 * Replaces the former Puppeteer/Chromium scraper so the AI can run as a
 * serverless function. Fetches DuckDuckGo's plain-HTML endpoint and parses it
 * with Cheerio — no browser, no binary downloads, cold-start friendly.
 *
 * Note: DuckDuckGo's HTML endpoint is free but rate-limited and can
 * occasionally return a challenge page for bot-like traffic. For guaranteed
 * results, swap this for a hosted search API (Brave, SerpAPI, etc.).
 */

function decodeDdgUrl(href) {
    try {
        const url = href && href.startsWith('//') ? `https:${href}` : href;
        const parsed = new URL(url);
        const uddg = parsed.searchParams.get('uddg');
        return uddg ? decodeURIComponent(uddg) : url;
    } catch {
        return href;
    }
}

async function scrapeGoogle(query, maxResults = 5) {
    console.log(`[search-scraper] Searching: "${query}"`);
    try {
        const response = await axios.get('https://html.duckduckgo.com/html/', {
            params: { q: query },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('a.result__a').each((i, el) => {
            if (results.length >= maxResults) return false;

            const $title = $(el);
            const title = $title.text().trim();
            const rawHref = $title.attr('href');
            if (!title || !rawHref) return;

            const $container = $title.closest('.result') || $title.parent();
            const snippet = $container.find('.result__snippet').first().text().trim();

            results.push({
                source: 'web-search',
                title,
                link: decodeDdgUrl(rawHref),
                snippet: snippet.substring(0, 300),
            });
        });

        console.log(`[search-scraper] ✅ Found ${results.length} results.`);
        return results;
    } catch (error) {
        console.error(`[search-scraper] ❌ Error:`, error.message);
        return [];
    }
}

module.exports = { scrapeGoogle };

