const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
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

console.log('=== BUILDING 3AS AF GAP MATRIX WITH QUALITATIVE CRITERIA ===');

const gapMatrix = [];
const statusCounts = {
  FULL: 0,
  PARTIAL: 0,
  GENERAL_ONLY: 0,
  NO_VERIFIED_RESOURCE_FOUND: 0,
  NEEDS_MANUAL_REVIEW: 0
};

const subjectCoverage = {};

for (const [sName, sObj] of Object.entries(platformData)) {
  subjectCoverage[sName] = {
    totalLessons: (sObj.lessons || []).length,
    FULL: 0,
    PARTIAL: 0,
    GENERAL_ONLY: 0,
    NO_VERIFIED_RESOURCE_FOUND: 0,
    NEEDS_MANUAL_REVIEW: 0
  };

  const generalSummaries = (sObj.summaries || []).length;
  const generalReviews = (sObj.reviews || []).length;
  const generalBac = (sObj.baccalaureate || []).length;
  const generalExams = (sObj.exams || []).length;
  const totalGeneralResources = generalSummaries + generalReviews + generalBac + generalExams;

  for (const l of sObj.lessons || []) {
    const lTitle = l.title;
    const lId = l.lessonId || `${sObj.id}-${l.id}`;

    // 1. Direct videos
    const channels = (sObj.channelsData && sObj.channelsData[lTitle]) || [];
    let directVideo = 0;
    for (const c of channels) {
      directVideo += (c.videos || []).length;
    }
    const lessonExplanation = directVideo > 0;

    // 2. Direct exercises from exercisesData
    const exDataList = (sObj.exercisesData && sObj.exercisesData[lTitle]) || [];
    let exercise = exDataList.length;

    // 3. Direct resources from registry
    const regLinked = Object.values(registry).filter(r => r.lessonId === lId || r.lessonTitle === lTitle);
    let summary = 0;
    let revision = 0;
    let exam = 0;

    for (const r of regLinked) {
      if (r.type === 'summary') summary++;
      else if (r.type === 'revision') revision++;
      else if (r.type === 'exercise') exercise++;
      else if (r.type === 'exam' || r.type === 'bac') exam++;
    }

    // Determine rigorous coverage status
    let status = 'NO_VERIFIED_RESOURCE_FOUND';
    let coverageReason = '';

    const hasVideo = directVideo > 0;
    const hasSummary = summary > 0;
    const hasExercise = exercise > 0;
    const hasRevision = revision > 0;

    if (hasVideo && hasSummary && (hasExercise || hasRevision)) {
      status = 'FULL';
      coverageReason = `مكتمل بيداغوجياً: يمتلك ${directVideo} فيديوهات، ${summary} ملخصات، و ${exercise} تمارين/مراجعات مباشرة.`;
    } else if (hasVideo || hasSummary || hasExercise || hasRevision) {
      status = 'PARTIAL';
      const missingParts = [];
      if (!hasVideo) missingParts.push('شرح فيديو');
      if (!hasSummary) missingParts.push('ملخص مباشر');
      if (!hasExercise) missingParts.push('تمارين وتطبيقات');
      coverageReason = `تغطية جزئية: يمتلك (${directVideo} فيديو، ${summary} ملخص، ${exercise} تمارين) وينقصه: ${missingParts.join('، ')}.`;
    } else if (totalGeneralResources > 0) {
      status = 'GENERAL_ONLY';
      coverageReason = `لا يمتلك موارد مخصصة بالاسم، لكن يستفيد من ${totalGeneralResources} موارد عامة للمادة.`;
    } else {
      status = 'NO_VERIFIED_RESOURCE_FOUND';
      coverageReason = 'خالٍ تماماً: لا يمتلك أي شروحات أو ملخصات أو تمارين مؤكدة حتى الآن.';
    }

    statusCounts[status]++;
    subjectCoverage[sName][status]++;

    gapMatrix.push({
      subjectId: sObj.id,
      subjectName: sName,
      lessonId: lId,
      lessonTitle: lTitle,
      directVideo,
      lessonExplanation,
      summary,
      revision,
      exercise,
      exam,
      generalResources: totalGeneralResources,
      status,
      coverageReason
    });
  }
}

console.log('Status Counts:');
console.log(JSON.stringify(statusCounts, null, 2));

console.log('\nSubject Coverage Breakdown:');
console.log(JSON.stringify(subjectCoverage, null, 2));

const outData = {
  timestamp: new Date().toISOString(),
  phase: 'PHASE AF-ENRICHMENT',
  statusCounts,
  subjectCoverage,
  gapMatrix
};

const outPath = path.join(baseDir, 'data/pipeline/af_enrichment/gap_matrix_baseline.json');
fs.writeFileSync(outPath, JSON.stringify(outData, null, 2), 'utf8');
console.log(`\nGap Matrix baseline written to: ${outPath}`);
