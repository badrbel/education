const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const cache = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/pipeline/cache/youtube_views_cache.json'), 'utf8'));
const candidates = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/pipeline/verified/phase11_agent11_deduped.json'), 'utf8'));

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const reg = global.window.PlatformRegistry4AM;

const existingVideoIds = new Set();
for (const r of Object.values(reg)) {
  if (r.videoId) existingVideoIds.add(r.videoId);
}

const qualified40k = [];
for (const c of candidates) {
  if (c.videoId && cache[c.videoId] && cache[c.videoId] > 40000 && c.matchStatus === 'MATCH_CONFIRMED' && c.lessonId) {
    qualified40k.push({
      ...c,
      viewCount: cache[c.videoId],
      inRegistry: existingVideoIds.has(c.videoId)
    });
  }
}

console.log('Total qualified candidates with >40k views:', qualified40k.length);
const inReg = qualified40k.filter(c => c.inRegistry);
const notInReg = qualified40k.filter(c => !c.inRegistry);
console.log('In registry:', inReg.length);
console.log('Not in registry (held back due to lesson cap):', notInReg.length);

console.log('\nSample held-back candidates:');
for (const c of notInReg.slice(0, 10)) {
  console.log(`- [${c.subjectName} -> ${c.lessonTitle}] ${c.title} | ${c.channelName} | views: ${c.viewCount}`);
}
