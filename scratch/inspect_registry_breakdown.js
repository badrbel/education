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

console.log('=== 4AM Subject URLs ===');
for (const [k, subj] of Object.entries(sandbox.PlatformData4AM || {})) {
  console.log(`${k}: sourceUrl=${subj.sourceUrl}, bemUrl=${subj.bemUrl}`);
}

console.log('\n=== PlatformRegistry4AM breakdown by type ===');
const reg4am = Object.values(sandbox.PlatformRegistry4AM || {});
const types4am = {};
reg4am.forEach(r => {
  types4am[r.type] = (types4am[r.type] || 0) + 1;
});
console.log(types4am);

console.log('\n=== PlatformRegistry (3AS) breakdown by type ===');
const reg3as = Object.values(sandbox.PlatformRegistry || {});
const types3as = {};
reg3as.forEach(r => {
  types3as[r.type] = (types3as[r.type] || 0) + 1;
});
console.log(types3as);

// Inspect any BEM items in PlatformRegistry4AM or PlatformRegistry
const bem4am = reg4am.filter(r => (r.type || '').includes('bem') || (r.id || '').includes('bem') || (r.url || '').includes('bem'));
console.log('\nBEM in Registry4AM count:', bem4am.length);

const bem3as = reg3as.filter(r => (r.type || '').includes('bem') || (r.id || '').includes('bem') || (r.url || '').includes('bem'));
console.log('BEM in Registry3AS count:', bem3as.length);

// Also inspect BAC in Registry3AS
const bac3as = reg3as.filter(r => (r.type || '').includes('bac') || (r.id || '').includes('bac') || (r.url || '').includes('bac'));
console.log('BAC in Registry3AS count:', bac3as.length);
if (bac3as.length > 0) {
  console.log('Sample BAC 3AS:', bac3as.slice(0, 3).map(r => ({ id: r.id, year: r.year, subject: r.subjectName, url: r.url })));
}
