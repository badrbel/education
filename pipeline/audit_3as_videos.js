const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
global.window = { PlatformData: {} };

const files = [
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];

for (const f of files) {
  eval(fs.readFileSync(path.join(baseDir, f), 'utf8'));
}

const stats = {
  totalVideos: 0,
  valid11Char: 0,
  hasYoutubeId: 0,
  hasUrl: 0,
  searchUrlsInUrl: 0,
  searchUrlsInChannelUrl: 0,
  missingOrInvalidId: []
};

for (const [sName, sObj] of Object.entries(global.window.PlatformData)) {
  for (const [lTitle, chs] of Object.entries(sObj.channelsData || {})) {
    for (const c of chs) {
      if (c.channelUrl && c.channelUrl.includes('search_query=')) {
        stats.searchUrlsInChannelUrl++;
      }
      for (const v of c.videos || []) {
        stats.totalVideos++;
        const id = v.id || v.youtubeId || v.videoId;
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          stats.valid11Char++;
        } else {
          stats.missingOrInvalidId.push({ sName, lTitle, channel: c.channel || c.name, video: v });
        }
        if (v.youtubeId) stats.hasYoutubeId++;
        if (v.url) {
          stats.hasUrl++;
          if (v.url.includes('search_query=')) stats.searchUrlsInUrl++;
        }
      }
    }
  }
}

console.log('3AS Videos Audit:');
console.log(JSON.stringify(stats, null, 2));

fs.writeFileSync(path.join(baseDir, 'pipeline/3as_video_audit.json'), JSON.stringify(stats, null, 2), 'utf8');
