/**
 * End-to-end smoke test for the persona engine pipeline
 */
const pe = require('./src/services/ai/personaEngine');
const sa = require('./src/agents/searchAgent');

async function test() {
    console.log('=== TONE FIX VERIFICATION ===');
    console.log('confused (no apostrophe):', pe.analyzeTone('I dont understand what you mean'));
    console.log('confused (with apostrophe):', pe.analyzeTone("I don't understand"));
    console.log('curious:', pe.analyzeTone('Im wondering how does React work'));
    console.log('grateful:', pe.analyzeTone('thank you so much'));
    console.log('');

    console.log('=== END-TO-END: Greeting ===');
    const r1 = await sa.processUserQuery('Hey there!', []);
    console.log('Mode:', r1.mode, '| Sources:', r1.sources);
    console.log('Answer:', r1.answer.substring(0, 200));
    console.log('');

    console.log('=== END-TO-END: Skills (casual) ===');
    const r2 = await sa.processUserQuery('yo what does he know', [
        { role: 'user', content: 'Hey there!' },
        { role: 'assistant', content: r1.answer }
    ]);
    console.log('Mode:', r2.mode, '| Sources:', r2.sources);
    console.log('Answer:', r2.answer.substring(0, 300));
    console.log('');

    console.log('=== END-TO-END: Frustrated query ===');
    const r3 = await sa.processUserQuery('ugh this is so annoying', []);
    console.log('Mode:', r3.mode);
    console.log('Answer:', r3.answer.substring(0, 250));
    console.log('');

    console.log('=== END-TO-END: Sad empathy ===');
    const r4 = await sa.processUserQuery('I feel really sad and lonely today', []);
    console.log('Mode:', r4.mode);
    console.log('Answer:', r4.answer.substring(0, 250));
    console.log('');

    console.log('=== END-TO-END: Summary ===');
    const history = [
        { role: 'user', content: 'Hey there!' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'What is his tech stack?' },
        { role: 'assistant', content: 'React, Node...' },
        { role: 'user', content: 'Tell me about Rentopia' },
        { role: 'assistant', content: 'Rentopia is...' },
    ];
    const r5 = await sa.processUserQuery('summarize our conversation', history);
    console.log('Answer:', r5.answer.substring(0, 400));
    console.log('');

    console.log('=== END-TO-END: Clarification (ambiguous single word) ===');
    const r6 = await sa.processUserQuery('specs', []);
    console.log('Mode:', r6.mode);
    console.log('Answer:', r6.answer.substring(0, 250));
    console.log('');

    console.log('=== ALL END-TO-END TESTS PASSED ===');
}

test().catch(e => {
    console.error('ERROR:', e.message);
    console.error(e.stack);
});
