const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '..');

const THREE_AS_FILES = [
  'data/registry.js',
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];

const FOUR_AM_FILES = [
  'data/registry_4am.js',
  'data/four_am.js'
];

function sha256(filePath) {
  const content = fs.readFileSync(path.join(baseDir, filePath));
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('=== SHA-256 BASELINES ===');
const baselines = { threeAs: {}, fourAm: {} };
for (const f of THREE_AS_FILES) {
  baselines.threeAs[f] = sha256(f);
  console.log(`[3AS]  ${f}: ${baselines.threeAs[f]}`);
}
for (const f of FOUR_AM_FILES) {
  baselines.fourAm[f] = sha256(f);
  console.log(`[4AM]  ${f}: ${baselines.fourAm[f]}`);
}

// Load 3AS Data
global.window = { PlatformData: {} };
for (const f of THREE_AS_FILES.filter(f => f !== 'data/registry.js')) {
  eval(fs.readFileSync(path.join(baseDir, f), 'utf8'));
}
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const platformData = global.window.PlatformData;
const registry = global.window.PlatformRegistry;

console.log('\n=== SUBJECT AUDIT ===');
const subjectAudit = {};
let totalLessons = 0;
let totalVideos = 0;

for (const [sName, sObj] of Object.entries(platformData)) {
  const lessons = sObj.lessons || [];
  totalLessons += lessons.length;
  let sVids = 0;
  for (const chList of Object.values(sObj.channelsData || {})) {
    for (const ch of chList) {
      sVids += (ch.videos || []).length;
    }
  }
  totalVideos += sVids;

  subjectAudit[sName] = {
    id: sObj.id,
    branch: sObj.branch,
    coefficient: sObj.coefficient,
    lessonCount: lessons.length,
    videoCount: sVids,
    summariesInSubject: (sObj.summaries || []).length,
    reviewsInSubject: (sObj.reviews || []).length,
    bacInSubject: (sObj.baccalaureate || []).length,
    examsInSubject: (sObj.exams || []).length,
    exercisesInSubject: Object.keys(sObj.exercisesData || {}).length
  };
}

console.log(JSON.stringify(subjectAudit, null, 2));
console.log(`Total 3AS Subjects: ${Object.keys(platformData).length}`);
console.log(`Total 3AS Lessons: ${totalLessons}`);
console.log(`Total 3AS Videos: ${totalVideos}`);

console.log('\n=== REGISTRY AUDIT ===');
const totalReg = Object.keys(registry).length;
const byType = {};
const bySubject = {};
const byLessonMapping = { withLessonId: 0, withoutLessonId: 0 };

for (const r of Object.values(registry)) {
  byType[r.type] = (byType[r.type] || 0) + 1;
  const s = r.subjectId || r.subject || r.subjectName || 'unknown';
  bySubject[s] = (bySubject[s] || 0) + 1;
  if (r.lessonId) byLessonMapping.withLessonId++;
  else byLessonMapping.withoutLessonId++;
}

console.log(`Total 3AS Registry Resources: ${totalReg}`);
console.log('By Type:', JSON.stringify(byType, null, 2));
console.log('By Subject:', JSON.stringify(bySubject, null, 2));
console.log('Lesson Mappings:', JSON.stringify(byLessonMapping, null, 2));

const out = {
  baselines,
  subjectAudit,
  totalLessons,
  totalVideos,
  registry: {
    total: totalReg,
    byType,
    bySubject,
    byLessonMapping
  }
};

fs.writeFileSync(path.join(baseDir, 'pipeline/3as_audit_baseline.json'), JSON.stringify(out, null, 2), 'utf8');
