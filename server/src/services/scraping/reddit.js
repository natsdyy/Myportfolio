const axios = require('axios');

/**
 * Reddit Scraper (From Scratch)
 * 
 * Uses Reddit's public JSON API (append .json to any URL).
 * No API key needed — completely free.
 * 
 * Great for: opinions, reviews, recommendations, discussions
 */

/**
 * Search Reddit for relevant posts and comments
 * @param {string} query - The search term
 * @param {number} limit - Max posts to return
 * @returns {Array} Array of { title, body, subreddit, score, comments, link }
 */
async function scrapeReddit(query, limit = 5) {
    try {
        const searchUrl = `https://www.reddit.com/search.json`;
        const response = await axios.get(searchUrl, {
            params: {
                q: query,
                sort: 'relevance',
                limit: limit,
                t: 'year'  // Time filter: posts from the last year
            },
            headers: {
                'User-Agent': 'CLA-Portfolio-Bot/1.0'
            },
            timeout: 8000
        });

        const posts = response.data?.data?.children || [];
        
        const results = posts.map(post => {
            const data = post.data;
            return {
                source: 'reddit',
                title: data.title,
                body: (data.selftext || '').substring(0, 500), // Truncate long posts
                subreddit: data.subreddit_name_prefixed || `r/${data.subreddit}`,
                score: data.score || 0,
                comments: data.num_comments || 0,
                link: `https://reddit.com${data.permalink}`,
            };
        });

        // Sort by relevance (score + comments)
        results.sort((a, b) => (b.score + b.comments) - (a.score + a.comments));

        return results;
    } catch (error) {
        console.error('[reddit] Scraper error:', error.message);
        return [];
    }
}

/**
 * Get top comments from a specific Reddit post
 * @param {string} permalink - The post permalink (e.g., /r/sub/comments/id/title/)
 * @param {number} limit - Max comments
 * @returns {Array} Array of { author, body, score }
 */
async function getRedditComments(permalink, limit = 5) {
    try {
        const url = `https://www.reddit.com${permalink}.json?limit=${limit}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'CLA-Portfolio-Bot/1.0' },
            timeout: 5000
        });

        // Reddit returns [post, comments] array
        const commentListing = response.data?.[1]?.data?.children || [];
        
        return commentListing
            .filter(c => c.kind === 't1') // Only actual comments
            .slice(0, limit)
            .map(c => ({
                author: c.data.author,
                body: (c.data.body || '').substring(0, 300),
                score: c.data.score || 0
            }));
    } catch (error) {
        console.error('[reddit] Comment fetch error:', error.message);
        return [];
    }
}

module.exports = { scrapeReddit, getRedditComments };
