const { resolveFollowUp } = require('../server/src/services/ai/conversationContext');
const { processUserQuery } = require('../server/src/agents/searchAgent');

// ─── Unit Tests for Context Resolver ─────────────────────────

function testResolver() {
    console.log("=== CONTEXT RESOLVER UNIT TESTS ===\n");

    const tests = [
        {
            name: "Follow-up: 'price?' after iPhone query",
            query: "price?",
            history: [
                { role: 'user', content: 'how much iphone 17?' },
                { role: 'assistant', content: 'The iPhone 17 Pro Max costs...' }
            ],
            expectFollowUp: true,
            expectContains: 'iphone 17'
        },
        {
            name: "Follow-up: 'specs?' after iPhone query",
            query: "specs?",
            history: [
                { role: 'user', content: 'how much iphone 17?' },
                { role: 'assistant', content: 'The iPhone 17 Pro Max costs...' }
            ],
            expectFollowUp: true,
            expectContains: 'iphone 17'
        },
        {
            name: "Follow-up: 'more details' about Rentopia",
            query: "more details",
            history: [
                { role: 'user', content: 'tell me about Rentopia' },
                { role: 'assistant', content: 'Rentopia is a real estate platform...' }
            ],
            expectFollowUp: true,
            expectContains: 'rentopia'
        },
        {
            name: "Follow-up: 'how much is it?' with pronoun",
            query: "how much is it?",
            history: [
                { role: 'user', content: 'what is PS5' },
                { role: 'assistant', content: 'The PS5 is a gaming console...' }
            ],
            expectFollowUp: true,
            expectContains: 'ps5'
        },
        {
            name: "Follow-up: Tagalog 'ano pa?' (what else?)",
            query: "ano pa?",
            history: [
                { role: 'user', content: 'sino si charles?' },
                { role: 'assistant', content: 'Si Charles ay isang developer...' }
            ],
            expectFollowUp: true,
            expectContains: 'charles'
        },
        {
            name: "NOT a follow-up: 'hello' (new greeting)",
            query: "hello",
            history: [
                { role: 'user', content: 'how much iphone 17?' },
                { role: 'assistant', content: 'The iPhone 17 costs...' }
            ],
            expectFollowUp: false,
            expectContains: null
        },
        {
            name: "NOT a follow-up: full question (self-contained)",
            query: "What is quantum computing and how does it work?",
            history: [
                { role: 'user', content: 'how much iphone 17?' },
                { role: 'assistant', content: 'The iPhone 17 costs...' }
            ],
            expectFollowUp: false,
            expectContains: null
        },
        {
            name: "NOT a follow-up: no history",
            query: "price?",
            history: [],
            expectFollowUp: false,
            expectContains: null
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = resolveFollowUp(test.query, test.history);
        
        const followUpOk = result.wasFollowUp === test.expectFollowUp;
        const containsOk = !test.expectContains || result.resolved.toLowerCase().includes(test.expectContains);
        const ok = followUpOk && containsOk;

        const status = ok ? '✅' : '❌';
        console.log(`${status} ${test.name}`);
        console.log(`   Query: "${test.query}" → "${result.resolved}"`);
        console.log(`   Follow-up: ${result.wasFollowUp} (expected: ${test.expectFollowUp})`);
        if (!ok) {
            if (!followUpOk) console.log(`   ⚠️  Follow-up detection mismatch!`);
            if (!containsOk) console.log(`   ⚠️  Expected resolved to contain "${test.expectContains}"`);
        }
        console.log();

        if (ok) passed++; else failed++;
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);
    return failed === 0;
}

// ─── Integration Test ────────────────────────────────────────

async function testIntegration() {
    console.log("=== INTEGRATION TEST (Live Search) ===\n");

    // Simulate the exact scenario from the screenshot
    const history = [
        { role: 'assistant', content: "Hi! I'm Charles' personal AI..." },
        { role: 'user', content: 'how much iphone 17?' },
        { role: 'assistant', content: 'Looking to get "how much iphone 17?"? I\'ve scanned the current retail landscape...' }
    ];

    console.log("Turn 1: User asks 'how much iphone 17?'");
    console.log("Turn 2: User follows up with 'price?'\n");

    const result = await processUserQuery("price?", history);
    console.log(`AI Response:\n${result.answer}\n`);
    console.log(`Mode: ${result.mode}`);
    console.log(`Sources: ${result.sources.join(', ')}`);
}

// ─── Run ─────────────────────────────────────────────────────

const unitsPassed = testResolver();
if (unitsPassed) {
    testIntegration().catch(console.error);
} else {
    console.log("⚠️  Skipping integration test due to unit test failures.");
}
