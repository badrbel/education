const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
const fourAm = global.window.PlatformData4AM;

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const registry = global.window.PlatformRegistry4AM;

console.log('=== INSPECTION OF FOUR_AM.JS VIDEOS ===');
let fourAmTotalVideos = 0;
let fourAmHasIdOnly = 0;
let fourAmHasYoutubeId = 0;
let fourAmHasUrl = 0;
let fourAmNoValidIdAtAll = 0;
const fourAmInvalidList = [];

for (const [subjKey, subj] of Object.entries(fourAm)) {
  if (!subj.channelsData) continue;
  for (const [lessonTitle, channels] of Object.entries(subj.channelsData)) {
    for (const ch of channels) {
      for (const v of ch.videos || []) {
        fourAmTotalVideos++;
        const id = v.id || v.videoId || v.youtubeId;
        const isValidId = id && /^[A-Za-z0-9_-]{11}$/.test(id);

        if (v.youtubeId) fourAmHasYoutubeId++;
        if (v.url) fourAmHasUrl++;
        if (!v.youtubeId && !v.url && v.id) fourAmHasIdOnly++;

        if (!isValidId && (!v.url || !v.url.includes('youtube.com/watch'))) {
          fourAmNoValidIdAtAll++;
          fourAmInvalidList.push({
            subject: subjKey,
            lesson: lessonTitle,
            channel: ch.channel,
            video: v
          });
        }
      }
    }
  }
}

console.log('Total videos in four_am.js:', fourAmTotalVideos);
console.log('Videos with explicit youtubeId:', fourAmHasYoutubeId);
console.log('Videos with explicit url:', fourAmHasUrl);
console.log('Videos with id only (NO youtubeId and NO url):', fourAmHasIdOnly);
console.log('Videos with NO valid 11-char ID anywhere:', fourAmNoValidIdAtAll);
if (fourAmInvalidList.length > 0) {
  console.log('Invalid list sample:', JSON.stringify(fourAmInvalidList.slice(0, 5), null, 2));
}

console.log('\n=== INSPECTION OF REGISTRY_4AM.JS VIDEO RESOURCES ===');
const videoResources = Object.values(registry).filter(r => r.type === 'video');
console.log('Total video resources in registry:', videoResources.length);

let regHasYoutubeId = 0;
let regHasVideoId = 0;
let regHasUrl = 0;
let regSearchUrls = 0;
let regInvalidIds = 0;
const regIssues = [];

for (const r of videoResources) {
  const yId = r.youtubeId || r.videoId;
  const url = r.url || r.sourceUrl || '';

  if (r.youtubeId) regHasYoutubeId++;
  if (r.videoId) regHasVideoId++;
  if (r.url) regHasUrl++;

  if (url.includes('search_query=') || url.includes('results?')) {
    regSearchUrls++;
    regIssues.push({ id: r.id, reason: 'SEARCH_URL', url });
  }

  const validId = yId && /^[A-Za-z0-9_-]{11}$/.test(yId);
  if (!validId) {
    regInvalidIds++;
    regIssues.push({ id: r.id, reason: 'INVALID_OR_MISSING_ID', yId, url });
  }
}

console.log('Registry videos with explicit youtubeId:', regHasYoutubeId);
console.log('Registry videos with explicit videoId:', regHasVideoId);
console.log('Registry videos with explicit url:', regHasUrl);
console.log('Registry videos with search_query URLs:', regSearchUrls);
console.log('Registry videos with invalid/missing 11-char ID:', regInvalidIds);
if (regIssues.length > 0) {
  console.log('Issues found:', JSON.stringify(regIssues, null, 2));
}
