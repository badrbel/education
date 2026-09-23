const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

// Load registry
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const registry = global.window.PlatformRegistry4AM || {};
const existingVideoIds = new Set();
for (const r of Object.values(registry)) {
  if (r.videoId) existingVideoIds.add(r.videoId);
}

// Load deduped candidates
const candPath = path.join(baseDir, 'data/pipeline/verified/phase11_agent11_deduped.json');
const candidates = JSON.parse(fs.readFileSync(candPath, 'utf8'));

// Filter for videos with lessonId that are NOT in registry
const lessonVideosNotImported = candidates.filter(c => {
  if (!c.videoId) return false;
  if (existingVideoIds.has(c.videoId)) return false;
  if (!c.lessonId) return false;
  if (c.matchStatus !== 'MATCH_CONFIRMED' && c.matchStatus !== 'MATCH_PROBABLE') return false;
  return true;
});

console.log(`Total lesson-matched videos not yet imported: ${lessonVideosNotImported.length}`);

// Breakdown by subject
const bySubj = {};
for (const v of lessonVideosNotImported) {
  bySubj[v.subjectId] = (bySubj[v.subjectId] || 0) + 1;
}
console.log('Breakdown by subject:', bySubj);
