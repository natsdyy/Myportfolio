const { tryLocalAnswer } = require('../server/src/services/ai/localBrain');
const { processUserQuery } = require('../server/src/agents/searchAgent');

async function test() {
    console.log("=== FINAL AI PERSONALITY TEST ===");

    const localTests = ["taga saan ka?", "astig!", "randomword"];
    for (const q of localTests) {
        console.log(`\nHuman: ${q}`);
        console.log(`AI (Local):\n${tryLocalAnswer(q)}`);
    }

    // Note: We won't mock the search agent here, just verify it's exported and callable
    console.log("\n--- Testing Search Synthesis (Web) ---");
    console.log("Human: What is quantum computing?");
    const res = await processUserQuery("What is quantum computing?");
    console.log(`AI (Search):\n${res.answer}`);
}

test();
