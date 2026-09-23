const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
const fourAm = global.window.PlatformData4AM;

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const registry = global.window.PlatformRegistry4AM;

function extractYouTubeId(url) {
  if (!url) return null;
  const cleanUrl = String(url).trim();
  if (cleanUrl.includes('search_query=') || cleanUrl.includes('results?')) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

console.log('==================================================');
console.log('FORENSIC SCAN: FOUR_AM.JS & REGISTRY_4AM.JS');
console.log('==================================================\n');

// 1. Scan four_am.js
const fourAmStats = {
  total: 0,
  directValid: 0,
  searchUrls: 0,
  missingId: 0,
  invalidId: 0,
  urlIdMismatch: 0,
  needsNormalization: 0
};

const fourAmIssues = [];

for (const [subjKey, subj] of Object.entries(fourAm)) {
  if (!subj.channelsData) continue;
  for (const [lessonTitle, channels] of Object.entries(subj.channelsData)) {
    for (const ch of channels) {
      for (const v of ch.videos || []) {
        fourAmStats.total++;
        const rawId = v.youtubeId || v.videoId || v.id;
        const extractedFromId = extractYouTubeId(rawId);
        const extractedFromUrl = extractYouTubeId(v.url);

        const hasSearchUrl = (v.url && v.url.includes('search_query=')) || (v.sourceUrl && v.sourceUrl.includes('search_query='));
        if (hasSearchUrl) {
          fourAmStats.searchUrls++;
          fourAmIssues.push({ loc: `four_am.js -> ${subjKey} -> ${lessonTitle}`, type: 'SEARCH_URL', item: v });
        }

        if (!rawId && !v.url) {
          fourAmStats.missingId++;
          fourAmIssues.push({ loc: `four_am.js -> ${subjKey} -> ${lessonTitle}`, type: 'MISSING_ID', item: v });
        } else if (!extractedFromId && !extractedFromUrl) {
          fourAmStats.invalidId++;
          fourAmIssues.push({ loc: `four_am.js -> ${subjKey} -> ${lessonTitle}`, type: 'INVALID_ID', item: v });
        } else if (extractedFromId && extractedFromUrl && extractedFromId !== extractedFromUrl) {
          fourAmStats.urlIdMismatch++;
          fourAmIssues.push({ loc: `four_am.js -> ${subjKey} -> ${lessonTitle}`, type: 'MISMATCH', item: v });
        } else {
          fourAmStats.directValid++;
          // check if fields need normalization (e.g. missing explicit youtubeId or url)
          if (!v.youtubeId || !v.url || !v.videoId) {
            fourAmStats.needsNormalization++;
          }
        }
      }
    }
  }
}

console.log('--- FOUR_AM.JS STATS ---');
console.log(JSON.stringify(fourAmStats, null, 2));

// 2. Scan registry_4am.js
const regStats = {
  totalVideos: 0,
  directValid: 0,
  searchUrls: 0,
  missingId: 0,
  invalidId: 0,
  urlIdMismatch: 0,
  needsNormalization: 0
};
const regIssues = [];

for (const r of Object.values(registry)) {
  if (r.type !== 'video') continue;
  regStats.totalVideos++;

  const rawId = r.youtubeId || r.videoId;
  const extractedFromId = extractYouTubeId(rawId);
  const extractedFromUrl = extractYouTubeId(r.url || r.sourceUrl);

  const hasSearchUrl = (r.url && r.url.includes('search_query=')) || (r.sourceUrl && r.sourceUrl.includes('search_query='));
  if (hasSearchUrl) {
    regStats.searchUrls++;
    regIssues.push({ id: r.id, type: 'SEARCH_URL', title: r.title, url: r.url });
  }

  if (!rawId && !r.url) {
    regStats.missingId++;
    regIssues.push({ id: r.id, type: 'MISSING_ID', title: r.title });
  } else if (!extractedFromId && !extractedFromUrl) {
    regStats.invalidId++;
    regIssues.push({ id: r.id, type: 'INVALID_ID', title: r.title, rawId, url: r.url });
  } else if (extractedFromId && extractedFromUrl && extractedFromId !== extractedFromUrl) {
    regStats.urlIdMismatch++;
    regIssues.push({ id: r.id, type: 'MISMATCH', title: r.title, rawId, url: r.url });
  } else {
    regStats.directValid++;
    if (!r.youtubeId || !r.videoId || !r.url) {
      regStats.needsNormalization++;
    }
  }
}

console.log('\n--- REGISTRY_4AM.JS STATS ---');
console.log(JSON.stringify(regStats, null, 2));

console.log('\nTotal issues in four_am.js:', fourAmIssues.length);
console.log('Total issues in registry_4am.js:', regIssues.length);
