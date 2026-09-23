/**
 * mordix_ai — Philosophy Pre-Ingestion Review Report Generator
 * Generates data/pipeline/reports/PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md
 * Zero Emojis Policy
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const rawPath = path.join(baseDir, 'data/pipeline/philosophy_research/raw/raw_philosophy_candidates.json');
const verifiedPath = path.join(baseDir, 'data/pipeline/philosophy_research/verified_philosophy_candidates.json');
const rejectedPath = path.join(baseDir, 'data/pipeline/philosophy_research/rejected_philosophy_candidates.json');
const gapMatrixPath = path.join(baseDir, 'data/pipeline/philosophy_research/gap_matrix.json');

function generateReport() {
  const rawList = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const verifiedList = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
  const rejectedList = JSON.parse(fs.readFileSync(rejectedPath, 'utf8'));
  const gapMatrix = JSON.parse(fs.readFileSync(gapMatrixPath, 'utf8'));

  const confirmedCount = verifiedList.filter(v => v.matchQuality === 'MATCH_CONFIRMED').length;
  const probableCount = verifiedList.filter(v => v.matchQuality === 'MATCH_PROBABLE').length;
  const generalCount = verifiedList.filter(v => v.matchQuality === 'GENERAL_PHILOSOPHY_REVIEW').length;
  const needsVerifCount = verifiedList.filter(v => v.verificationStatus === 'NEEDS_VERIFICATION').length;

  const md = [];
  md.push('# تقرير المراجعة الشاملة قبل الإدخال لمادة الفلسفة (PHASE PHILOSOPHY PRE-INGESTION REVIEW)');
  md.push('');
  md.push(`تاريخ التقرير: ${new Date().toISOString()}`);
  md.push('المستوى الدراسي: السنة الثالثة ثانوي (3AS)');
  md.push('الشعبة: آداب وفلسفة');
  md.push('المادة: الفلسفة (philosophy)');
  md.push('حالة المرحلة: RESEARCH_COMPLETED — AWAITING_USER_APPROVAL');
  md.push('الالتزام بالسياسات: صفر إيموجي (Zero Emojis 100%) | صفر بيانات وهمية (Zero Fake Data) | عزل تام لـ 4AM');
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 1. الملخص التنفيذي والإحصائي لعملية البحث والتحقيق');
  md.push('');
  md.push(`- إجمالي الموارد الخام المكتشفة من YouTube: ${rawList.length}`);
  md.push(`- إجمالي المرشحين المقبولين والمؤكدين (Verified Candidates): ${verifiedList.length}`);
  md.push(`  * مطابقة مؤكدة بأدلة قطعية (MATCH_CONFIRMED): ${confirmedCount}`);
  md.push(`  * مطابقة راجحة وقوية (MATCH_PROBABLE): ${probableCount}`);
  md.push(`  * مراجعات عامة ومنهجية مقالة البكالوريا (GENERAL_PHILOSOPHY_REVIEW): ${generalCount}`);
  md.push(`- إجمالي الموارد المحتاجة للتحقق (NEEDS_VERIFICATION): ${needsVerifCount}`);
  md.push(`- إجمالي الموارد المرفوضة والمستبعدة: ${rejectedList.length}`);
  md.push('');
  md.push('### تفصيل أسباب الاستبعاد والرفض الجنائي:');
  const rejectReasons = {};
  rejectedList.forEach(r => {
    const reason = r.rejectReason || 'OTHER';
    rejectReasons[reason] = (rejectReasons[reason] || 0) + 1;
  });
  for (const [reason, count] of Object.entries(rejectReasons)) {
    md.push(`- ${reason}: ${count} مورد`);
  }
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 2. مراجعة خاصة لتغطية الدروس الـ 13 وخصوصا الدروس ذات التغطية المنخفضة');
  md.push('');
  md.push('| # | الدرس | الفيديوهات الحالية | المرشحون الجدد | مؤكد (Confirmed) | راجح (Probable) | مرفوض في الدرس | التغطية المتوقعة | حالة التغطية السابقة | حالة التغطية المقترحة |');
  md.push('| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |');

  for (const m of gapMatrix) {
    const lessonVerified = verifiedList.filter(v => v.lessonId === m.lessonId);
    const conf = lessonVerified.filter(v => v.matchQuality === 'MATCH_CONFIRMED').length;
    const prob = lessonVerified.filter(v => v.matchQuality === 'MATCH_PROBABLE').length;
    const totalNew = lessonVerified.length;
    const expectedTotal = m.actualChannelVideos + totalNew;
    let proposedStatus = 'PARTIAL';
    if (expectedTotal >= 4) proposedStatus = 'FULL_COVERAGE';

    md.push(`| ${m.id} | ${m.title} | ${m.actualChannelVideos} | +${totalNew} | ${conf} | ${prob} | - | ${expectedTotal} فيديو | ${m.status} | **${proposedStatus}** |`);
  }

  md.push('');
  md.push('---');
  md.push('');
  md.push('## 3. قائمة المرشحين المعتمدين بالتفصيل لكل درس (مع الأدلة والروابط)');
  md.push('');

  for (const m of gapMatrix) {
    const lessonCandidates = verifiedList.filter(v => v.lessonId === m.lessonId);
    md.push(`### [${m.id}] ${m.title} (المرشحون الجدد: ${lessonCandidates.length})`);
    md.push(`- الإشكالية: ${m.problematic}`);
    md.push(`- الوضع الحالي في المنصة: ${m.actualChannelVideos} فيديو.`);
    md.push('');

    if (lessonCandidates.length === 0) {
      md.push('لا توجد موارد جديدة مقترحة لهذا الدرس.');
      md.push('');
      continue;
    }

    md.push('| المعرف | العنوان | القناة / الأستاذ | المدة | المشاهدات | نوع المورد | جودة المطابقة | الرابط المباشر |');
    md.push('| :--- | :--- | :--- | :-: | :-: | :-: | :-: | :--- |');
    for (const c of lessonCandidates) {
      md.push(`| \`${c.videoId}\` | ${c.title} | ${c.channel} | ${c.duration} | ${c.views} | ${c.resourceType} | ${c.matchQuality} | [مشاهدة](https://www.youtube.com/watch?v=${c.videoId}) |`);
    }
    md.push('');
  }

  // General reviews section
  const generalCandidates = verifiedList.filter(v => v.lessonId === null);
  md.push(`### مراجعات عامة ومنهجية المقالة الفلسفية (شعبة آداب وفلسفة) (${generalCandidates.length} مورد)`);
  md.push('');
  md.push('| المعرف | العنوان | القناة / الأستاذ | المدة | المشاهدات | نوع المورد | الرابط المباشر |');
  md.push('| :--- | :--- | :--- | :-: | :-: | :-: | :--- |');
  for (const c of generalCandidates) {
    md.push(`| \`${c.videoId}\` | ${c.title} | ${c.channel} | ${c.duration} | ${c.views} | ${c.resourceType} | [مشاهدة](https://www.youtube.com/watch?v=${c.videoId}) |`);
  }
  md.push('');

  md.push('---');
  md.push('');
  md.push('## 4. قائمة الموارد المرفوضة ونماذج من تسريبات الطور الثاني (2AS) والمناهج الأجنبية');
  md.push('');
  md.push('| المعرف | العنوان | القناة | سبب الرفض |');
  md.push('| :--- | :--- | :--- | :--- |');
  for (const r of rejectedList.slice(0, 30)) {
    md.push(`| \`${r.videoId}\` | ${r.title} | ${r.channel || r.channelName} | **${r.rejectReason}** |`);
  }
  if (rejectedList.length > 30) {
    md.push(`| ... | (+ ${rejectedList.length - 30} موارد أخرى مرفوضة موثقة في ملف JSON) | ... | ... |`);
  }
  md.push('');

  fs.writeFileSync(
    path.join(baseDir, 'data/pipeline/reports/PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md'),
    md.join('\n'),
    'utf8'
  );
  console.log('Saved report: data/pipeline/reports/PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md');
}

module.exports = { generateReport };

if (require.main === module) {
  generateReport();
}
