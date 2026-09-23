global.window = {};
require('../data/four_am.js');
const fourAmData = global.window.PlatformData4AM;

let missingCount = 0;
let totalCount = 0;

for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  for (const [lessonName, channels] of Object.entries(subjData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        totalCount++;
        if (!vid.url && !vid.youtubeId) {
          missingCount++;
        }
      }
    }
  }
}

console.log(`Total videos in channelsData: ${totalCount}`);
console.log(`Missing url AND youtubeId: ${missingCount}`);
