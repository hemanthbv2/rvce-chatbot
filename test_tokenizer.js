const fs = require('fs');
const scriptContent = fs.readFileSync('script.js', 'utf8');

// Use eval to load just the NLP portion we added
const nlpPortion = scriptContent.substring(
    scriptContent.indexOf('const STOP_WORDS'),
    scriptContent.indexOf('/* =============== CONTENT MODERATION =============== */')
);

eval(nlpPortion);

const test1 = "Can you please tell me about the Computer Science HOD?";
const res1 = processNLPInput(test1);
console.log("Input:", test1);
console.log("Tokens:", res1.tokens);
console.log("Clean String:", res1.cleanString);

const test2 = "What is the fee structure for management quota in 2026?!";
const res2 = processNLPInput(test2);
console.log("\nInput:", test2);
console.log("Tokens:", res2.tokens);
console.log("Clean String:", res2.cleanString);
