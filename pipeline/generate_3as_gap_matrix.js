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

for (const f of files) {
  eval(fs.readFileSync(path.join(baseDir, f), 'utf8'));
}
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const platformData = global.window.PlatformData;
const registry = global.window.PlatformRegistry;

const gapMatrix = [];
const statusCounts = {
  FULL: 0,
  PARTIAL: 0,
  GENERAL_ONLY: 0,
  NO_VERIFIED_RESOURCE_FOUND: 0,
  NEEDS_MANUAL_REVIEW: 0
};

for (const [sName, sObj] of Object.entries(platformData)) {
  const lessons = sObj.lessons || [];
  for (const l of lessons) {
    const lTitle = l.title;
    const lId = l.lessonId || `${sObj.id}-${l.id}`;
    
    // Check videos in channelsData
    const channels = (sObj.channelsData && sObj.channelsData[lTitle]) || [];
    let vidCount = 0;
    for (const c of channels) {
      vidCount += (c.videos || []).length;
    }

    // Check exercises in exercisesData
    const exercises = (sObj.exercisesData && sObj.exercisesData[lTitle]) || [];
    const exCount = exercises.length;

    // Check registry resources linked to this lesson
    const regResources = Object.values(registry).filter(r => r.lessonId === lId || r.lessonTitle === lTitle);
    const regTypes = {};
    for (const r of regResources) {
      regTypes[r.type] = (regTypes[r.type] || 0) + 1;
    }

    // Determine status
    // FULL: Has videos AND (exercises OR summaries/documents directly linked)
    // PARTIAL: Has videos only OR exercises only
    // GENERAL_ONLY: No direct video/exercise, but subject has general resources
    // NO_VERIFIED_RESOURCE_FOUND: 0 resources
    let status = 'NO_VERIFIED_RESOURCE_FOUND';
    if (vidCount > 0 && (exCount > 0 || (regTypes.summary || 0) > 0 || (regTypes.exercise || 0) > 0)) {
      status = 'FULL';
    } else if (vidCount > 0 || exCount > 0 || regResources.length > 0) {
      status = 'PARTIAL';
    } else {
      status = 'NO_VERIFIED_RESOURCE_FOUND';
    }

    statusCounts[status]++;

    gapMatrix.push({
      subjectId: sObj.id,
      subjectName: sName,
      lessonId: lId,
      lessonTitle: lTitle,
      videos: vidCount,
      exercises: exCount,
      registryLinked: regResources.length,
      registryBreakdown: regTypes,
      status
    });
  }
}

console.log('Gap Matrix Status Counts:', JSON.stringify(statusCounts, null, 2));

fs.writeFileSync(path.join(baseDir, 'pipeline/3as_gap_matrix.json'), JSON.stringify({ statusCounts, gapMatrix }, null, 2), 'utf8');
