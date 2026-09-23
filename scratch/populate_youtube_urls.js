const fs = require('fs');
const path = require('path');

const fourAmJsPath = path.join(__dirname, '../data/four_am.js');
global.window = {};
require(fourAmJsPath);
const fourAmData = global.window.PlatformData4AM;

let fixedCount = 0;
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  for (const [lessonName, channels] of Object.entries(subjData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        const vidId = vid.videoId || vid.id;
        if (vidId) {
          vid.youtubeId = vidId;
          vid.url = `https://www.youtube.com/watch?v=${vidId}`;
          fixedCount++;
        }
      }
    }
  }
}

console.log(`Populated youtubeId and url for ${fixedCount} videos in channelsData.`);

// Write back to data/four_am.js
fs.writeFileSync(fourAmJsPath, '/** mordix_ai — 4AM Curriculum */\nwindow.PlatformData4AM = ' + JSON.stringify(fourAmData, null, 2) + ';\n', 'utf8');
console.log('Successfully written to data/four_am.js');
