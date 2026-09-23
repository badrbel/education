const fs = require('fs');
global.window = {};

require('../data/registry.js');
require('../data/arabic.js');
require('../data/math.js');
require('../data/history.js');
require('../data/islamic.js');
require('../data/french.js');
require('../data/english.js');

require('../data/four_am.js');
require('../data/registry_4am.js');

const targetId = 'sw3G8qr84b4';

console.log('=== INVESTIGATING VIDEO ID: sw3G8qr84b4 ===');

// Check in 3AS
const reg3as = global.window.PlatformRegistry || {};
for (const [k, r] of Object.entries(reg3as)) {
  if (JSON.stringify(r).includes(targetId)) {
    console.log(`[3AS Registry] key: ${k}`);
    console.log(`  Title: ${r.title}`);
    console.log(`  Subject: ${r.subjectName} | Lesson: ${r.lessonTitle}`);
    console.log(`  URL: ${r.url || r.sourceUrl}`);
  }
}
const data3as = global.window.PlatformData || {};
for (const [sKey, sData] of Object.entries(data3as)) {
  if (sData.channelsData) {
    for (const [lName, channels] of Object.entries(sData.channelsData)) {
      for (const ch of channels) {
        for (const vid of ch.videos || []) {
          if (JSON.stringify(vid).includes(targetId)) {
            console.log(`[3AS channelsData] Subject: ${sKey} | Lesson: ${lName}`);
            console.log(`  Title: ${vid.title}`);
            console.log(`  Teacher: ${vid.teacher}`);
          }
        }
      }
    }
  }
}

// Check in 4AM
const reg4am = global.window.PlatformRegistry4AM || {};
for (const [k, r] of Object.entries(reg4am)) {
  if (JSON.stringify(r).includes(targetId)) {
    console.log(`[4AM Registry] key: ${k}`);
    console.log(`  Title: ${r.title}`);
    console.log(`  Subject: ${r.subjectName} | Lesson: ${r.lessonTitle}`);
    console.log(`  URL: ${r.url || r.sourceUrl}`);
  }
}
const data4am = global.window.PlatformData4AM || {};
for (const [sKey, sData] of Object.entries(data4am)) {
  if (sData.channelsData) {
    for (const [lName, channels] of Object.entries(sData.channelsData)) {
      for (const ch of channels) {
        for (const vid of ch.videos || []) {
          if (JSON.stringify(vid).includes(targetId)) {
            console.log(`[4AM channelsData] Subject: ${sData.name} | Lesson: ${lName}`);
            console.log(`  Title: ${vid.title}`);
            console.log(`  Teacher: ${vid.teacher}`);
          }
        }
      }
    }
  }
  if (sData.exercisesData) {
    for (const [lName, exs] of Object.entries(sData.exercisesData)) {
      for (const ex of exs) {
        if (JSON.stringify(ex).includes(targetId)) {
          console.log(`[4AM exercisesData] Subject: ${sData.name} | Lesson: ${lName}`);
          console.log(`  Title: ${ex.title}`);
        }
      }
    }
  }
}
