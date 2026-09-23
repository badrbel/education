const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '../..');
const regCode = fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8');
const fourAmCode = fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8');
const appCode = fs.readFileSync(path.join(baseDir, 'app.js'), 'utf8');

// 1. Emoji check matching canonical project test
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
const regMatches = regCode.match(emojiRegex) || [];
const fourAmMatches = fourAmCode.match(emojiRegex) || [];
const appMatches = appCode.match(emojiRegex) || [];

assert.strictEqual(regMatches.length, 0, `EMOJI FOUND IN registry_4am.js: ${regMatches.length}`);
assert.strictEqual(fourAmMatches.length, 0, `EMOJI FOUND IN four_am.js: ${fourAmMatches.length}`);
assert.strictEqual(appMatches.length, 0, `EMOJI FOUND IN app.js: ${appMatches.length}`);
console.log('[PASS] Zero Emojis verified across all modified files.');

// 2. Data load and integrity
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(regCode, sandbox);
vm.runInContext(fourAmCode, sandbox);

const reg = sandbox.window.PlatformRegistry4AM;
const fourAm = sandbox.window.PlatformData4AM;

const expectedSubjects = [
  'math_4am', 'arabic_4am', 'physics_4am', 'science_4am',
  'french_4am', 'english_4am', 'history_geography_4am',
  'islamic_4am', 'civics_4am'
];

let totalVideoSolutions = 0;
const subjectsSummary = [];

for (const sId of expectedSubjects) {
  const resId = `4am-bem-${sId.replace('_4am', '').replace('history_geography', 'history')}`;
  const bemRes = reg[resId];
  assert(bemRes, `BEM resource ${resId} missing in registry_4am`);
  assert(Array.isArray(bemRes.videoSolutions), `videoSolutions array missing in ${resId}`);
  assert(bemRes.videoSolutions.length > 0, `No video solutions in ${resId}`);
  assert(bemRes.solution.videoSolutionsCount === bemRes.videoSolutions.length, `Count mismatch in ${resId}`);

  // Validate each video solution
  for (const v of bemRes.videoSolutions) {
    assert(v.id && /^[a-zA-Z0-9_-]{11}$/.test(v.id), `Invalid video ID: ${v.id}`);
    assert(v.url === `https://www.youtube.com/watch?v=${v.id}`, `URL mismatch in ${v.id}`);
    assert(!v.url.includes('search_query='), `Search URL detected in ${v.url}`);
    assert(v.year === 2024 || v.year === 2023, `Unexpected year: ${v.year}`);
    totalVideoSolutions++;
  }

  // Four AM check
  const subj = fourAm[sId];
  assert(subj, `Subject ${sId} missing in four_am`);
  assert(subj.bem, `subj.bem missing in ${sId}`);
  assert(subj.bem.videoSolutionsCount === bemRes.videoSolutions.length, `four_am bem count mismatch in ${sId}`);

  subjectsSummary.push({
    subjectId: sId,
    resourceId: resId,
    solutionsCount: bemRes.videoSolutions.length
  });
}

console.log(`[PASS] All 9 BEM resources verified. Total video solutions ingested: ${totalVideoSolutions}`);
subjectsSummary.forEach(s => {
  console.log(`  - ${s.subjectId} (${s.resourceId}): ${s.solutionsCount} verified solutions`);
});

console.log('\n--- ALL INGESTION VERIFICATIONS PASSED (100% SUCCESS) ---');
