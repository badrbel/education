const fs = require('fs');
global.window = {};
require('../data/four_am.js');
const fourAmData = global.window.PlatformData4AM;

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  if (typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const idOccurrences = new Map();

for (const [sKey, sData] of Object.entries(fourAmData)) {
  for (const [lName, channels] of Object.entries(sData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        const id = extractVideoId(vid.videoId) || extractVideoId(vid.id) || extractVideoId(vid.url);
        if (!idOccurrences.has(id)) idOccurrences.set(id, []);
        idOccurrences.get(id).push({
          type: 'channelsData',
          subject: sData.name,
          lesson: lName,
          channel: ch.channel,
          title: vid.title
        });
      }
    }
  }
  for (const [lName, exs] of Object.entries(sData.exercisesData || {})) {
    for (const ex of exs) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        const id = extractVideoId(ex.videoId) || extractVideoId(ex.id) || extractVideoId(ex.url);
        if (!idOccurrences.has(id)) idOccurrences.set(id, []);
        idOccurrences.get(id).push({
          type: 'exercisesData',
          subject: sData.name,
          lesson: lName,
          title: ex.title
        });
      }
    }
  }
}

const duplicates = [];
for (const [id, list] of idOccurrences) {
  if (list.length > 1) {
    duplicates.push({ id, count: list.length, list });
  }
}

console.log(`Found ${duplicates.length} duplicated Video IDs in four_am.js (total duplicated entries: ${duplicates.reduce((sum, d) => sum + d.count - 1, 0)}):`);
duplicates.forEach((d, i) => {
  console.log(`\n[${i+1}] Video ID: ${d.id} (appears ${d.count} times)`);
  d.list.forEach(item => {
    console.log(`    - [${item.type}] [${item.subject}] [${item.lesson}] ${item.title}`);
  });
});
