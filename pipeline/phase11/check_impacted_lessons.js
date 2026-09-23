const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
const fourAm = global.window.PlatformData4AM;

function checkLesson(subjKey, lessonTitle) {
  const subj = fourAm[subjKey];
  const chData = (subj.channelsData && subj.channelsData[lessonTitle]) || [];
  let count = 0;
  for (const ch of chData) {
    count += (ch.videos || []).length;
  }
  console.log(`[${subjKey}] ${lessonTitle}: ${count} videos`);
  for (const ch of chData) {
    for (const v of ch.videos) {
      console.log(`   - ${v.id}: ${v.title} (${ch.channel})`);
    }
  }
}

console.log('Checking impacted lessons:');
checkLesson('arabic_4am', 'التوكيد اللفظي والمعنوي');
checkLesson('arabic_4am', 'التمييز');
checkLesson('english_4am', 'Discourses markers / Chronology');
checkLesson('islamic_4am', 'حسن الجوار');
checkLesson('civics_4am', 'حقوق لإنسان (الميثاق العالمي)');
checkLesson('civics_4am', 'القانون ومرتبته بين النصوص');
