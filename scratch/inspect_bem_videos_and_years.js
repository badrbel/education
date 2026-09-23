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
loadScript('data/four_am.js');
loadScript('data/registry_4am.js');

const subjects = sandbox.PlatformData4AM || {};
console.log('=== BEM Structure in 4AM subjects ===');
for (const [k, s] of Object.entries(subjects)) {
  const b = s.bem;
  if (!b) {
    console.log(`${k}: NO bem object`);
    continue;
  }
  const vids = b.videoSolutions || [];
  const years = {};
  vids.forEach(v => {
    years[v.year] = (years[v.year] || 0) + 1;
  });
  console.log(`${k} (${s.name}): ${vids.length} videos, sourceUrl: ${b.sourceUrl}`);
  console.log(`   Years:`, years);
}
