const { tryLocalAnswer } = require('../server/src/services/ai/localBrain');

const testQueries = [
    "astig!",
    "okay cool",
    "wow",
    "supercalifragilistic", // Unknown simple word (1 word)
    "random stuff",         // Unknown (2 words)
    "what is the meaning of life and everything in between" // Fallback to web (long)
];

console.log("--- Testing Chatter & Fallback ---");
testQueries.forEach(q => {
    console.log(`\nHuman: ${q}`);
    const answer = tryLocalAnswer(q);
    console.log(`AI:\n${answer}`);
});
