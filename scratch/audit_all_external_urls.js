const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

// Collect all URLs from registries and data
const urlUsage = new Map();

function recordUrl(url, meta) {
  if (!url || typeof url !== 'string') return;
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return;
  if (!urlUsage.has(trimmed)) {
    urlUsage.set(trimmed, []);
  }
  urlUsage.get(trimmed).push(meta);
}

// 3AS Registry
for (const [id, r] of Object.entries(sandbox.PlatformRegistry || {})) {
  const meta = { registry: '3AS', id, type: r.type, subject: r.subjectName || r.subjectId, level: r.level };
  recordUrl(r.url, meta);
  if (r.problem && r.problem.url) recordUrl(r.problem.url, meta);
  if (r.solution && r.solution.url) recordUrl(r.solution.url, meta);
  if (r.source && r.source.url) recordUrl(r.source.url, meta);
}

// 4AM Registry
for (const [id, r] of Object.entries(sandbox.PlatformRegistry4AM || {})) {
  const meta = { registry: '4AM', id, type: r.type, subject: r.subjectName || r.subjectId, level: r.level };
  recordUrl(r.url, meta);
  recordUrl(r.sourceUrl, meta);
  if (r.problem && r.problem.url) recordUrl(r.problem.url, meta);
  if (r.solution && r.solution.url) recordUrl(r.solution.url, meta);
  if (r.source && r.source.url) recordUrl(r.source.url, meta);
}

console.log('Total unique external non-YouTube URLs:', urlUsage.size);

// Save list of URLs with usage details
const urlsList = [];
for (const [url, usages] of urlUsage.entries()) {
  urlsList.push({
    url,
    count: usages.length,
    types: [...new Set(usages.map(u => u.type))],
    subjects: [...new Set(usages.map(u => u.subject))],
    registries: [...new Set(usages.map(u => u.registry))]
  });
}

fs.writeFileSync('scratch/all_external_urls.json', JSON.stringify(urlsList, null, 2), 'utf8');
console.log('Saved scratch/all_external_urls.json');

// Analyze URL patterns
let sujetUrls = 0;
let categoryUrls = 0;
let bemUrls = 0;
let bacUrls = 0;
let searchUrls = 0;
let otherUrls = 0;

for (const item of urlsList) {
  const u = item.url;
  if (u.includes('?q=') || u.includes('/search')) searchUrls++;
  else if (u.includes('/sujets/')) sujetUrls++;
  else if (u.includes('/bem/')) bemUrls++;
  else if (u.includes('/bac/')) bacUrls++;
  else if (u.match(/\/ar\/(4am|3as|1as|2as)\/[^/]+\/[^/]+/)) categoryUrls++;
  else otherUrls++;
}

console.log('--- URL Pattern Analysis:');
console.log(`  Direct Sujet URLs (/sujets/...): ${sujetUrls}`);
console.log(`  BEM Portal URLs (/bem/...): ${bemUrls}`);
console.log(`  BAC Portal URLs (/bac/...): ${bacUrls}`);
console.log(`  Specific Category/Course URLs: ${categoryUrls}`);
console.log(`  Search URLs: ${searchUrls}`);
console.log(`  Other URLs: ${otherUrls}`);
