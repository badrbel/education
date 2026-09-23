const fs = require('fs');
global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const sixIds = ['0B00Ft4NWyc', 'HnUhBeKnLUs', 'QRiyqep8d3Y', 'R-UF4UIDUVA', 'nQPqhCTp084', 'rjSUGKr4J6s'];

console.log('=== INVESTIGATION OF THE 6 CANDIDATES ===');
for (const id of sixIds) {
  console.log(`\n>>> VIDEO ID: ${id}`);
  // Find in registry_4am.js
  for (const [k, r] of Object.entries(registry4am)) {
    if (r.id.includes(id) || (r.url && r.url.includes(id)) || (r.videoId && r.videoId === id)) {
      console.log(`  [registry_4am.js] key: ${k}`);
      console.log(`    Title: ${r.title}`);
      console.log(`    Subject: ${r.subjectName} (${r.subjectId}) | Lesson: ${r.lessonTitle} (${r.lessonId})`);
      console.log(`    Type: ${r.type} | URL: ${r.url || r.sourceUrl}`);
      console.log(`    Teacher/Source: ${(r.source && r.source.name) || r.teacher}`);
    }
  }

  // Find in four_am.js
  for (const [sKey, sData] of Object.entries(fourAmData)) {
    for (const [lName, channels] of Object.entries(sData.channelsData || {})) {
      for (const ch of channels) {
        for (const v of ch.videos || []) {
          if (v.id === id || v.videoId === id) {
            console.log(`  [four_am.js channelsData] subject: ${sData.name} | lesson: ${lName}`);
            console.log(`    Title: ${v.title} | Channel: ${ch.channel} | Teacher: ${v.teacher}`);
          }
        }
      }
    }
    for (const [lName, exs] of Object.entries(sData.exercisesData || {})) {
      for (const ex of exs) {
        if (ex.id === id || ex.videoId === id || (ex.url && ex.url.includes(id))) {
          console.log(`  [four_am.js exercisesData] subject: ${sData.name} | lesson: ${lName}`);
          console.log(`    Title: ${ex.title}`);
        }
      }
    }
  }
}
