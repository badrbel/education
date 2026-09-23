const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

const sandbox = {
  window: {},
  document: { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: () => null, setItem: () => null },
  sessionStorage: { getItem: () => null, setItem: () => null },
  console: console
};
sandbox.window = sandbox;
vm.createContext(sandbox);

function loadScript(filePath) {
  const code = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  vm.runInContext(code, sandbox, { filename: filePath });
}

loadScript('data/store.js');
loadScript('data/philosophy.js');
loadScript('data/islamic.js');
loadScript('data/history.js');
loadScript('data/math.js');
loadScript('data/arabic.js');
loadScript('data/french.js');
loadScript('data/english.js');
loadScript('data/registry.js');
loadScript('data/four_am.js');
loadScript('data/registry_4am.js');

console.log('--- 3AS PlatformData keys:', Object.keys(sandbox.PlatformData || {}));
console.log('--- 4AM PlatformData4AM keys:', Object.keys(sandbox.PlatformData4AM || {}));

if (sandbox.PlatformData4AM) {
  for (const [k, subj] of Object.entries(sandbox.PlatformData4AM)) {
    console.log(`\nSubj 4AM: ${k} (id: ${subj.id}, name: ${subj.name})`);
    console.log('  keys:', Object.keys(subj));
    if (subj.baccalaureate) console.log('  baccalaureate length:', subj.baccalaureate.length);
    if (subj.bem) console.log('  bem length:', subj.bem.length);
    if (subj.exams) console.log('  exams length:', subj.exams.length);
    if (subj.exercises) console.log('  exercises length:', subj.exercises.length);
    if (subj.summaries) console.log('  summaries length:', subj.summaries.length);
    if (subj.reviews) console.log('  reviews length:', subj.reviews.length);
    if (subj.lessons) console.log('  lessons length:', subj.lessons.length);
  }
}
