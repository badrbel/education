global.window = {};
require('../data/four_am.js');
const fourAmData = global.window.PlatformData4AM;

let fourAmUnlinked = 0;
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  const lessonTitles = (subjData.lessons || []).map(l => l.title);
  for (const [lessonName, channels] of Object.entries(subjData.channelsData || {})) {
    if (!lessonTitles.includes(lessonName)) {
      console.log(`four_am.js channelsData lessonName not in lessons: [${subjData.name}] ${lessonName}`);
      fourAmUnlinked++;
    }
  }
  for (const [lessonName, exercises] of Object.entries(subjData.exercisesData || {})) {
    if (!lessonTitles.includes(lessonName)) {
      console.log(`four_am.js exercisesData lessonName not in lessons: [${subjData.name}] ${lessonName}`);
      fourAmUnlinked++;
    }
  }
}
console.log('Unlinked in four_am.js:', fourAmUnlinked);
