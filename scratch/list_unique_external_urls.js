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

const allRegistryItems = [];

// 3AS registry
if (sandbox.PlatformRegistry) {
  for (const [id, r] of Object.entries(sandbox.PlatformRegistry)) {
    allRegistryItems.push({ registry: '3AS', id, ...r });
  }
}

// 4AM registry
if (sandbox.PlatformRegistry4AM) {
  for (const [id, r] of Object.entries(sandbox.PlatformRegistry4AM)) {
    allRegistryItems.push({ registry: '4AM', id, ...r });
  }
}

console.log('Total registry items:', allRegistryItems.length);

const externalItems = [];
const uniqueUrls = new Map();

allRegistryItems.forEach(item => {
  const urls = [];
  if (item.url && !item.url.includes('youtube.com') && !item.url.includes('youtu.be')) urls.push({ field: 'url', u: item.url });
  if (item.sourceUrl && !item.sourceUrl.includes('youtube.com') && !item.sourceUrl.includes('youtu.be')) urls.push({ field: 'sourceUrl', u: item.sourceUrl });
  if (item.problem && item.problem.url && !item.problem.url.includes('youtube.com') && !item.problem.url.includes('youtu.be')) urls.push({ field: 'problem.url', u: item.problem.url });
  if (item.solution && item.solution.url && !item.solution.url.includes('youtube.com') && !item.solution.url.includes('youtu.be')) urls.push({ field: 'solution.url', u: item.solution.url });
  if (item.source && item.source.url && !item.source.url.includes('youtube.com') && !item.source.url.includes('youtu.be')) urls.push({ field: 'source.url', u: item.source.url });

  if (urls.length > 0) {
    externalItems.push({ item, urls });
    urls.forEach(({ u }) => {
      if (!uniqueUrls.has(u)) {
        uniqueUrls.set(u, []);
      }
      uniqueUrls.get(u).push({ id: item.id, type: item.type, subject: item.subjectName || item.subjectId, level: item.level || item.levelId });
    });
  }
});

console.log('Total external items in registry:', externalItems.length);
console.log('Total UNIQUE external URLs:', uniqueUrls.size);

console.log('\n--- Unique URLs list:');
for (const [u, items] of uniqueUrls.entries()) {
  console.log(`URL: ${u} (used by ${items.length} items, e.g. ${items[0].type} / ${items[0].subject} / ${items[0].level})`);
}
