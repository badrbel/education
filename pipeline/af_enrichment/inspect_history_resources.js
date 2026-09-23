const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const reg = global.window.PlatformRegistry;
const histRes = Object.values(reg).filter(r => r.subjectId === 'history');
console.log('History total resources in registry:', histRes.length);

const types = {};
histRes.forEach(r => { types[r.type] = (types[r.type] || 0) + 1; });
console.log('Types in history:', JSON.stringify(types, null, 2));

const summaries = histRes.filter(r => r.type === 'summary');
console.log('All 15 History Summaries:');
summaries.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.id}] ${r.title} -> lessonId: ${r.lessonId}`);
});

const reviews = histRes.filter(r => r.type === 'review');
console.log('\nAll History Reviews:');
reviews.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.id}] ${r.title} -> lessonId: ${r.lessonId}`);
});
