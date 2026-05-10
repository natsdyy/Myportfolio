const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Google Scraper (From Scratch — Improved)
 * 
 * Fetches search results by parsing Google's HTML.
 * No API key needed. Includes retry logic and better selectors.
 */

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

/**
 * Scrape Google search results
 * @param {string} query - Search term
 * @param {number} maxResults - Maximum results to return
 * @returns {Array} Array of { title, link, snippet, source }
 */
async function scrapeGoogle(query, maxResults = 5) {
    const attempts = 2;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
            const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                },
                timeout: 8000
            });

            const $ = cheerio.load(response.data);
            const results = [];

            // Try multiple CSS selectors (Google changes these frequently)
            const selectors = ['.g', '.tF2Cxc', 'div[data-sokoban-container]', '.v7W49e', '.MjjYud'];
            
            // Check for Featured Snippet (Instant Answer)
            const featuredSnippet = $('.LGOjbe, .hgK6M, .Z0LcW, .kp-blk').first().text();
            if (featuredSnippet) {
                results.push({
                    source: 'google-featured',
                    title: 'Featured Snippet',
                    link: searchUrl,
                    snippet: featuredSnippet.trim()
                });
            }

            for (const selector of selectors) {
                $(selector).each((i, element) => {
                    if (results.length >= maxResults) return false;
                    
                    const title = $(element).find('h3').first().text();
                    const link = $(element).find('a').first().attr('href');
                    const snippet = $(element).find('.VwiC3b').text() 
                        || $(element).find('.st').text()
                        || $(element).find('[data-sncf]').text()
                        || $(element).find('.IsZvec').text()
                        || '';

                    if (title && link && link.startsWith('http')) {
                        // Avoid duplicate links
                        if (!results.some(r => r.link === link)) {
                            results.push({
                                source: 'google',
                                title,
                                link,
                                snippet: snippet.trim().substring(0, 300)
                            });
                        }
                    }
                });

                if (results.length > 0) break; // Found results, stop trying selectors
            }

            if (results.length > 0) {
                console.log(`[google] Found ${results.length} results (attempt ${attempt})`);
                return results;
            }
            
            console.warn(`[google] No results found with selectors (attempt ${attempt})`);
        } catch (error) {
            console.error(`[google] Attempt ${attempt} failed:`, error.message);
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
            }
        }
    }

    return [];
}

module.exports = { scrapeGoogle };
