const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Initialize stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Local Search Scraper v5 (DuckDuckGo Lite Edition)
 * 
 * Uses DuckDuckGo Lite via Puppeteer. 
 * Extremely stable, no CAPTCHAs, and provides high-quality results
 * for shopping and general knowledge queries.
 */
async function scrapeGoogle(query, maxResults = 5) {
    console.log(`[search-scraper] Searching: "${query}"`);
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

        // Go to DDG Lite (fast, text-based)
        await page.goto('https://lite.duckduckgo.com/lite/', { waitUntil: 'domcontentloaded' });

        // Type query and submit
        await page.type('input[name=q]', query);
        await Promise.all([
            page.click('input[type=submit]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        // Extract results from the table-based layout
        const results = await page.evaluate((max) => {
            const items = [];
            const rows = Array.from(document.querySelectorAll('table tr'));
            
            // DDG Lite results are structured in groups of rows
            // Row 1: Title & Link
            // Row 2: Snippet
            // Row 3: URL text
            for (let i = 0; i < rows.length; i++) {
                if (items.length >= max) break;

                const linkEl = rows[i].querySelector('a.result-link');
                if (linkEl) {
                    const title = linkEl.innerText.trim();
                    const link = linkEl.href;
                    
                    // The snippet is usually in the next row's .result-snippet
                    let snippet = '';
                    if (rows[i + 1] && rows[i + 1].querySelector('.result-snippet')) {
                        snippet = rows[i + 1].querySelector('.result-snippet').innerText.trim();
                    }

                    if (title && link) {
                        items.push({
                            source: 'web-search',
                            title: title,
                            link: link,
                            snippet: snippet.substring(0, 300)
                        });
                        // Skip the next two rows as we've already processed them (snippet and URL)
                        i += 2;
                    }
                }
            }
            return items;
        }, maxResults);

        console.log(`[search-scraper] ✅ Found ${results.length} results.`);
        return results;

    } catch (error) {
        console.error(`[search-scraper] ❌ Error:`, error.message);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeGoogle };
