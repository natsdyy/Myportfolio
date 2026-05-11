const { tryLocalAnswer } = require('../server/src/services/ai/localBrain');
const { processUserQuery } = require('../server/src/agents/searchAgent');

async function test() {
    console.log("=== NATIVE LANGUAGE MATCHING TEST ===");

    const tests = [
        { q: "Who is Charles?", lang: "EN" },
        { q: "Sino si Charles?", lang: "TL" },
        { q: "Where are you based?", lang: "EN" },
        { q: "Saan ka sa dasmarinas cavite?", lang: "TL" },
        { q: "astig!", lang: "TL" },
        { q: "cool!", lang: "EN" },
        { q: "ano ang quantum computing?", lang: "TL" }
    ];

    for (const item of tests) {
        console.log(`\n[${item.lang}] Human: ${item.q}`);
        
        // Try local first
        let res = tryLocalAnswer(item.q);
        if (res) {
            console.log(`AI (Local):\n${res}`);
        } else {
            // Web search
            console.log("...searching web...");
            const searchRes = await processUserQuery(item.q);
            console.log(`AI (Search):\n${searchRes.answer}`);
        }
    }
}

test();
