/**
 * audit_curated_82.js
 * PHASE PHILOSOPHY — FINAL CURATED SELECTION AUDIT
 * Forensic evaluation of the 82 curated candidates
 * Zero Emojis | Strict Provenance | Production Safety
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Verify 4AM cryptographic lock
const baselinePath = path.join(__dirname, '../../data/pipeline/philosophy_research/baseline_sha256.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

let fourAmIntegrityPassed = true;
const fourAmAudit = {};
for (const [relPath, expectedHash] of Object.entries(baseline.fourAmBaseline)) {
  const fullPath = path.join(__dirname, '../../', relPath);
  const content = fs.readFileSync(fullPath);
  const currentHash = crypto.createHash('sha256').update(content).digest('hex');
  const match = (currentHash === expectedHash);
  fourAmAudit[relPath] = { expected: expectedHash, current: currentHash, match };
  if (!match) fourAmIntegrityPassed = false;
}

if (!fourAmIntegrityPassed) {
  console.error('STOP: 4AM integrity violation detected!');
  process.exit(1);
}

// 2. Load existing production datasets to detect duplicates
global.window = global;
require('../../data/registry.js');
require('../../data/philosophy.js');

const existingRegistry = global.PlatformRegistry || {};
const existingPhilo = global.PlatformData && global.PlatformData['الفلسفة'] ? global.PlatformData['الفلسفة'] : {};

const existingYouTubeIds = new Set();
const existingUrls = new Set();

for (const res of Object.values(existingRegistry)) {
  if (res.youtubeId) existingYouTubeIds.add(res.youtubeId);
  if (res.url) existingUrls.add(res.url);
  if (res.problem && res.problem.url) existingUrls.add(res.problem.url);
  if (res.solution && res.solution.url) existingUrls.add(res.solution.url);
}

if (existingPhilo.channelsData) {
  for (const list of Object.values(existingPhilo.channelsData)) {
    for (const ch of list) {
      if (ch.videos) {
        for (const v of ch.videos) {
          if (v.youtubeId) existingYouTubeIds.add(v.youtubeId);
          if (v.url) existingUrls.add(v.url);
        }
      }
    }
  }
}

// 3. Load 82 candidates
const researchJsonPath = path.join(__dirname, '../../data/pipeline/reports/PHASE_PHILOSOPHY_TARGETED_RESEARCH.json');
const researchData = JSON.parse(fs.readFileSync(researchJsonPath, 'utf8'));
const candidates = researchData.curatedIngestionCandidates || [];

console.log('Loaded candidates count:', candidates.length);

// 4. Audit rules
const regex2AS = /(?:ال)?سنة\s*(?:ال)?ثانية|(?:ال)?سنة\s*0?2|2\s*as|2as|ثانية\s*ثانوي|2\s*ثانوي|02\s*ثانوي|2\s*ثا|(?:و|ال)?ثانية\s*آداب/i;
const regex1AS = /(?:ال)?سنة\s*(?:ال)?أولى|(?:ال)?سنة\s*0?1|1\s*as|1as|أولى\s*ثانوي|1\s*ثانوي|01\s*ثانوي/i;
const regexBEM = /bem|بيام|4am|رابعة\s*متوسط|تعليم\s*متوسط/i;
const regexForeign = /مغربي|تونسي|مصري|باك\s*حر|الأولى\s*باك/i;

// Branches that explicitly exclude 3AS LP (شعبة آداب وفلسفة)
const regexWrongBranchExclusive = /خاص\s*بالشعب\s*العلمية|شعبة\s*العلوم\s*و\s*اللغات|لغات\s*أجنبية\s*وعلوم|لغات\s*والعلميين|الشعب\s*العلمية\s*واللغات|شعبة\s*علوم\s*ولغات|شعبة\s*العلوم\s*والتقني/i;

const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;

const auditedItems = [];
const summary = {
  total: candidates.length,
  validForIngestion: 0,
  matchConfirmed: 0,
  matchProbable: 0,
  generalOnly: 0,
  manualReviewRequired: 0,
  rejected: 0,
  rejectedDuplicate: 0,
  rejectedWrongLevel: 0,
  rejectedWrongBranch: 0,
  rejectedWrongLesson: 0,
  rejectedBrokenOrInvalid: 0
};

candidates.forEach((item, index) => {
  const itemNum = index + 1;
  let finalDecision = 'VALID_FOR_INGESTION';
  let rejectCategory = null;
  let decisionReason = '';

  // Count classifications
  if (item.classification === 'MATCH_CONFIRMED') summary.matchConfirmed++;
  else if (item.classification === 'MATCH_PROBABLE') summary.matchProbable++;
  else if (item.classification === 'GENERAL_ONLY') summary.generalOnly++;

  // Check 1: Broken / Invalid URL or YouTube ID
  if (item.sourceType === 'youtube' || item.source === 'YouTube') {
    if (!item.youtubeId || !ytIdRegex.test(item.youtubeId)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'BROKEN_OR_INVALID';
      decisionReason = 'معرف يوتيوب غير صالح (ليس 11 حرفا قياسيا)';
    } else if (!item.url || !item.url.startsWith('https://www.youtube.com/watch?v=' + item.youtubeId)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'BROKEN_OR_INVALID';
      decisionReason = 'رابط الفيديو غير مطابق لصيغة المشاهدة المباشرة';
    } else if (item.url.includes('/results') || item.url.includes('google.com/search')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'BROKEN_OR_INVALID';
      decisionReason = 'رابط بحث يوتيوب غير مسموح به';
    }
  } else if (item.sourceType === 'dzexams' || item.source === 'DzExams') {
    if (!item.url || !item.url.startsWith('https://www.dzexams.com/')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'BROKEN_OR_INVALID';
      decisionReason = 'رابط بنك الامتحانات غير صالح';
    }
  }

  // Check 2: Duplicate
  if (finalDecision !== 'REJECTED') {
    const isDupId = item.youtubeId && existingYouTubeIds.has(item.youtubeId);
    const isDupUrl = item.url && existingUrls.has(item.url);
    if (isDupId || isDupUrl) {
      finalDecision = 'REJECTED';
      rejectCategory = 'DUPLICATE';
      decisionReason = 'المورد مسجل مسبقا في السجل الموحد أو بيانات الفلسفة';
    }
  }

  // Check 3: Wrong Level (2AS, 1AS, BEM, Foreign)
  if (finalDecision !== 'REJECTED') {
    if (regex2AS.test(item.title)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LEVEL';
      decisionReason = 'مستوى غير مطابق (سنة ثانية ثانوي 2AS آداب وفلسفة وليس 3AS)';
    } else if (regex1AS.test(item.title)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LEVEL';
      decisionReason = 'مستوى غير مطابق (سنة أولى ثانوي 1AS وليس 3AS)';
    } else if (regexBEM.test(item.title)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LEVEL';
      decisionReason = 'مستوى غير مطابق (تعليم متوسط وليس 3AS)';
    } else if (regexForeign.test(item.title)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LEVEL';
      decisionReason = 'منهاج أجنبي غير متوافق مع البكالوريا الجزائرية';
    }
  }

  // Check 4: Wrong Branch (Exclusive scientific / languages streams excluding LP)
  if (finalDecision !== 'REJECTED') {
    if (regexWrongBranchExclusive.test(item.title)) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_BRANCH';
      decisionReason = 'شعبة غير مطابقة (مخصص حصريا للشعب العلمية أو اللغات الأجنبية دون آداب وفلسفة)';
    }
  }

  // Check 5: Wrong Lesson / No Lesson
  if (finalDecision !== 'REJECTED') {
    if (!item.lessonTitle || !item.lessonId) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LESSON';
      decisionReason = 'مورد عام غير مخصص لدرس محدد من دروس المنهاج الـ 13 (منهجية عامة)';
    } else if (item.lessonId === 'philo_3as_lp_07' && item.title.includes('الاخلاق بين الثوابت')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LESSON';
      decisionReason = 'عدم تطابق الدرس: الفيديو يتناول الأخلاق بين الثوابت والمتغيرات (درس 06) ومسند خطأ للحقوق والواجبات (درس 07)';
    } else if (item.lessonId === 'philo_3as_lp_08' && item.title.includes('الحتمية واللاحتمية')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LESSON';
      decisionReason = 'عدم تطابق الدرس: مقالة الحتمية واللاحتمية تندرج ضمن فلسفة العلوم (علوم المادة الجامدة) وليس الحرية والمسؤولية';
    } else if (item.lessonId === 'philo_3as_lp_11' && item.title.includes('الاسرة')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LESSON';
      decisionReason = 'عدم تطابق الدرس: الفيديو يتناول الأسرة (درس 09) ومسند خطأ لفلسفة الرياضيات (درس 11)';
    } else if (item.lessonId === 'philo_3as_lp_13' && item.title.includes('برنامج و جميع مقالات مادة الفلسفة')) {
      finalDecision = 'REJECTED';
      rejectCategory = 'WRONG_LESSON';
      decisionReason = 'عدم تطابق الدرس: الفيديو عرض عام لبرنامج البكالوريا وليس لدرس العلوم الإنسانية';
    }
  }

  // Check 6: Probable Classification => Strict MANUAL_REVIEW_REQUIRED rule
  if (finalDecision !== 'REJECTED') {
    if (item.classification === 'MATCH_PROBABLE') {
      finalDecision = 'MANUAL_REVIEW_REQUIRED';
      decisionReason = 'تصنيف مطابقة راجحة (MATCH_PROBABLE) يتطلب تدقيقا ومراجعة يدوية قبل الاعتماد وفق البند 3';
    } else {
      decisionReason = 'مورد معتمد مستوف لكافة الشروط ومطابق لمنهاج 3AS آداب وفلسفة (MATCH_CONFIRMED)';
    }
  }

  // Accumulate counters
  if (finalDecision === 'VALID_FOR_INGESTION') {
    summary.validForIngestion++;
  } else if (finalDecision === 'MANUAL_REVIEW_REQUIRED') {
    summary.manualReviewRequired++;
  } else if (finalDecision === 'REJECTED') {
    summary.rejected++;
    if (rejectCategory === 'DUPLICATE') summary.rejectedDuplicate++;
    else if (rejectCategory === 'WRONG_LEVEL') summary.rejectedWrongLevel++;
    else if (rejectCategory === 'WRONG_BRANCH') summary.rejectedWrongBranch++;
    else if (rejectCategory === 'WRONG_LESSON') summary.rejectedWrongLesson++;
    else if (rejectCategory === 'BROKEN_OR_INVALID') summary.rejectedBrokenOrInvalid++;
  }

  auditedItems.push({
    num: itemNum,
    id: item.id,
    lesson: item.lessonTitle || 'بدون درس محدد',
    lessonId: item.lessonId,
    title: item.title,
    type: item.resourceType,
    source: item.source,
    channel: item.channel,
    classification: item.classification,
    finalDecision: finalDecision,
    rejectCategory: rejectCategory,
    reason: decisionReason,
    url: item.url
  });
});

console.log('AUDIT SUMMARY:');
console.log(JSON.stringify(summary, null, 2));

module.exports = {
  summary,
  auditedItems,
  fourAmAudit
};
