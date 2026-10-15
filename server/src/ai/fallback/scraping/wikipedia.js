const axios = require('axios');

/**
 * Wikipedia Scraper (From Scratch)
 * 
 * Uses Wikipedia's free REST API to fetch article summaries.
 * No API key needed — completely free and unlimited.
 * 
 * Great for: "What is...", "Tell me about...", "Explain..."
 */

/**
 * Search Wikipedia and return article summaries
 * @param {string} query - The search term
 * @param {number} limit - Max number of results
 * @returns {Array} Array of { title, extract, link }
 */
async function scrapeWikipedia(query, limit = 3) {
    try {
        // Step 1: Search for relevant articles
        const searchUrl = `https://en.wikipedia.org/w/api.php`;
        const searchResponse = await axios.get(searchUrl, {
            params: {
                action: 'query',
                list: 'search',
                srsearch: query,
                srlimit: limit,
                format: 'json',
                origin: '*'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });

        const searchResults = searchResponse.data?.query?.search || [];
        if (searchResults.length === 0) return [];

        // Step 2: Fetch summaries for each result using the REST API
        const summaries = await Promise.all(
            searchResults.map(async (result) => {
                try {
                    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
                    const summaryResponse = await axios.get(summaryUrl, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                        }
                    });

                    const data = summaryResponse.data;
                    return {
                        source: 'wikipedia',
                        title: data.title,
                        extract: data.extract || '',
                        link: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
                    };
                } catch {
                    return null;
                }
            })
        );

        return summaries.filter(Boolean);
    } catch (error) {
        console.error('[wikipedia] Scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeWikipedia };
