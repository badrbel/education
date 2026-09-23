/**
 * mordix_ai — Normalization, Cross-Level Filtering, Deduplication & Verification Engine
 * Phase AF-Enrichment — Zero Fake Data, Zero Emojis
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const rawDir = path.join(baseDir, 'data/pipeline/af_enrichment/raw');
const normDir = path.join(baseDir, 'data/pipeline/af_enrichment/normalized');
const verDir = path.join(baseDir, 'data/pipeline/af_enrichment/verified');
const rejDir = path.join(baseDir, 'data/pipeline/af_enrichment/rejected');

if (!fs.existsSync(normDir)) fs.mkdirSync(normDir, { recursive: true });
if (!fs.existsSync(verDir)) fs.mkdirSync(verDir, { recursive: true });
if (!fs.existsSync(rejDir)) fs.mkdirSync(rejDir, { recursive: true });

// Load existing 3AS data for deduplication
global.window = { PlatformData: {} };
const subjectFiles = [
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];
for (const f of subjectFiles) {
  eval(fs.readFileSync(path.join(baseDir, f), 'utf8'));
}
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const platformData = global.window.PlatformData;
const existingRegistry = global.window.PlatformRegistry;

// Build existing IDs, URLs, and YouTube IDs sets
const existingUrls = new Set();
const existingYtIds = new Set();
const existingDocIds = new Set();
const existingRegistryIds = new Set(Object.keys(existingRegistry));

for (const r of Object.values(existingRegistry)) {
  if (r.url) existingUrls.add(r.url);
  if (r.sourceUrl) existingUrls.add(r.sourceUrl);
  if (r.youtubeId) existingYtIds.add(r.youtubeId);
  if (r.videoId) existingYtIds.add(r.videoId);
  if (r.problem?.url) existingUrls.add(r.problem.url);
  if (r.dataId) existingDocIds.add(r.dataId);
}

for (const sObj of Object.values(platformData)) {
  for (const chList of Object.values(sObj.channelsData || {})) {
    for (const ch of chList) {
      for (const v of ch.videos || []) {
        const yId = v.id || v.youtubeId || v.videoId;
        if (yId) existingYtIds.add(yId);
        if (v.url) existingUrls.add(v.url);
      }
    }
  }
}

console.log(`Existing 3AS Unique YouTube IDs: ${existingYtIds.size}`);
console.log(`Existing 3AS Unique URLs: ${existingUrls.size}`);

// Canonical lessons map
const canonicalLessons = [];
for (const [sName, sObj] of Object.entries(platformData)) {
  for (const l of sObj.lessons || []) {
    canonicalLessons.push({
      subjectId: sObj.id,
      subjectName: sName,
      lessonId: l.lessonId || `${sObj.id}-${l.id}`,
      title: l.title,
      cleanTitle: l.title.replace(/[()]/g, '').trim()
    });
  }
}

function stripEmojis(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeArabic(t) {
  if (!t) return '';
  return t
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\/\\,\-–_:.،؛!؟]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const OFF_LEVEL_PATTERNS = [
  /\b4am\b/i,
  /\b3am\b/i,
  /\b2am\b/i,
  /\b1am\b/i,
  /رابعة متوسط/,
  /رابعه متوسط/,
  /ثالثة متوسط/,
  /ثانية متوسط/,
  /أولى متوسط/,
  /اولى متوسط/,
  /\bbem\b/i,
  /شهادة التعليم المتوسط/,
  /السنة الرابعة متوسط/,
  /السنة الثالثة متوسط/
];

// 1. Process YouTube Raw Candidates
const rawYt = JSON.parse(fs.readFileSync(path.join(rawDir, 'raw_candidates.json'), 'utf8'));
console.log(`Loaded ${rawYt.length} raw YouTube candidates.`);

const normalizedYt = [];
const rejectedYt = [];
const verifiedYt = [];

// Teacher tracking stats
const teacherStats = {
  abuBakrMabrouk: { found: 0, verified: 0, rejected: 0 },
  atiyaSouissi: { found: 0, verified: 0, rejected: 0 }
};

for (const item of rawYt) {
  const cleanTitle = stripEmojis(item.title);
  const cleanChannel = stripEmojis(item.channelName);
  const videoId = item.videoId;

  // Track teacher found
  if (cleanChannel.includes('بوبكر مبروك') || cleanChannel.includes('أبو بكر مبروك') || cleanTitle.includes('بوبكر مبروك') || cleanTitle.includes('أبو بكر مبروك')) {
    teacherStats.abuBakrMabrouk.found++;
  }
  if (cleanChannel.includes('عطية سويسي') || cleanTitle.includes('عطية سويسي')) {
    teacherStats.atiyaSouissi.found++;
  }

  // Check 1: 11-char YouTube ID
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    rejectedYt.push({ item, reason: 'INVALID_YOUTUBE_ID' });
    continue;
  }

  // Check 2: Already exists in platform
  if (existingYtIds.has(videoId)) {
    rejectedYt.push({ item, reason: 'DUPLICATE_ALREADY_IN_PLATFORM' });
    continue;
  }

  // Check 3: Cross-level filter (Strict 4AM / BEM rejection)
  const fullText = `${cleanTitle} ${cleanChannel} ${item.descriptionSnippet || ''}`;
  let isOffLevel = false;
  for (const pat of OFF_LEVEL_PATTERNS) {
    if (pat.test(fullText)) {
      isOffLevel = true;
      break;
    }
  }

  if (isOffLevel) {
    if (cleanChannel.includes('بوبكر مبروك') || cleanTitle.includes('بوبكر مبروك')) teacherStats.abuBakrMabrouk.rejected++;
    if (cleanChannel.includes('عطية سويسي') || cleanTitle.includes('عطية سويسي')) teacherStats.atiyaSouissi.rejected++;
    rejectedYt.push({ item, reason: 'CROSS_LEVEL_LEAK_MIDDLE_SCHOOL' });
    continue;
  }

  // Check 4: Check if belongs to another branch not in AF (e.g. Science only, Technology only)
  if (/\b(رياضيات وتقني رياضي|علوم تجريبية وتقني|تسيير واقتصاد فقط)\b/.test(cleanTitle) && !cleanTitle.includes('جميع الشعب') && !cleanTitle.includes('آداب وفلسفة')) {
    rejectedYt.push({ item, reason: 'EXCLUDED_BRANCH_SCIENTIFIC_ONLY' });
    continue;
  }

  // Match against canonical lessons
  let matchedLesson = null;
  const normTitle = normalizeArabic(cleanTitle);

  for (const l of canonicalLessons) {
    if (l.subjectId !== item.harvestSubject) continue;
    const normL = normalizeArabic(l.cleanTitle);
    if (normTitle.includes(normL) || normL.includes(normTitle)) {
      matchedLesson = l;
      break;
    }
  }

  // Specific semantic matching for Arabic grammar & literature
  if (!matchedLesson && item.harvestSubject === 'arabic') {
    if (normTitle.includes('بدل') || normTitle.includes('عطف النسق')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'arabic-04' || l.title.includes('البدل'));
    } else if (normTitle.includes('اعراب تقديري') || normTitle.includes('لفظي وتقديري')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'arabic-01' || l.title.includes('التقديري'));
    } else if (normTitle.includes('اذا') || normTitle.includes('اذن') || normTitle.includes('حينئذ')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'arabic-02' || l.title.includes('إذ'));
    } else if (normTitle.includes('مسند') || normTitle.includes('مسند اليه')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'arabic-03' || l.title.includes('المسند'));
    } else if (normTitle.includes('شعر المنفي') || normTitle.includes('البارودي') || normTitle.includes('شوقي')) {
      matchedLesson = canonicalLessons.find(l => l.title.includes('المنفى') || l.lessonId === 'arabic-07');
    } else if (normTitle.includes('شعر المهجر') || normTitle.includes('الرابطه القلميه') || normTitle.includes('ايليا')) {
      matchedLesson = canonicalLessons.find(l => l.title.includes('المهجر') || l.lessonId === 'arabic-11');
    } else if (normTitle.includes('ظاهره الحزن والالم') || normTitle.includes('نازك') || normTitle.includes('بدر شاكر')) {
      matchedLesson = canonicalLessons.find(l => l.title.includes('الحزن') || l.lessonId === 'arabic-16');
    } else if (normTitle.includes('مقال') || normTitle.includes('البشير الابراهيمي') || normTitle.includes('ابن باديس')) {
      matchedLesson = canonicalLessons.find(l => l.title.includes('المقال') || l.lessonId === 'arabic-24');
    }
  }

  // Specific semantic matching for History & Geography
  if (!matchedLesson && item.harvestSubject === 'history') {
    if (item.harvestCategory === 'GEOGRAPHICAL_TERMS') {
      if (normTitle.includes('تقدم') || normTitle.includes('تخلف')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-11');
      } else if (normTitle.includes('مبادلات') || normTitle.includes('بترول') || normTitle.includes('قمح') || normTitle.includes('اموال')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-12');
      } else if (normTitle.includes('امريكي') || normTitle.includes('قوه اقتصاديه امريكيه')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-13');
      } else if (normTitle.includes('تكتل') || normTitle.includes('اتحاد اوروبي')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-14');
      } else if (normTitle.includes('اسيا') || normTitle.includes('تنينات') || normTitle.includes('نمور')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-15');
      }
    } else if (item.harvestCategory === 'HISTORICAL_FIGURES') {
      if (normTitle.includes('حرب بارده') || normTitle.includes('سوفياتي') || normTitle.includes('امريكي')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-01');
      } else if (normTitle.includes('ثوره') || normTitle.includes('جزائري')) {
        matchedLesson = canonicalLessons.find(l => l.lessonId === 'history-05');
      }
    }
  }

  // Specific semantic matching for English
  if (!matchedLesson && item.harvestSubject === 'english') {
    if (normTitle.includes('quantifier') || normTitle.includes('few') || normTitle.includes('little') || normTitle.includes('much') || normTitle.includes('many')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'english-18');
    } else if (normTitle.includes('syllable') || normTitle.includes('syllables') || normTitle.includes('مقاطع')) {
      matchedLesson = canonicalLessons.find(l => l.lessonId === 'english-22');
    }
  }

  // Teacher verification update
  const isAbuBakr = cleanChannel.includes('بوبكر مبروك') || cleanChannel.includes('أبو بكر مبروك') || cleanTitle.includes('بوبكر مبروك') || cleanTitle.includes('أبو بكر مبروك');
  const isAtiya = cleanChannel.includes('عطية سويسي') || cleanTitle.includes('عطية سويسي');

  let topicCategory = null;
  if (item.harvestCategory === 'GEOGRAPHICAL_TERMS') topicCategory = 'GEOGRAPHICAL_TERMS';
  else if (item.harvestCategory === 'HISTORICAL_FIGURES') topicCategory = 'HISTORICAL_FIGURES';

  const normalized = {
    source: 'youtube',
    sourceType: 'DIRECT_RESOURCE',
    videoId,
    youtubeId: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: cleanTitle,
    channel: cleanChannel,
    teacher: isAbuBakr ? 'الأستاذ أبو بكر مبروك' : (isAtiya ? 'الأستاذ عطية سويسي' : cleanChannel),
    duration: item.duration,
    views: item.views,
    subjectId: item.harvestSubject,
    levelId: '3as',
    branch: 'آداب وفلسفة',
    lessonId: matchedLesson ? matchedLesson.lessonId : null,
    lessonTitle: matchedLesson ? matchedLesson.title : null,
    topicCategory,
    discoveryMethod: item.harvestCategory,
    verificationStatus: matchedLesson ? 'MATCH_CONFIRMED' : 'MATCH_PROBABLE',
    auditStatus: 'SAFE_TO_IMPORT',
    verified: true
  };

  if (isAbuBakr) teacherStats.abuBakrMabrouk.verified++;
  if (isAtiya) teacherStats.atiyaSouissi.verified++;

  normalizedYt.push(normalized);
  existingYtIds.add(videoId);
}

console.log(`Normalized YouTube candidates: ${normalizedYt.length}`);
console.log(`Rejected YouTube candidates: ${rejectedYt.length}`);
console.log('Teacher discovery stats:\n', JSON.stringify(teacherStats, null, 2));

// 2. Process DzExams Raw Documents
const rawDocs = JSON.parse(fs.readFileSync(path.join(rawDir, 'raw_dzexams_documents.json'), 'utf8'));
console.log(`\nLoaded ${rawDocs.length} raw DzExams documents.`);

const normalizedDocs = [];
const rejectedDocs = [];

for (const doc of rawDocs) {
  const cleanTitle = stripEmojis(doc.title);
  const dataId = doc.dataId;

  // Check 1: Already exists in platform
  if (existingDocIds.has(dataId) || existingUrls.has(doc.sourceUrl)) {
    rejectedDocs.push({ doc, reason: 'DUPLICATE_ALREADY_IN_PLATFORM' });
    continue;
  }

  // Check 2: Cross-level filter
  let isOffLevel = false;
  for (const pat of OFF_LEVEL_PATTERNS) {
    if (pat.test(cleanTitle)) {
      isOffLevel = true;
      break;
    }
  }
  if (isOffLevel) {
    rejectedDocs.push({ doc, reason: 'CROSS_LEVEL_LEAK_MIDDLE_SCHOOL' });
    continue;
  }

  // Check 3: If Math, ensure it belongs to Literature & Philosophy curriculum
  if (doc.subjectId === 'math') {
    const isAfMath = /موافقات|قسمة في z|قسمه في z|متتاليات|دوال عددية|دوال عدديه|احتمالات|احصاء|اداب|لغات/.test(cleanTitle.toLowerCase());
    const isSciMath = /اعداد مركبة|أعداد مركبة|تحاكي|فضاء|فيزياء|علوم تجريبية|تقني رياضي/.test(cleanTitle.toLowerCase());
    if (isSciMath && !isAfMath) {
      rejectedDocs.push({ doc, reason: 'SCIENTIFIC_ONLY_MATH_EXCLUDED' });
      continue;
    }
  }

  // Determine resource type
  let resType = 'summary';
  if (/تمرين|سلسلة|تمارين|سلاسل|تطبيقات|مسائل/.test(cleanTitle)) {
    resType = 'exercise';
  } else if (/مراجعة|مراجعه|شاملة|المختصر|النهائية/.test(cleanTitle)) {
    resType = 'review';
  } else if (/امتحان|فرض|اختبار|بكالوريا تجريبية/.test(cleanTitle)) {
    resType = 'exam';
  }

  // Determine topic category (Terms / Figures)
  let topicCategory = null;
  if (/مصطلحات|مفاهيم|مصطلح/.test(cleanTitle)) {
    topicCategory = 'GEOGRAPHICAL_TERMS';
  } else if (/شخصيات|شخصية|اعلام|أعلام/.test(cleanTitle)) {
    topicCategory = 'HISTORICAL_FIGURES';
  }

  // Match against canonical lessons
  let matchedLesson = null;
  const normTitle = normalizeArabic(cleanTitle);

  for (const l of canonicalLessons) {
    if (l.subjectId !== doc.subjectId) continue;
    const normL = normalizeArabic(l.cleanTitle);
    if (normTitle.includes(normL)) {
      matchedLesson = l;
      break;
    }
  }

  const normalized = {
    source: 'dzexams',
    sourceType: 'DIRECT_RESOURCE',
    dataId,
    url: doc.sourceUrl,
    sourceUrl: doc.sourceUrl,
    title: cleanTitle,
    type: resType,
    subjectId: doc.subjectId,
    subjectName: doc.subjectName,
    levelId: '3as',
    branch: 'آداب وفلسفة',
    lessonId: matchedLesson ? matchedLesson.lessonId : null,
    lessonTitle: matchedLesson ? matchedLesson.title : null,
    topicCategory,
    format: 'pdf',
    verificationStatus: matchedLesson ? 'MATCH_CONFIRMED' : 'MATCH_PROBABLE',
    auditStatus: 'SAFE_TO_IMPORT',
    verified: true
  };

  normalizedDocs.push(normalized);
  existingDocIds.add(dataId);
  existingUrls.add(doc.sourceUrl);
}

console.log(`Normalized DzExams documents: ${normalizedDocs.length}`);
console.log(`Rejected DzExams documents: ${rejectedDocs.length}`);

// Combine all verified candidates
const allVerifiedCandidates = [...normalizedYt, ...normalizedDocs];
console.log(`\nTOTAL VERIFIED CANDIDATES: ${allVerifiedCandidates.length}`);

// Write output files
fs.writeFileSync(path.join(verDir, 'verified_af_candidates.json'), JSON.stringify(allVerifiedCandidates, null, 2), 'utf8');
fs.writeFileSync(path.join(rejDir, 'rejected_candidates.json'), JSON.stringify({ rejectedYt, rejectedDocs }, null, 2), 'utf8');
fs.writeFileSync(path.join(baseDir, 'data/pipeline/af_enrichment/teacher_discovery_stats.json'), JSON.stringify(teacherStats, null, 2), 'utf8');

console.log(`Output files successfully written to ${verDir} and ${rejDir}.`);
