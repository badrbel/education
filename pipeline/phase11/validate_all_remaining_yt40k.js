const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const reg = global.window.PlatformRegistry4AM;

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
const fourAm = global.window.PlatformData4AM;

const canonicalLessonsBySubj = {};
for (const [subjKey, subj] of Object.entries(fourAm)) {
  canonicalLessonsBySubj[subjKey] = new Set((subj.lessons || []).map(l => typeof l === 'string' ? l : l.title));
}

const excludedIds = new Set(['yt-40k-BwHUObvb_Wo', 'yt-40k-olMC10IRmz8', 'yt-40k-EUsMS6lmy8U']);
const multiLessonIds = new Set([
  'yt-40k-UQXvC0Ggl1w',
  'yt-40k-Yeo1wYrx138',
  'yt-40k-zW7Fz_9orRo',
  'yt-40k-JbYXX3PB2-M',
  'yt-40k-ZRIJ9k1ozhM',
  'yt-40k-uOX5YRSKYQE',
  'yt-40k-WdELWUo35yA',
  'yt-40k-gNyS6ZxMs7I',
  'yt-40k-6YDUnQm3am8'
]);

const yt40k = Object.values(reg).filter(r => r.id.startsWith('yt-40k-'));
console.log(`Checking ${yt40k.length} yt-40k items...`);

let validLessonMapped = 0;
let validMultiLesson = 0;
let errors = [];

for (const v of yt40k) {
  if (excludedIds.has(v.id)) continue;

  if (!v.videoId || v.videoId.length !== 11) {
    errors.push(`Invalid videoId: ${v.id}`);
  }
  if (!v.viewCount || v.viewCount <= 40000) {
    errors.push(`Invalid views: ${v.id} (views: ${v.viewCount})`);
  }
  if (!fourAm[v.subjectId]) {
    errors.push(`Invalid subjectId: ${v.id} (${v.subjectId})`);
  }

  if (multiLessonIds.has(v.id)) {
    validMultiLesson++;
    continue;
  }

  const validLessons = canonicalLessonsBySubj[v.subjectId];
  if (!validLessons || !validLessons.has(v.lessonTitle)) {
    errors.push(`Lesson title not found in canonical lessons: [${v.subjectId}] "${v.lessonTitle}" (id: ${v.id})`);
  } else {
    validLessonMapped++;
  }
}

console.log('Valid lesson-mapped videos:', validLessonMapped);
console.log('Valid multi-lesson general videos:', validMultiLesson);
console.log('Excluded foreign videos:', excludedIds.size);
console.log('Errors found:', errors.length);
if (errors.length > 0) {
  console.log('Errors:', errors);
}
