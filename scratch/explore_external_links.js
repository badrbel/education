const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

// Mock browser globals for loading files
const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  localStorage: { getItem: () => null, setItem: () => null },
  console: console
};
sandbox.window = sandbox;
vm.createContext(sandbox);

function loadScript(filePath) {
  const code = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  vm.runInContext(code, sandbox, { filename: filePath });
}

// Load stores and registries
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

console.log('--- PlatformRegistry (3AS) count:', Object.keys(sandbox.PlatformRegistry || {}).length);
console.log('--- PlatformRegistry4AM (4AM) count:', Object.keys(sandbox.PlatformRegistry4AM || {}).length);
console.log('--- SUBJECTS_4AM count:', (sandbox.SUBJECTS_4AM || []).length);

// Extract all resources
const allResources = [];

if (sandbox.PlatformRegistry) {
  for (const [id, r] of Object.entries(sandbox.PlatformRegistry)) {
    allResources.push({ source: 'registry_3as', ...r });
  }
}

if (sandbox.PlatformRegistry4AM) {
  for (const [id, r] of Object.entries(sandbox.PlatformRegistry4AM)) {
    allResources.push({ source: 'registry_4am', ...r });
  }
}

// In four_am.js
if (sandbox.SUBJECTS_4AM) {
  for (const subj of sandbox.SUBJECTS_4AM) {
    if (subj.lessons) {
      for (const lesson of subj.lessons) {
        if (lesson.resources) {
          for (const r of lesson.resources) {
            allResources.push({ source: 'four_am_lessons', subjectId: subj.id, subjectName: subj.name, lessonId: lesson.id, ...r });
          }
        }
      }
    }
  }
}

// Also check BEM subjects / exams in four_am or index.html
console.log('\n--- Total resources collected:', allResources.length);

// Filter non-YouTube external links
const externalLinks = allResources.filter(r => {
  const url = r.url || '';
  if (!url) return false;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return false;
  return true;
});

console.log('--- Total non-YouTube external resources:', externalLinks.length);

const byDomain = {};
const byType = {};
for (const r of externalLinks) {
  const u = r.url || '';
  let dom = 'other';
  try {
    const parsed = new URL(u);
    dom = parsed.hostname;
  } catch (e) {
    dom = 'invalid_url';
  }
  byDomain[dom] = (byDomain[dom] || 0) + 1;
  byType[r.type || 'UNKNOWN_TYPE'] = (byType[r.type || 'UNKNOWN_TYPE'] || 0) + 1;
}

console.log('\n--- By Domain:');
console.log(byDomain);

console.log('\n--- By Type:');
console.log(byType);

// Inspect BEM resources specifically
const bemResources = allResources.filter(r => {
  const t = (r.type || '').toUpperCase();
  const id = (r.id || '').toUpperCase();
  return t.includes('BEM') || id.includes('BEM') || (r.url && r.url.includes('/bem'));
});

console.log('\n--- BEM related resources count:', bemResources.length);
const bemTypes = {};
bemResources.forEach(r => {
  bemTypes[r.type] = (bemTypes[r.type] || 0) + 1;
});
console.log('BEM types:', bemTypes);

// Check sample BEM resources
console.log('\nSample BEM resources (first 10):');
console.log(bemResources.slice(0, 10).map(r => ({
  id: r.id,
  type: r.type,
  year: r.year,
  subject: r.subjectId || r.subject,
  title: r.title,
  url: r.url
})));
