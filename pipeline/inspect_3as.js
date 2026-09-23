const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
global.window = { PlatformData: {} };

const files = [
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];

files.forEach(f => {
  const full = path.join(baseDir, f);
  if (fs.existsSync(full)) {
    try {
      eval(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      console.error('Error in ' + f, e.message);
    }
  }
});

eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const subjs = Object.keys(global.window.PlatformData || {});
console.log('3AS Subjects in PlatformData:', subjs);

const summary = {};
for (const s of subjs) {
  const d = global.window.PlatformData[s];
  const lessonCount = (d.lessons || []).length;
  const channelsLessons = Object.keys(d.channelsData || {}).length;
  let vidCount = 0;
  for (const chs of Object.values(d.channelsData || {})) {
    for (const c of chs) vidCount += (c.videos || []).length;
  }
  const summaries = (d.summaries || []).length;
  const reviews = (d.reviews || []).length;
  const bac = (d.baccalaureate || []).length;
  const exams = (d.exams || []).length;
  const exs = Object.keys(d.exercisesData || {}).length;
  summary[s] = { lessonCount, channelsLessons, vidCount, summaries, reviews, bac, exams, exs };
}
console.log('Subjects summary:\n', JSON.stringify(summary, null, 2));

const reg = global.window.PlatformRegistry || {};
const regKeys = Object.keys(reg);
console.log('Total 3AS resources in registry.js:', regKeys.length);
const types = {};
const subjRes = {};
for (const r of Object.values(reg)) {
  types[r.type] = (types[r.type] || 0) + 1;
  const s = r.subjectId || r.subject || r.subjectName || 'unknown';
  subjRes[s] = (subjRes[s] || 0) + 1;
}
console.log('3AS Registry resource types:\n', JSON.stringify(types, null, 2));
console.log('3AS Registry by subject:\n', JSON.stringify(subjRes, null, 2));
