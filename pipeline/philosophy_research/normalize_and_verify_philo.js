/**
 * mordix_ai — Philosophy Normalization & Strict Verification Engine
 * Enforces Zero Fake Data, Zero Emojis, Zero Search URLs, Strict 3AS Level Shield
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const rawPath = path.join(baseDir, 'data/pipeline/philosophy_research/raw/raw_philosophy_candidates.json');
const outputPath = path.join(baseDir, 'data/pipeline/philosophy_research');

const strictEmojiRegex = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F7E0}-\u{1F7EB}\u{200D}\u{FE0F}]/gu;
function cleanAllEmojis(str) {
  if (!str) return '';
  return str.replace(strictEmojiRegex, '').replace(/\s+/g, ' ').trim();
}

// 13 Canonical Lessons
const CANONICAL_LESSONS = [
  { id: 1, lessonId: 'philo_3as_lp_01', title: 'الإحساس والإدراك', keywords: ['إحساس', 'إدراك', 'الاحساس والادراك', 'العالم الخارجي', 'الجيشطالت', 'الظواهرية', 'الحواس'] },
  { id: 2, lessonId: 'philo_3as_lp_02', title: 'اللغة والفكر', keywords: ['اللغة والفكر', 'الدال والمدلول', 'وظائف اللغة', 'العلاقة بين الدال والمدلول', 'الفكر واللغة'] },
  { id: 3, lessonId: 'philo_3as_lp_03', title: 'الشعور واللاشعور', keywords: ['الشعور واللاشعور', 'الشعور', 'اللاشعور', 'فرويد', 'التحليل النفسي', 'الحياة النفسية', 'عقدة أوديب', 'الكبت'] },
  { id: 4, lessonId: 'philo_3as_lp_04', title: 'الذاكرة والخيال', keywords: ['الذاكرة والخيال', 'الذاكرة', 'الخيال', 'النسيان', 'برغسون', 'المادية', 'النفسية', 'الذاكرة الاجتماعية', 'هالبفاكس'] },
  { id: 5, lessonId: 'philo_3as_lp_05', title: 'العادة والإرادة', keywords: ['العادة والإرادة', 'العادة', 'الإرادة', 'أثر العادة', 'التكيف', 'الروتين'] },
  { id: 6, lessonId: 'philo_3as_lp_06', title: 'الأخلاق بين الثوابت والمتغيرات', keywords: ['الأخلاق بين الثوابت والمتغيرات', 'القيمة الأخلاقية', 'أساس الأخلاق', 'الأخلاق', 'المنفعة', 'العقل الأخلاقي', 'كانط', 'دوركايم'] },
  { id: 7, lessonId: 'philo_3as_lp_07', title: 'الحقوق والواجبات والعدل', keywords: ['الحقوق والواجبات والعدل', 'الحق والواجب', 'العدالة', 'المساواة والتفاوت', 'أسبقية الحق', 'العدل'] },
  { id: 8, lessonId: 'philo_3as_lp_08', title: 'الحرية والمسؤولية', keywords: ['الحرية والمسؤولية', 'الحرية', 'المسؤولية', 'الحتمية', 'الجريمة والعقاب', 'سارتر', 'الجبر والاختيار'] },
  { id: 9, lessonId: 'philo_3as_lp_09', title: 'العلاقات الأسرية والحياة الاقتصادية والسياسية', keywords: ['العلاقات الأسرية', 'الحياة الاقتصادية والسياسية', 'الرأسمالية والاشتراكية', 'الأنظمة الاقتصادية', 'الدولة', 'الأخلاق والسياسة', 'ميكيافيلي', 'الملكية الفردية'] },
  { id: 10, lessonId: 'philo_3as_lp_10', title: 'العنف والتسامح', keywords: ['العنف والتسامح', 'العنف', 'التسامح', 'مشروعية العنف', 'اللاعنف', 'غاندي', 'التعصب'] },
  { id: 11, lessonId: 'philo_3as_lp_11', title: 'فلسفة الرياضيات', keywords: ['فلسفة الرياضيات', 'اليقين الرياضي', 'المفاهيم الرياضية', 'أصل الرياضيات', 'العقل والتجربة', 'الأكسيوماتيك', 'الهندسات اللاإقليدية', 'لوبالتشيفسكي', 'ريمان'] },
  { id: 12, lessonId: 'philo_3as_lp_12', title: 'علوم المادة الجامدة وعلوم المادة الحية', keywords: ['المادة الجامدة والمادة الحية', 'علوم المادة الجامدة', 'علوم المادة الحية', 'البيولوجيا', 'المنهج التجريبي', 'الحتمية في البيولوجيا', 'كلود برنارد', 'الملاحظة والفرضية والتجربة'] },
  { id: 13, lessonId: 'philo_3as_lp_13', title: 'العلوم الإنسانية', keywords: ['العلوم الإنسانية', 'الظاهرة الإنسانية', 'الحادثة التاريخية', 'علم النفس', 'علم الاجتماع', 'التاريخ', 'ابن خلدون', 'العوائق الإبستمولوجية'] }
];

// Load existing IDs for deduplication
global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/philosophy.js'), 'utf8'));
const philoData = global.window.PlatformData['الفلسفة'];

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));
const registry = global.window.PlatformRegistry;

const existingVideoIds = new Set();
for (const cList of Object.values(philoData.channelsData || {})) {
  for (const ch of cList) {
    for (const v of (ch.videos || [])) {
      if (v.id) existingVideoIds.add(v.id);
      if (v.videoId) existingVideoIds.add(v.videoId);
      if (v.youtubeId) existingVideoIds.add(v.youtubeId);
    }
  }
}
for (const r of Object.values(registry)) {
  if (r.subjectId === 'philosophy') {
    if (r.videoId) existingVideoIds.add(r.videoId);
    if (r.youtubeId) existingVideoIds.add(r.youtubeId);
  }
}
console.log(`Loaded ${existingVideoIds.size} existing unique philosophy video IDs.`);

function normalizeAndVerify() {
  if (!fs.existsSync(rawPath)) {
    console.log('Raw candidates file not found yet. Waiting for search task.');
    return;
  }

  const rawList = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`Processing ${rawList.length} raw discovered items...`);

  const seenIdsInBatch = new Set();
  const normalizedCandidates = [];
  const verifiedCandidates = [];
  const rejectedCandidates = [];

  for (const raw of rawList) {
    const videoId = raw.videoId;
    const title = cleanAllEmojis(raw.title || '');
    const channel = cleanAllEmojis(raw.channelName || '');

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'INVALID_VIDEO_ID' });
      continue;
    }

    if (existingVideoIds.has(videoId)) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'ALREADY_EXISTS_IN_PLATFORM' });
      continue;
    }

    if (seenIdsInBatch.has(videoId)) {
      continue; // Duplicate within current batch
    }
    seenIdsInBatch.add(videoId);

    const desc = cleanAllEmojis(raw.descriptionSnippet || '');
    const combinedText = `${title} ${desc} ${channel}`.toLowerCase();

    // 1. Cross-Level Shield: Reject 2AS, 1AS, BEM, Primary, Foreign curricula
    const is2AS = /2\s*as|2as|ثانية\s*ثانوي|2\s*ثانوي|02\s*ثانوي|السنة\s*الثانية|2\s*ثا/.test(combinedText);
    const is1AS = /1\s*as|1as|أولى\s*ثانوي|1\s*ثانوي|السنة\s*الأولى/.test(combinedText);
    const isBEM = /bem|بيام|متوسط|4\s*am|4am|رابعة\s*متوسط/.test(combinedText);
    const isForeign = /الثانوية\s*العامة|مصر|توجيهي|المغرب|أولى\s*باك/.test(combinedText);

    if (is2AS) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'WRONG_LEVEL_2AS' });
      continue;
    }
    if (is1AS) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'WRONG_LEVEL_1AS' });
      continue;
    }
    if (isBEM) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'WRONG_LEVEL_BEM' });
      continue;
    }
    if (isForeign) {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'FOREIGN_CURRICULUM' });
      continue;
    }

    // 2. Determine 3AS Evidence
    const hasBacKeyword = /bac|بكالوريا|باك|3as|3\s*as|ثالثة\s*ثانوي|3\s*ثانوي|شعبة\s*آداب/.test(combinedText);
    const isAlgerianTeacher = /خليل\s*سعيداني|نوال|عادل\s*مقرود|حمداش|بومعزة|حروزة|بن\s*عيسى|قرفي|يوسف\s*بن\s*مهيدي|الأستاذ|دروس\s*فلسفة/.test(combinedText);

    // 3. Match to Canonical Lesson
    let matchedLesson = null;
    let matchScore = 0;

    // Check target lesson from search query first
    if (raw.targetLessonId) {
      const target = CANONICAL_LESSONS.find(l => l.lessonId === raw.targetLessonId);
      if (target) {
        for (const kw of target.keywords) {
          if (combinedText.includes(kw.toLowerCase())) {
            matchedLesson = target;
            matchScore = 3;
            break;
          }
        }
      }
    }

    // If not matched yet, search across all 13 canonical lessons
    if (!matchedLesson) {
      for (const l of CANONICAL_LESSONS) {
        let score = 0;
        for (const kw of l.keywords) {
          if (combinedText.includes(kw.toLowerCase())) {
            score += 2;
          }
        }
        if (score > matchScore) {
          matchScore = score;
          matchedLesson = l;
        }
      }
    }

    // 4. Resource Type Classification
    let resourceType = 'LESSON_VIDEO';
    if (/منهجية|استقصاء\s*بالوضع|جدلية|مقارنة|تحليل\s*نص|طريقة\s*كتابة\s*مقالة/.test(combinedText)) {
      resourceType = 'METHODOLOGY';
    } else if (/مراجعة|ملخص\s*شامل|مراجعة\s*نهائية|تثبيت/.test(combinedText)) {
      resourceType = 'REVISION_VIDEO';
    } else if (/حل\s*موضوع|تطبيق|مقالة\s*مقترحة|بكالوريا\s*20\d\d/.test(combinedText)) {
      resourceType = 'EXERCISE_VIDEO';
    }

    // 5. Verification Status
    let verificationStatus = 'NEEDS_VERIFICATION';
    let matchQuality = 'NEEDS_VERIFICATION';

    if (matchedLesson && (hasBacKeyword || isAlgerianTeacher) && matchScore >= 2) {
      verificationStatus = 'VERIFIED';
      matchQuality = 'MATCH_CONFIRMED';
    } else if (matchedLesson && matchScore >= 1) {
      verificationStatus = 'VERIFIED';
      matchQuality = 'MATCH_PROBABLE';
    } else if (!matchedLesson && hasBacKeyword && /فلسفة/.test(combinedText)) {
      verificationStatus = 'VERIFIED';
      matchQuality = 'GENERAL_PHILOSOPHY_REVIEW';
      resourceType = 'REVISION_VIDEO';
    } else {
      rejectedCandidates.push({ videoId, title, channel, rejectReason: 'LOW_RELEVANCE_OR_UNCONFIRMED_TOPIC' });
      continue;
    }

    const candidate = {
      id: `philo-res-${videoId}`,
      videoId: videoId,
      youtubeId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: title,
      channel: channel,
      teacher: channel,
      duration: raw.duration || '',
      views: raw.views || '',
      subjectId: 'philosophy',
      subjectName: 'الفلسفة',
      level: 'الثالثة ثانوي',
      branch: 'آداب وفلسفة',
      lessonId: matchedLesson ? matchedLesson.lessonId : null,
      lessonTitle: matchedLesson ? matchedLesson.title : null,
      lessonNum: matchedLesson ? matchedLesson.id : null,
      resourceType: resourceType,
      verificationStatus: verificationStatus,
      matchQuality: matchQuality,
      evidence: {
        hasBacKeyword,
        isAlgerianTeacher,
        matchScore,
        sourceQuery: raw.query
      }
    };

    normalizedCandidates.push(candidate);
    if (verificationStatus === 'VERIFIED') {
      verifiedCandidates.push(candidate);
    }
  }

  fs.writeFileSync(path.join(outputPath, 'normalized_philosophy_candidates.json'), JSON.stringify(normalizedCandidates, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputPath, 'verified_philosophy_candidates.json'), JSON.stringify(verifiedCandidates, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputPath, 'rejected_philosophy_candidates.json'), JSON.stringify(rejectedCandidates, null, 2), 'utf8');

  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`Total Normalized: ${normalizedCandidates.length}`);
  console.log(`Total Verified:   ${verifiedCandidates.length}`);
  console.log(`Total Rejected:   ${rejectedCandidates.length}`);

  // Breakdown by lesson
  console.log('\nVerified candidates by lesson:');
  for (const l of CANONICAL_LESSONS) {
    const count = verifiedCandidates.filter(c => c.lessonId === l.lessonId).length;
    console.log(`- [${l.id}] ${l.title}: +${count} verified candidates`);
  }
  const generalCount = verifiedCandidates.filter(c => c.lessonId === null).length;
  console.log(`- General / Methodology: +${generalCount} verified candidates`);
}

module.exports = { normalizeAndVerify };

if (require.main === module) {
  normalizeAndVerify();
}
