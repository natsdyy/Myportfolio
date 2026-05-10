const axios = require('axios');

/**
 * Dictionary API Scraper (From Scratch)
 * 
 * Uses the Free Dictionary API (dictionaryapi.dev).
 * No API key needed — completely free and open source.
 * 
 * Great for: "define X", "meaning of X", "what does X mean"
 */

/**
 * Look up a word definition
 * @param {string} word - The word to define
 * @returns {Object|null} { word, phonetic, meanings: [{ partOfSpeech, definitions }] }
 */
async function lookupWord(word) {
    try {
        const cleanWord = word.trim().toLowerCase().replace(/[^a-z\s-]/g, '');
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
        
        const response = await axios.get(url, { timeout: 5000 });
        const entry = response.data?.[0];
        
        if (!entry) return null;

        // Extract phonetic
        const phonetic = entry.phonetic || 
            entry.phonetics?.find(p => p.text)?.text || '';

        // Extract meanings with definitions and examples
        const meanings = (entry.meanings || []).map(meaning => ({
            partOfSpeech: meaning.partOfSpeech,
            definitions: (meaning.definitions || []).slice(0, 3).map(def => ({
                definition: def.definition,
                example: def.example || null,
                synonyms: (def.synonyms || []).slice(0, 5)
            })),
            synonyms: (meaning.synonyms || []).slice(0, 5),
            antonyms: (meaning.antonyms || []).slice(0, 5),
        }));

        return {
            source: 'dictionary',
            word: entry.word,
            phonetic,
            meanings,
            sourceUrl: entry.sourceUrls?.[0] || `https://en.wiktionary.org/wiki/${cleanWord}`
        };
    } catch (error) {
        if (error.response?.status === 404) {
            console.log(`[dictionary] Word not found: "${word}"`);
        } else {
            console.error('[dictionary] API error:', error.message);
        }
        return null;
    }
}

/**
 * Format a dictionary result into a readable string
 * @param {Object} result - The result from lookupWord
 * @returns {string} Formatted text
 */
function formatDefinition(result) {
    if (!result) return '';

    let text = `**${result.word}**`;
    if (result.phonetic) text += ` ${result.phonetic}`;
    text += '\n\n';

    for (const meaning of result.meanings) {
        text += `*${meaning.partOfSpeech}*\n`;
        meaning.definitions.forEach((def, i) => {
            text += `${i + 1}. ${def.definition}\n`;
            if (def.example) text += `   _Example: "${def.example}"_\n`;
        });
        if (meaning.synonyms.length > 0) {
            text += `   Synonyms: ${meaning.synonyms.join(', ')}\n`;
        }
        text += '\n';
    }

    return text.trim();
}

module.exports = { lookupWord, formatDefinition };
