const fs = require('fs');
global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const allTitles = [];
for (const [k, r] of Object.entries(registry4am)) {
  if (r.type === 'video' || r.type === 'youtube_video' || (r.url && r.url.includes('youtube'))) {
    allTitles.push({ source: 'registry_4am', key: k, title: r.title, lesson: r.lessonTitle, subject: r.subjectName, id: r.videoId || r.id });
  }
}
for (const [sKey, sData] of Object.entries(fourAmData)) {
  for (const [lName, channels] of Object.entries(sData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        allTitles.push({ source: 'four_am', key: vid.id, title: vid.title, lesson: lName, subject: sData.name, id: vid.id });
      }
    }
  }
}

const otherLevelRegex = /(?:(?:ال|لل)?سنة\s*)?(?:الأولى|الثانية|الثالثة)\s*(?:متوسط|ثانوي)|1\s*as|2\s*as|3\s*as|1\s*am|2\s*am|3\s*am|بكالوريا|باك\b/i;
const fourAmRegex = /(?:(?:ال|لل)?سنة\s*)?(?:الرابعة|4)\s*متوسط|4\s*am|bem|بيام|شهادة\s*التعليم\s*المتوسط/i;

const flagged = [];
const seenIds = new Set();
for (const item of allTitles) {
  const vidId = (item.id || '').replace(/^4am-(?:vid|comp)-/, '');
  if (seenIds.has(vidId)) continue;
  seenIds.add(vidId);

  const hasOther = otherLevelRegex.test(item.title);
  const has4am = fourAmRegex.test(item.title);
  if (hasOther) {
    flagged.push({
      ...item,
      vidId,
      hasOther,
      has4am
    });
  }
}

console.log('Flagged other-level titles (unique videos):', flagged.length);
flagged.forEach((f, i) => {
  console.log(`[${i+1}] ID: ${f.vidId} | 4AM Tagged: ${f.has4am}`);
  console.log(`    Title: ${f.title}`);
  console.log(`    Subject: ${f.subject} | Lesson: ${f.lesson}\n`);
});
