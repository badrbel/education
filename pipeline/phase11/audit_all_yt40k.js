const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const reg = global.window.PlatformRegistry4AM || {};

const yt40k = Object.values(reg).filter(r => r.id.startsWith('yt-40k-'));
console.log(`Auditing all ${yt40k.length} yt-40k resources...`);

const auditResults = {
  valid4AM: [],
  rejectedOffLevelOrForeign: [],
  generalReviewMappedToSpecificLesson: [],
  viewThresholdIssues: []
};

for (const v of yt40k) {
  const title = v.title || '';
  const channel = v.teacher || '';
  const views = v.viewCount;

  // 1. Check view threshold strictly > 40,000
  if (!views || views <= 40000) {
    auditResults.viewThresholdIssues.push({
      id: v.id,
      videoId: v.videoId,
      title,
      views,
      reason: views === 40000 ? 'EXACTLY_40000' : 'BELOW_OR_UNKNOWN'
    });
  }

  // 2. Check for foreign/non-Algerian or off-level
  if (channel.includes('A-Level') || title.includes('A-Level') || channel.includes('iEN') || channel.includes('عين')) {
    auditResults.rejectedOffLevelOrForeign.push({
      id: v.id,
      videoId: v.videoId,
      title,
      channel,
      subject: v.subjectName,
      lesson: v.lessonTitle,
      views,
      reason: channel.includes('A-Level') ? 'UK_ALEVEL_FOREIGN_CURRICULUM' : 'SAUDI_IEN_FOREIGN_CURRICULUM'
    });
  }

  // 3. Check for general multi-lesson review videos forced into a single narrow lesson
  // e.g. "مراجعة جميع دروس الفصل الثاني" or "ملخص جميع دروس المقطع الأول"
  const isMultiLessonTitle = (
    title.includes('جميع دروس') ||
    title.includes('كل دروس') ||
    title.includes('مراجعة شاملة لجميع') ||
    title.includes('ملخص شامل جدا للميدان')
  );

  if (isMultiLessonTitle) {
    auditResults.generalReviewMappedToSpecificLesson.push({
      id: v.id,
      videoId: v.videoId,
      title,
      channel,
      subject: v.subjectName,
      lesson: v.lessonTitle,
      views
    });
  }
}

console.log('--- AUDIT SUMMARY ---');
console.log('Foreign/Off-level found:', auditResults.rejectedOffLevelOrForeign.length);
console.log('View threshold issues found:', auditResults.viewThresholdIssues.length);
console.log('General/Multi-lesson videos mapped to single lesson:', auditResults.generalReviewMappedToSpecificLesson.length);

console.log('\n=== REJECTED OFF-LEVEL / FOREIGN ===');
console.log(JSON.stringify(auditResults.rejectedOffLevelOrForeign, null, 2));

console.log('\n=== GENERAL / MULTI-LESSON VIDEOS ===');
console.log(JSON.stringify(auditResults.generalReviewMappedToSpecificLesson, null, 2));
