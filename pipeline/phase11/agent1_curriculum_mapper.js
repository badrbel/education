/**
 * mordix_ai — PHASE 11: Agent 1 (Curriculum Mapper)
 * 
 * Maps all 145 lessons across the 9 official 4AM subjects.
 * Audits current resource distribution in data/registry_4am.js.
 * Establishes the Baseline Gap Matrix structure.
 * Zero emojis, 4AM only.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

function runCurriculumMapper() {
  console.log('==================================================');
  console.log('[AGENT 1] 4AM Curriculum & Gap Baseline Mapper');
  console.log('==================================================');

  // Load four_am.js
  const fourAmPath = path.join(baseDir, 'data/four_am.js');
  global.window = {};
  eval(fs.readFileSync(fourAmPath, 'utf8'));
  const fourAmData = global.window.PlatformData4AM;

  if (!fourAmData) {
    throw new Error('PlatformData4AM not found in data/four_am.js');
  }

  // Load registry_4am.js
  const registryPath = path.join(baseDir, 'data/registry_4am.js');
  global.window = {};
  eval(fs.readFileSync(registryPath, 'utf8'));
  const registry = global.window.PlatformRegistry4AM || {};

  const subjects = [
    { id: 'math_4am', slug: 'mathematiques', name: 'الرياضيات' },
    { id: 'arabic_4am', slug: 'arabe', name: 'اللغة العربية' },
    { id: 'physics_4am', slug: 'physique', name: 'العلوم الفيزيائية والتكنولوجيا' },
    { id: 'science_4am', slug: 'sciences-naturelles', name: 'علوم الطبيعة والحياة' },
    { id: 'french_4am', slug: 'francais', name: 'اللغة الفرنسية' },
    { id: 'english_4am', slug: 'anglais', name: 'اللغة الإنجليزية' },
    { id: 'history_geography_4am', slug: 'histoire-geographie', name: 'التاريخ والجغرافيا' },
    { id: 'islamic_4am', slug: 'tarbia-islamia', name: 'التربية الإسلامية' },
    { id: 'civics_4am', slug: 'tarbia-madania', name: 'التربية المدنية' }
  ];

  const registryItems = Object.values(registry);
  console.log(`Loaded Registry with ${registryItems.length} total resources.`);

  let totalLessons = 0;
  const curriculumMap = {};

  for (const subj of subjects) {
    const subjData = fourAmData[subj.id];
    if (!subjData) {
      console.warn(`Subject not found in data: ${subj.id}`);
      continue;
    }

    const lessons = subjData.lessons || [];
    totalLessons += lessons.length;

    curriculumMap[subj.id] = {
      subjectId: subj.id,
      slug: subj.slug,
      name: subj.name,
      lessonCount: lessons.length,
      lessons: lessons.map(l => {
        const canonicalId = l.canonical_id || l.lessonId || l.id;
        // Find existing resources mapped to this lesson
        const matched = registryItems.filter(r => r.subjectId === subj.id && (r.lessonId === canonicalId || r.lessonId === l.id));
        const videos = matched.filter(r => r.type === 'video');
        const exercises = matched.filter(r => r.type === 'exercise');
        const others = matched.filter(r => r.type !== 'video' && r.type !== 'exercise');

        return {
          id: canonicalId,
          numericId: l.id,
          title: l.title,
          unit: l.unit || null,
          currentResourceCount: matched.length,
          videoCount: videos.length,
          exerciseCount: exercises.length,
          otherCount: others.length,
          hasVideo: videos.length > 0,
          hasExercise: exercises.length > 0
        };
      })
    };
  }

  // Count subject-level resources (lessonId: null)
  const subjectLevelResources = {};
  for (const subj of subjects) {
    const unlinked = registryItems.filter(r => r.subjectId === subj.id && !r.lessonId);
    subjectLevelResources[subj.id] = unlinked.length;
  }

  const outDir = path.join(baseDir, 'data/pipeline/phase11');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalSubjects: subjects.length,
    totalLessons: totalLessons,
    totalRegistryResources: registryItems.length,
    curriculum: curriculumMap,
    subjectLevelCounts: subjectLevelResources
  };

  const outFile = path.join(outDir, 'curriculum_baseline.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');

  console.log(`[AGENT 1 DONE] Mapped ${totalLessons} lessons across ${subjects.length} subjects.`);
  console.log(`Baseline saved to: ${outFile}\n`);

  // Quick summary print
  for (const s of Object.values(curriculumMap)) {
    const withEx = s.lessons.filter(l => l.hasExercise).length;
    const withVid = s.lessons.filter(l => l.hasVideo).length;
    console.log(`  Subject [${s.name}]: ${s.lessonCount} lessons | ${withVid} with videos | ${withEx} with exercises`);
  }

  return report;
}

if (require.main === module) {
  runCurriculumMapper();
}

module.exports = { runCurriculumMapper };
