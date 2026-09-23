const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const reg = global.window.PlatformRegistry4AM || {};

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
const fourAm = global.window.PlatformData4AM || {};

const cache = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/pipeline/cache/youtube_views_cache.json'), 'utf8'));

console.log('=== REGISTRY 4AM STATS ===');
console.log('Total entries:', Object.keys(reg).length);

const types = {};
let yt40k = 0;
let withVideoId = 0;
let searchUrls = 0;
for (const r of Object.values(reg)) {
  types[r.type] = (types[r.type] || 0) + 1;
  if (r.id.startsWith('yt-40k-')) yt40k++;
  if (r.videoId) withVideoId++;
  if (r.url && (r.url.includes('search_query=') || r.url.includes('google.com/search'))) searchUrls++;
}
console.log('Types:', types);
console.log('yt-40k items in registry:', yt40k);
console.log('Items with videoId:', withVideoId);
console.log('Search URLs found:', searchUrls);

console.log('\n=== FOUR_AM.JS STATS ===');
let totalVideos = 0;
let lessonsWithVideos = 0;
let totalLessons = 0;
for (const [subjKey, subj] of Object.entries(fourAm)) {
  const lessons = subj.lessons || [];
  totalLessons += lessons.length;
  for (const l of lessons) {
    const lTitle = typeof l === 'string' ? l : l.title;
    const chData = (subj.channelsData && subj.channelsData[lTitle]) || [];
    let countInLesson = 0;
    for (const ch of chData) {
      countInLesson += (ch.videos || []).length;
    }
    if (countInLesson > 0) lessonsWithVideos++;
    totalVideos += countInLesson;
  }
}
console.log('Total 4AM subjects:', Object.keys(fourAm).length);
console.log('Total canonical lessons:', totalLessons);
console.log('Lessons with videos:', lessonsWithVideos);
console.log('Total video instances in four_am.js:', totalVideos);

console.log('\n=== YOUTUBE VIEWS CACHE ===');
console.log('Total cached video IDs:', Object.keys(cache).length);
let above40k = 0;
let exactly40k = 0;
let below40k = 0;
let nulls = 0;
for (const [id, v] of Object.entries(cache)) {
  if (v === null) nulls++;
  else if (v > 40000) above40k++;
  else if (v === 40000) exactly40k++;
  else below40k++;
}
console.log('Views > 40,000:', above40k);
console.log('Views === 40,000:', exactly40k);
console.log('Views < 40,000:', below40k);
console.log('Null / failed:', nulls);
