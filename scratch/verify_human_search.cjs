const { processUserQuery } = require('../server/src/agents/searchAgent');

// We need to mock the scraping service since we don't want to run real scrapers in this test
const scraping = require('../server/src/services/scraping/index');
const originalSearch = scraping.searchMultipleSources;

scraping.searchMultipleSources = async (query, type) => {
    if (type === 'definition') {
        return {
            resultCount: 1,
            sources: ['Dictionary'],
            structured: {
                dictionary: [{
                    word: 'serendipity',
                    phonetic: '/ˌserənˈdipədē/',
                    meanings: [{
                        partOfSpeech: 'noun',
                        definitions: [{ definition: 'The occurrence and development of events by chance in a happy or beneficial way.' }]
                    }]
                }]
            }
        };
    }
    if (type === 'knowledge') {
        return {
            resultCount: 1,
            sources: ['Wikipedia'],
            structured: {
                wikipedia: [{
                    title: 'Artificial intelligence',
                    extract: 'Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals and humans.',
                    link: 'https://en.wikipedia.org/wiki/Artificial_intelligence'
                }]
            }
        };
    }
    return { resultCount: 0, sources: [], structured: {} };
};

async function runTest() {
    console.log("--- Testing Knowledgeable AI Synthesis ---");
    
    console.log("\nHuman: Define serendipity");
    const res1 = await processUserQuery("Define serendipity");
    console.log(`AI:\n${res1.answer}`);

    console.log("\nHuman: What is AI?");
    const res2 = await processUserQuery("What is AI?");
    console.log(`AI:\n${res2.answer}`);
    
    // Restore original
    scraping.searchMultipleSources = originalSearch;
}

runTest();
