/**
 * mordix_ai — Philosophy Gap Matrix Generator
 * Generates data/pipeline/reports/PHASE_PHILOSOPHY_GAP_MATRIX.md
 * Zero Emojis Policy
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/philosophy.js'), 'utf8'));
const philoData = global.window.PlatformData['الفلسفة'];

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));
const registry = global.window.PlatformRegistry;

console.log('=== ANALYZING 3AS PHILOSOPHY LESSONS ===');

const lessons = philoData.lessons;
const channelsData = philoData.channelsData || {};

const matrix = [];

for (const l of lessons) {
  const lTitle = l.title;
  const lId = l.lessonId;
  const canonicalId = l.canonical_id;

  const chList = channelsData[lTitle] || [];
  let videoCount = 0;
  const teachers = new Set();
  const videoDetails = [];

  for (const ch of chList) {
    const chName = ch.channel || ch.name;
    if (chName) teachers.add(chName);
    for (const v of (ch.videos || [])) {
      videoCount++;
      videoDetails.push({
        id: v.id || v.videoId || v.youtubeId,
        title: v.title,
        channel: chName,
        duration: v.duration,
        verified: v.verified
      });
    }
  }

  // Registry resources for this lesson
  const regResources = Object.values(registry).filter(r =>
    r.subjectId === 'philosophy' && (r.lessonId === lId || r.lessonId === canonicalId || r.lessonId === `philosophy-${l.id}`)
  );

  const summaries = regResources.filter(r => r.type === 'summary');
  const reviews = regResources.filter(r => r.type === 'review');
  const exams = regResources.filter(r => r.type === 'exam' || r.type === 'bac');
  const exercises = regResources.filter(r => r.type === 'exercise');

  // Classification:
  // FULL: original video/lesson + summary/diagram + exercise or BAC with solution
  // PARTIAL: video + summary OR video + exercise OR multiple good videos
  // LOW_COVERAGE: 1 or 2 videos, or few resources needing enrichment
  // NO_VERIFIED_RESOURCE: 0 verified resources
  let status = 'PARTIAL';
  if (videoCount === 0 && regResources.length === 0) {
    status = 'NO_VERIFIED_RESOURCE';
  } else if (videoCount <= 2 && (summaries.length === 0 || exams.length === 0)) {
    status = 'LOW_COVERAGE';
  } else if (videoCount >= 3 && summaries.length > 0 && exams.length > 0) {
    status = 'FULL';
  } else {
    status = 'PARTIAL';
  }

  matrix.push({
    id: l.id,
    lessonId: lId,
    canonical_id: canonicalId,
    title: lTitle,
    problematic: l.problematic,
    declaredVideos: l.videos,
    actualChannelVideos: videoCount,
    teachersCount: teachers.size,
    teachersList: Array.from(teachers),
    registryTotal: regResources.length,
    summariesCount: summaries.length,
    reviewsCount: reviews.length,
    examsCount: exams.length,
    exercisesCount: exercises.length,
    status: status,
    videoDetails: videoDetails
  });
}

console.log('Philosophy lessons analysis:');
matrix.forEach(m => {
  console.log(`[${m.id}] ${m.title} -> Actual Videos: ${m.actualChannelVideos}, Registry: ${m.registryTotal}, Status: ${m.status}`);
});

// Write Markdown Report
const mdLines = [];
mdLines.push('# مصفوفة النقص والتقييم النوعي لمادة الفلسفة (3AS آداب وفلسفة)');
mdLines.push('');
mdLines.push(`تاريخ التقرير: ${new Date().toISOString()}`);
mdLines.push('المستوى: السنة الثالثة ثانوي (3AS)');
mdLines.push('الشعبة: آداب وفلسفة');
mdLines.push('المادة: الفلسفة (philosophy)');
mdLines.push('السياسة المعتمدة: صفر إيموجي (Zero Emojis 100%)');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 1. الملخص الإحصائي لمصفوفة النقص');
mdLines.push('');
const statusCounts = {
  FULL: matrix.filter(m => m.status === 'FULL').length,
  PARTIAL: matrix.filter(m => m.status === 'PARTIAL').length,
  LOW_COVERAGE: matrix.filter(m => m.status === 'LOW_COVERAGE').length,
  NO_VERIFIED_RESOURCE: matrix.filter(m => m.status === 'NO_VERIFIED_RESOURCE').length
};
mdLines.push(`- إجمالي الدروس الرسمية: ${matrix.length}`);
mdLines.push(`- الدروس مكتملة التغطية (FULL): ${statusCounts.FULL}`);
mdLines.push(`- الدروس ذات التغطية الجزئية (PARTIAL): ${statusCounts.PARTIAL}`);
mdLines.push(`- الدروس ذات التغطية المنخفضة (LOW_COVERAGE): ${statusCounts.LOW_COVERAGE}`);
mdLines.push(`- الدروس الخالية من الموارد الموثقة (NO_VERIFIED_RESOURCE): ${statusCounts.NO_VERIFIED_RESOURCE}`);
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 2. جدول مصفوفة النقص التفصيلي للدروس الـ 13');
mdLines.push('');
mdLines.push('| # | الدرس | الإشكالية | فيديوهات القنوات | موارد السجل | ملخصات | امتحانات/بكالوريا | الأساتذة والقنوات | حالة التغطية |');
mdLines.push('| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |');

for (const m of matrix) {
  const teachersStr = m.teachersList.slice(0, 3).join('، ') + (m.teachersList.length > 3 ? ` (+${m.teachersList.length - 3})` : '');
  mdLines.push(`| ${m.id} | ${m.title} | ${m.problematic} | ${m.actualChannelVideos} | ${m.registryTotal} | ${m.summariesCount} | ${m.examsCount} | ${teachersStr || 'لا يوجد'} | **${m.status}** |`);
}

mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 3. تحليل الدروس ذات التغطية المنخفضة المستهدفة بالبحث الموجه');
mdLines.push('');
const lowCoverageLessons = matrix.filter(m => m.status === 'LOW_COVERAGE' || m.actualChannelVideos <= 4);
mdLines.push('الدروس التالية تتطلب تعزيزا نوعيا وتغطية مباشرة لشروحات الدرس، مقالات البكالوريا، ومنهجية المقالة الفلسفية:');
mdLines.push('');
for (const l of lowCoverageLessons) {
  mdLines.push(`### [${l.id}] ${l.title}`);
  mdLines.push(`- الإشكالية: ${l.problematic}`);
  mdLines.push(`- عدد الفيديوهات الفعلي: ${l.actualChannelVideos}`);
  mdLines.push(`- عدد موارد السجل: ${l.registryTotal} (ملخصات: ${l.summariesCount}، امتحانات: ${l.examsCount})`);
  mdLines.push(`- القنوات الحالية: ${l.teachersList.join('، ') || 'لا توجد قنوات حالية'}`);
  mdLines.push('- النقص المشخص: الحاجة لشروحات مفصلة لمقالات المقارنة والجدل والاستقصاء بالوضع الخاصة بالموضوع، وحل نصوص فلسفية وبكالوريات سابقة.');
  mdLines.push('');
}

mdLines.push('---');
mdLines.push('');
mdLines.push('## 4. خطة البحث الموجه ومعايير التحقق الصارمة');
mdLines.push('');
mdLines.push('1. التحقق المزدوج من المستوى: استبعاد أي فيديو موجه للسنة الثانية ثانوي (2AS) مثل دروس المنطق الصوري أو الأخلاق العامة لغير 3AS.');
mdLines.push('2. التدقيق التخصصي للشعبة: التأكد من أن المقالة أو الشرح يخص شعبة آداب وفلسفة (حيث تختلف المقالات والتعمقات عن الشعب العلمية واللغات).');
mdLines.push('3. سلامة الروابط: اعتماد معرفات فيديو YouTube صحيحة 11 حرفا، وروابط مباشرة watch?v=، وصفر روابط بحث.');
mdLines.push('4. التنوع البيداغوجي: استهداف شروحات الدروس النظرية، مقالات الجدل والاستقصاء بالوضع، وتحليل النصوص الفلسفية.');

fs.writeFileSync(
  path.join(baseDir, 'data/pipeline/reports/PHASE_PHILOSOPHY_GAP_MATRIX.md'),
  mdLines.join('\n'),
  'utf8'
);

fs.writeFileSync(
  path.join(baseDir, 'data/pipeline/philosophy_research/gap_matrix.json'),
  JSON.stringify(matrix, null, 2),
  'utf8'
);

console.log('Saved Gap Matrix to: data/pipeline/reports/PHASE_PHILOSOPHY_GAP_MATRIX.md');
