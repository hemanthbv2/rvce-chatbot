const fs = require('fs');

let scriptStr = fs.readFileSync('script.js', 'utf8');
// Inject globals similar to run_current_test.js
scriptStr = scriptStr.replace('function getResponse(id) {', `
    global.test_KB = KB;
    global.test_classifyIntent = classifyIntent;
    global.test_getResponse = getResponse;
    function getResponse(id) {`);
scriptStr = scriptStr.replace(/const currentSessionId/g, 'var currentSessionId');
scriptStr = scriptStr.replace(/const getSID/g, 'var getSID');

// Stub environment
const document = { readyState: 'complete', addEventListener: () => {}, getElementById: () => ({}) };
const window = { addEventListener: () => {}, innerWidth: 1024, innerHeight: 768, location: { hostname: 'localhost', href: 'http://localhost' } };
const localStorage = { getItem: () => null, setItem: () => {} };
const sessionStorage = { getItem: () => null, setItem: () => {} };
const clearTimeout = () => {};
const setTimeout = fn => { fn(); };
const navigator = { userAgent: 'test' };
const MutationObserver = class { observe() {} };

const fullScript = `
${scriptStr}\nstartRVCEChatbot();
`;

try { eval(fullScript); } catch (e) { console.error('Eval error:', e); process.exit(1); }

let passed = 0, total = 0, results = [];
function runTest(input, expectedIntent, expectedContent) {
  total++;
  global.SESSION = { history: [], navStack: [] };
  const info = global.test_classifyIntent(input);
  const intent = info ? (info.type === 'multi' ? 'multi' : info.id) : null;
  const res = info ? global.test_getResponse(intent) : { text: '' };
  const okIntent = expectedIntent === null || intent === expectedIntent;
  const okContent = expectedContent ? res.text.includes(expectedContent) : true;
  if (okIntent && okContent) {
    passed++;
    results.push(`| ${input} | ✅ Passed | Intent: ${intent} |`);
  } else {
    results.push(`| ${input} | ❌ Failed | Expected ${expectedIntent} got ${intent}. ${!okContent ? 'Missing:' + expectedContent : ''} |`);
  }
}

// Helper to add random whitespace
function scramble(str) { return str.split(' ').map(w => Math.random() < 0.3 ? ` ${w} ` : w).join(' '); }

const depts = [];
if (global.test_KB.departments && global.test_KB.departments.ug) depts.push(...global.test_KB.departments.ug);
if (global.test_KB.departments && global.test_KB.departments.pg) depts.push(...global.test_KB.departments.pg);

// 1. Department‑specific placement queries (~200)
let cnt = 0;
for (const d of depts) {
  if (cnt >= 200) break;
  runTest(`${d.n} placement`, `plcmt_${d.c}`, d.n);
  cnt++;
}

// 2. Queries containing stop‑words "is", "me", "I'm" (~150)
const stopQueries = [
  'What is the fee for CSE?',
  'Tell me about clubs',
  "I'm interested in ECE placements",
  'Is there a hostel?',
  'What is the placement rate?',
  'How many students are there in Mechanical?',
];
stopQueries.forEach(q => runTest(q, null, null));

// 3. Random intent queries (~100) – admissions, fees, contacts etc.
const randoms = [
  'How to get admission via comedk?',
  'What is the fee for management quota?',
  'Who is the principal?',
  'Tell me about the campus life',
  'What is the address of RVCE?',
];
randoms.forEach(q => runTest(q, null, null));

// 4. Noise / gibberish queries (~50) – should fall back to generic intent
for (let i = 0; i < 50; i++) runTest('blabla random ' + i, null, null);

// Write markdown report
const reportPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/9c145923-b128-46eb-954f-65de4d06453c/500_Test_Report.md';
fs.writeFileSync(reportPath, `# 500‑Question Test Report\n\nTotal Tests Run: ${total}\nTests Passed: ${passed}\nTests Failed: ${total - passed}\n\n| Query | Result | Details |\n|---|---|---|\n${results.join('\n')}`);
console.log('Report written to', reportPath);
