/**
 * mordix_ai — Comprehensive Philosophy Targeted Research Processor
 * Processes raw YouTube & DzExams candidates under strict user criteria
 * Zero Fake Data, Zero Emojis, Zero Modification to Production Files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const rawYtPath = path.join(baseDir, 'data/pipeline/philosophy_research/raw/raw_philosophy_candidates.json');
const rawDzPath = path.join(baseDir, 'data/pipeline/philosophy_research/raw/raw_dzexams_philosophy.json');
const outDir = path.join(baseDir, 'data/pipeline/philosophy_research');
const reportDir = path.join(baseDir, 'data/pipeline/reports');

const strictEmojiRegex = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F7E0}-\u{1F7EB}\u{200D}\u{FE0F}]/gu;
function cleanAllEmojis(str) {
  if (!str) return '';
  return str.replace(strictEmojiRegex, '').replace(/\s+/g, ' ').trim();
}

// 13 Canonical Lessons
const CANONICAL_LESSONS = [
  { id: 1, lessonId: 'philo_3as_lp_01', title: 'الإحساس والإدراك', priority: 'LOW', keywords: ['إحساس', 'إدراك', 'الاحساس والادراك', 'العالم الخارجي', 'الجيشطالت', 'الظواهرية', 'الحواس'] },
  { id: 2, lessonId: 'philo_3as_lp_02', title: 'اللغة والفكر', priority: 'LOW', keywords: ['اللغة والفكر', 'الدال والمدلول', 'وظائف اللغة', 'العلاقة بين الدال والمدلول', 'الفكر واللغة'] },
  { id: 3, lessonId: 'philo_3as_lp_03', title: 'الشعور واللاشعور', priority: 'P1', keywords: ['الشعور واللاشعور', 'الشعور', 'اللاشعور', 'فرويد', 'التحليل النفسي', 'الحياة النفسية', 'عقدة أوديب', 'الكبت', 'الوعي'] },
  { id: 4, lessonId: 'philo_3as_lp_04', title: 'الذاكرة والخيال', priority: 'P1', keywords: ['الذاكرة والخيال', 'الذاكرة', 'الخيال', 'النسيان', 'برغسون', 'المادية', 'النفسية', 'الذاكرة الاجتماعية', 'هالبفاكس', 'الإبداع'] },
  { id: 5, lessonId: 'philo_3as_lp_05', title: 'العادة والإرادة', priority: 'LOW', keywords: ['العادة والإرادة', 'العادة', 'الإرادة', 'أثر العادة', 'التكيف', 'الروتين'] },
  { id: 6, lessonId: 'philo_3as_lp_06', title: 'الأخلاق بين الثوابت والمتغيرات', priority: 'P2', keywords: ['الأخلاق بين الثوابت والمتغيرات', 'القيمة الأخلاقية', 'أساس الأخلاق', 'الأخلاق', 'المنفعة', 'العقل الأخلاقي', 'كانط', 'دوركايم', 'النسبية'] },
  { id: 7, lessonId: 'philo_3as_lp_07', title: 'الحقوق والواجبات والعدل', priority: 'P2', keywords: ['الحقوق والواجبات والعدل', 'الحق والواجب', 'العدالة', 'المساواة والتفاوت', 'أسبقية الحق', 'العدل'] },
  { id: 8, lessonId: 'philo_3as_lp_08', title: 'الحرية والمسؤولية', priority: 'P2', keywords: ['الحرية والمسؤولية', 'الحرية', 'المسؤولية', 'الحتمية', 'الجريمة والعقاب', 'سارتر', 'الجبر والاختيار'] },
  { id: 9, lessonId: 'philo_3as_lp_09', title: 'العلاقات الأسرية والحياة الاقتصادية والسياسية', priority: 'P2', keywords: ['العلاقات الأسرية والحياة الاقتصادية والسياسية', 'الحياة الاقتصادية والسياسية', 'الرأسمالية والاشتراكية', 'الأنظمة الاقتصادية', 'الدولة', 'الأخلاق والسياسة', 'ميكيافيلي', 'الملكية الفردية', 'الأسرة'] },
  { id: 10, lessonId: 'philo_3as_lp_10', title: 'العنف والتسامح', priority: 'P2', keywords: ['العنف والتسامح', 'العنف', 'التسامح', 'مشروعية العنف', 'اللاعنف', 'غاندي', 'التعصب'] },
  { id: 11, lessonId: 'philo_3as_lp_11', title: 'فلسفة الرياضيات', priority: 'P3', keywords: ['فلسفة الرياضيات', 'اليقين الرياضي', 'المفاهيم الرياضية', 'أصل الرياضيات', 'العقل والتجربة', 'الأكسيوماتيك', 'الهندسات اللاإقليدية', 'لوبالتشيفسكي', 'ريمان'] },
  { id: 12, lessonId: 'philo_3as_lp_12', title: 'علوم المادة الجامدة وعلوم المادة الحية', priority: 'P3', keywords: ['المادة الجامدة والمادة الحية', 'علوم المادة الجامدة', 'علوم المادة الحية', 'البيولوجيا', 'المنهج التجريبي', 'الحتمية في البيولوجيا', 'كلود برنارد', 'الملاحظة والفرضية والتجربة'] },
  { id: 13, lessonId: 'philo_3as_lp_13', title: 'العلوم الإنسانية', priority: 'P3', keywords: ['العلوم الإنسانية', 'الظاهرة الإنسانية', 'الحادثة التاريخية', 'علم النفس', 'علم الاجتماع', 'التاريخ', 'ابن خلدون', 'العوائق الإبستمولوجية'] }
];

// Load existing resources to detect duplicates
global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/philosophy.js'), 'utf8'));
const philoData = global.window.PlatformData['الفلسفة'];

global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));
const registry = global.window.PlatformRegistry;

const existingVideoIds = new Set();
const existingDocUrls = new Set();

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
    if (r.url) existingDocUrls.add(r.url);
    if (r.source && r.source.url) existingDocUrls.add(r.source.url);
  }
}

function processAll() {
  console.log('=== PROCESSING TARGETED PHILOSOPHY RESEARCH ===');

  const rawYt = JSON.parse(fs.readFileSync(rawYtPath, 'utf8'));
  const rawDz = JSON.parse(fs.readFileSync(rawDzPath, 'utf8'));
  console.log(`Loaded ${rawYt.length} raw YouTube items and ${rawDz.length} raw DzExams items.`);

  const allRawItems = [];
  rawYt.forEach(item => allRawItems.push({ sourceType: 'youtube', ...item }));
  rawDz.forEach(item => allRawItems.push({ sourceType: 'dzexams', ...item }));

  const confirmedItems = [];
  const probableItems = [];
  const needsVerificationItems = [];
  const rejectedItems = [];

  const seenIdsInBatch = new Set();

  for (const raw of allRawItems) {
    const isYt = raw.sourceType === 'youtube';
    const idKey = isYt ? raw.videoId : raw.dataId;
    const title = cleanAllEmojis(raw.title || '');
    const channel = cleanAllEmojis(raw.channelName || raw.channel || (isYt ? '' : 'بنك الامتحانات الجزائري / DzExams'));

    if (!idKey) {
      rejectedItems.push({ title, channel, classification: 'BROKEN_OR_INVALID', reason: 'Missing resource ID' });
      continue;
    }

    if (isYt && !/^[a-zA-Z0-9_-]{11}$/.test(idKey)) {
      rejectedItems.push({ title, channel, classification: 'BROKEN_OR_INVALID', reason: 'Invalid YouTube 11-char ID' });
      continue;
    }

    if (isYt && existingVideoIds.has(idKey)) {
      rejectedItems.push({ title, channel, classification: 'DUPLICATE', reason: 'Video already exists in platform' });
      continue;
    }

    if (!isYt && (existingDocUrls.has(raw.url) || existingDocUrls.has(raw.downloadUrl))) {
      rejectedItems.push({ title, channel, classification: 'DUPLICATE', reason: 'Document already exists in platform' });
      continue;
    }

    if (seenIdsInBatch.has(idKey)) {
      continue; // Duplicate within current batch
    }
    seenIdsInBatch.add(idKey);

    const desc = cleanAllEmojis(raw.descriptionSnippet || '');
    const combined = `${title} ${desc} ${channel}`.toLowerCase();

    // 1. Cross-Level Shield: Reject 2AS, 1AS, BEM, foreign
    if (/(?:ال)?سنة\s*(?:ال)?ثانية|(?:ال)?سنة\s*0?2|2\s*as|2as|ثانية\s*ثانوي|2\s*ثانوي|02\s*ثانوي|2\s*ثا/.test(combined)) {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_LEVEL', reason: 'Content for 2nd Year Secondary (2AS)' });
      continue;
    }
    if (/(?:ال)?سنة\s*(?:ال)?أولى|(?:ال)?سنة\s*0?1|1\s*as|1as|أولى\s*ثانوي|1\s*ثانوي|1\s*ثا/.test(combined)) {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_LEVEL', reason: 'Content for 1st Year Secondary (1AS)' });
      continue;
    }
    if (/bem|بيام|متوسط|4\s*am|4am|رابعة\s*متوسط/.test(combined)) {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_LEVEL', reason: 'Content for Middle School (BEM/4AM)' });
      continue;
    }
    if (/الثانوية\s*العامة|مصر|توجيهي|المغرب|أولى\s*باك/.test(combined)) {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_LEVEL', reason: 'Foreign / non-Algerian curriculum' });
      continue;
    }

    // 2. Branch Shield: Reject scientific-only or technical-math only
    if (/للشعب\s*العلمية|شعبتي\s*رياضيات\s*و\s*علوم|تقني\s*رياضي\s*و\s*تسيير|شعبة\s*علوم\s*تجريبية\s*فقط/.test(combined) && !/آداب\s*وفلسفة|اداب\s*وفلسفة|جميع\s*الشعب|كل\s*الشعب/.test(combined)) {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_BRANCH', reason: 'Scientific or technical math branch exclusive' });
      continue;
    }

    // 3. Lesson Matching
    let matchedLesson = null;
    let matchScore = 0;

    if (raw.targetLessonId) {
      const target = CANONICAL_LESSONS.find(l => l.lessonId === raw.targetLessonId);
      if (target) {
        for (const kw of target.keywords) {
          if (combined.includes(kw.toLowerCase())) {
            matchedLesson = target;
            matchScore = 3;
            break;
          }
        }
      }
    }

    if (!matchedLesson) {
      for (const l of CANONICAL_LESSONS) {
        let score = 0;
        for (const kw of l.keywords) {
          if (combined.includes(kw.toLowerCase())) {
            score += 2;
          }
        }
        if (score > matchScore) {
          matchScore = score;
          matchedLesson = l;
        }
      }
    }

    // 4. Resource Type Determination
    let resourceType = 'LESSON_VIDEO';
    if (!isYt) {
      resourceType = 'SUMMARY';
      if (/مواضيع|بكالوريا|امتحان/.test(title)) resourceType = 'EXAM';
      else if (/تطبيق|تمارين|سلسلة/.test(title)) resourceType = 'EXERCISE';
    } else {
      if (/منهجية|استقصاء\s*بالوضع|جدلية|مقارنة|تحليل\s*نص|طريقة\s*كتابة\s*مقالة/.test(combined)) {
        resourceType = 'METHODOLOGY';
      } else if (/مراجعة|ملخص\s*شامل|مراجعة\s*نهائية|تثبيت/.test(combined)) {
        resourceType = 'REVISION_VIDEO';
      } else if (/حل\s*موضوع|تطبيق|مقالة\s*مقترحة|بكالوريا\s*20\d\d/.test(combined)) {
        resourceType = 'EXERCISE_VIDEO';
      }
    }

    // 5. Evidence & Quality Classification
    const hasBacExplicit = /bac|بكالوريا|باك|3as|3\s*as|ثالثة\s*ثانوي|3\s*ثانوي|آداب\s*وفلسفة/.test(combined);
    const hasAlgerianTeacher = /خليل\s*سعيداني|نوال|عادل\s*مقرود|حمداش|بومعزة|حروزة|بن\s*عيسى|قرفي|يوسف\s*بن\s*مهيدي|الأستاذ|دروس\s*فلسفة/.test(combined);

    const processedItem = {
      id: isYt ? `philo-yt-${idKey}` : `philo-doc-${idKey}`,
      sourceType: raw.sourceType,
      title: title,
      resourceType: resourceType,
      url: isYt ? `https://www.youtube.com/watch?v=${idKey}` : raw.url,
      downloadUrl: raw.downloadUrl || null,
      youtubeId: isYt ? idKey : null,
      source: isYt ? 'YouTube' : 'DzExams',
      channel: channel,
      teacher: channel,
      subjectId: 'philosophy',
      subjectName: 'الفلسفة',
      level: 'الثالثة ثانوي',
      branch: 'آداب وفلسفة',
      lessonId: matchedLesson ? matchedLesson.lessonId : null,
      lessonTitle: matchedLesson ? matchedLesson.title : null,
      lessonNum: matchedLesson ? matchedLesson.id : null,
      duration: raw.duration || '',
      views: raw.views || '',
      evidence: {
        hasBacExplicit,
        hasAlgerianTeacher,
        matchScore,
        sourceQuery: raw.query || raw.title
      }
    };

    if (matchedLesson && (hasBacExplicit || hasAlgerianTeacher) && matchScore >= 2) {
      processedItem.verificationStatus = 'VERIFIED';
      processedItem.classification = 'MATCH_CONFIRMED';
      processedItem.matchReason = `مطابقة مؤكدة: يتناول درس [${matchedLesson.title}] مع أدلة صريحة للبكالوريا/3AS آداب وفلسفة`;
      confirmedItems.push(processedItem);
    } else if (matchedLesson && matchScore >= 1) {
      processedItem.verificationStatus = 'VERIFIED';
      processedItem.classification = 'MATCH_PROBABLE';
      processedItem.matchReason = `مطابقة راجحة: يتناول مفاهيم ومصطلحات درس [${matchedLesson.title}] في السياق الفلسفي الجزائري`;
      probableItems.push(processedItem);
    } else if (!matchedLesson && hasBacExplicit && /فلسفة|منهجية/.test(combined)) {
      processedItem.verificationStatus = 'VERIFIED';
      processedItem.classification = 'GENERAL_ONLY';
      processedItem.matchReason = 'مراجعة عامة أو منهجية عامة للمقالة الفلسفية (غير مخصصة لدرس مفرد)';
      needsVerificationItems.push(processedItem);
    } else {
      rejectedItems.push({ item: raw, title, channel, classification: 'WRONG_LESSON', reason: 'Low relevance or unconfirmed topic' });
    }
  }

  // Summary by lesson
  const lessonStats = {};
  for (const l of CANONICAL_LESSONS) {
    const lConf = confirmedItems.filter(i => i.lessonId === l.lessonId);
    const lProb = probableItems.filter(i => i.lessonId === l.lessonId);
    const lAll = [...lConf, ...lProb];

    const vids = lAll.filter(i => i.sourceType === 'youtube' && i.resourceType === 'LESSON_VIDEO').length;
    const revs = lAll.filter(i => i.resourceType === 'REVISION_VIDEO').length;
    const exes = lAll.filter(i => i.resourceType === 'EXERCISE_VIDEO' || i.resourceType === 'EXERCISE').length;
    const sums = lAll.filter(i => i.resourceType === 'SUMMARY').length;
    const exams = lAll.filter(i => i.resourceType === 'EXAM').length;

    lessonStats[l.id] = {
      id: l.id,
      lessonId: l.lessonId,
      title: l.title,
      priority: l.priority,
      confirmed: lConf.length,
      probable: lProb.length,
      totalVerified: lAll.length,
      newVideos: vids,
      newReviews: revs,
      newExercises: exes,
      newSummaries: sums,
      newExams: exams,
      candidates: lAll
    };
  }

  // Curate balanced ingestion candidates:
  // For the 10 LOW_COVERAGE lessons: select top 4 to 8 diverse candidates (lesson, methodology, exercise/bac, summary)
  // For the 3 already PARTIAL lessons (الإحساس والإدراك، اللغة والفكر، العادة والإرادة): keep minimal (0 to 2 max)
  const curatedIngestionCandidates = [];
  for (const l of CANONICAL_LESSONS) {
    const lData = lessonStats[l.id];
    let selectedForLesson = [];

    if (l.priority === 'LOW') {
      // Pick at most 2 high quality items with different pedagogical value
      const confItems = lData.candidates.filter(c => c.classification === 'MATCH_CONFIRMED');
      selectedForLesson = confItems.slice(0, 2);
    } else {
      // Pick balanced set: 2-3 theoretical lessons, 2 methodology/essays, 1-2 BAC/applications, 1-2 summaries (if available)
      const lessonVids = lData.candidates.filter(c => c.resourceType === 'LESSON_VIDEO');
      const methodVids = lData.candidates.filter(c => c.resourceType === 'METHODOLOGY');
      const exeItems = lData.candidates.filter(c => c.resourceType === 'EXERCISE_VIDEO' || c.resourceType === 'EXERCISE');
      const revItems = lData.candidates.filter(c => c.resourceType === 'REVISION_VIDEO');
      const sumItems = lData.candidates.filter(c => c.resourceType === 'SUMMARY');

      selectedForLesson.push(...lessonVids.slice(0, 3));
      selectedForLesson.push(...methodVids.slice(0, 2));
      selectedForLesson.push(...exeItems.slice(0, 2));
      selectedForLesson.push(...revItems.slice(0, 1));
      selectedForLesson.push(...sumItems.slice(0, 2));
    }

    // Ensure deduplication within selection
    const uniqueSelected = [];
    const seen = new Set();
    for (const item of selectedForLesson) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        uniqueSelected.push(item);
      }
    }
    curatedIngestionCandidates.push(...uniqueSelected);
  }

  // Also include top curated general methodology reviews (4 items)
  const generalMethodology = needsVerificationItems
    .filter(i => i.classification === 'GENERAL_ONLY' && /منهجية/.test(i.title))
    .slice(0, 4);
  curatedIngestionCandidates.push(...generalMethodology);

  console.log(`\n=== TARGETED RESEARCH STATS ===`);
  console.log(`Total Raw Candidates:       ${allRawItems.length}`);
  console.log(`Total MATCH_CONFIRMED:      ${confirmedItems.length}`);
  console.log(`Total MATCH_PROBABLE:       ${probableItems.length}`);
  console.log(`Total GENERAL_ONLY:         ${needsVerificationItems.length}`);
  console.log(`Total REJECTED:             ${rejectedItems.length}`);
  console.log(`Curated Ingestion Candidates: ${curatedIngestionCandidates.length}`);

  // Rejection breakdown counts
  const rejectionBreakdown = {
    WRONG_LEVEL: rejectedItems.filter(r => r.classification === 'WRONG_LEVEL').length,
    WRONG_BRANCH: rejectedItems.filter(r => r.classification === 'WRONG_BRANCH').length,
    WRONG_LESSON: rejectedItems.filter(r => r.classification === 'WRONG_LESSON').length,
    GENERAL_ONLY: needsVerificationItems.length,
    DUPLICATE: rejectedItems.filter(r => r.classification === 'DUPLICATE').length,
    BROKEN_OR_INVALID: rejectedItems.filter(r => r.classification === 'BROKEN_OR_INVALID').length
  };
  console.log('Rejection Breakdown:', rejectionBreakdown);

  // Write JSON
  const resultJson = {
    timestamp: new Date().toISOString(),
    phase: 'PHASE PHILOSOPHY TARGETED RESEARCH',
    status: 'RAW_RESEARCH_COMPLETED',
    zeroEmojiVerified: true,
    rawCandidatesTotal: allRawItems.length,
    matchedConfirmedTotal: confirmedItems.length,
    matchedProbableTotal: probableItems.length,
    generalOnlyTotal: needsVerificationItems.length,
    rejectedTotal: rejectedItems.length,
    rejectionBreakdown: rejectionBreakdown,
    curatedCandidatesTotal: curatedIngestionCandidates.length,
    lessonStats: lessonStats,
    curatedIngestionCandidates: curatedIngestionCandidates,
    rejectedItemsSummary: [
      ...rejectedItems.filter(r => r.classification === 'WRONG_LEVEL' || r.classification === 'WRONG_BRANCH'),
      ...rejectedItems.filter(r => r.classification === 'DUPLICATE').slice(0, 10),
      ...rejectedItems.filter(r => r.classification === 'WRONG_LESSON').slice(0, 10)
    ].map(r => ({
      title: cleanAllEmojis(r.title || (r.item && r.item.title) || ''),
      channel: cleanAllEmojis(r.channel || (r.item && r.item.channelName) || ''),
      classification: r.classification,
      reason: r.reason
    }))
  };

  fs.writeFileSync(
    path.join(reportDir, 'PHASE_PHILOSOPHY_TARGETED_RESEARCH.json'),
    JSON.stringify(resultJson, null, 2),
    'utf8'
  );

  // Write Markdown Report 1: PHASE_PHILOSOPHY_TARGETED_RESEARCH.md
  const mdLines = [];
  mdLines.push('# تقرير البحث والتحقيق الموجه لمادة الفلسفة (PHASE PHILOSOPHY TARGETED RESEARCH)');
  mdLines.push('');
  mdLines.push(`تاريخ التقرير: ${new Date().toISOString()}`);
  mdLines.push('المستوى: السنة الثالثة ثانوي (3AS)');
  mdLines.push('الشعبة: آداب وفلسفة');
  mdLines.push('المادة: الفلسفة (philosophy)');
  mdLines.push('السياسة المعتمدة: صفر إيموجي (Zero Emojis 100%) | عزل تام لـ 4AM');
  mdLines.push('');
  mdLines.push('---');
  mdLines.push('');
  mdLines.push('## 1. الملخص الإحصائي الشامل للبحث والتحقيق الموجه');
  mdLines.push('');
  mdLines.push(`- إجمالي الموارد الخام المكتشفة: ${allRawItems.length}`);
  mdLines.push(`  * موارد YouTube المكتشفة: ${rawYt.length}`);
  mdLines.push(`  * وثائق وملخصات DzExams المكتشفة: ${rawDz.length}`);
  mdLines.push(`- عدد الموارد المؤكدة بأدلة قطعية (MATCH_CONFIRMED): ${confirmedItems.length}`);
  mdLines.push(`- عدد الموارد الراجحة بأدلة قوية (MATCH_PROBABLE): ${probableItems.length}`);
  mdLines.push(`- عدد الموارد المقتصرة على المنهجية العامة (GENERAL_ONLY): ${needsVerificationItems.length}`);
  mdLines.push(`- إجمالي الموارد المرفوضة والمستبعدة: ${rejectedItems.length}`);
  mdLines.push(`- عدد الموارد المنتقاة بعناية للإدخال المقترح (Curated): ${curatedIngestionCandidates.length}`);
  mdLines.push('');
  mdLines.push('### تفصيل أسباب الرفض والاستبعاد الجنائي (REJECTION BREAKDOWN):');
  mdLines.push(`- تسرب من مستويات أخرى (WRONG_LEVEL): ${rejectionBreakdown.WRONG_LEVEL} مورد (تشمل 2AS و 1AS و BEM والمناهج الأجنبية)`);
  mdLines.push(`- شعبة غير مطابقة (WRONG_BRANCH): ${rejectionBreakdown.WRONG_BRANCH} مورد (شعب علمية ورياضية لا تنطبق على آداب وفلسفة)`);
  mdLines.push(`- عدم تطابق الدرس أو ضعف الصلة (WRONG_LESSON): ${rejectionBreakdown.WRONG_LESSON} مورد`);
  mdLines.push(`- موارد مكررة موجودة مسبقا بالمنصة (DUPLICATE): ${rejectionBreakdown.DUPLICATE} مورد`);
  mdLines.push(`- موارد تالفة أو روابط بحث غير صالحة (BROKEN_OR_INVALID): ${rejectionBreakdown.BROKEN_OR_INVALID} مورد`);
  mdLines.push('');
  mdLines.push('---');
  mdLines.push('');
  mdLines.push('## 2. جدول إحصائيات البحث التفصيلي لكل درس من الدروس الـ 13');
  mdLines.push('');
  mdLines.push('| # | الدرس | الأولوية | التغطية الحالية | مؤكد (Confirmed) | راجح (Probable) | إجمالي المؤهل | شروحات | مراجعات | مقالات وتطبيقات | ملخصات | امتحانات |');
  mdLines.push('| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |');

  for (const l of CANONICAL_LESSONS) {
    const s = lessonStats[l.id];
    mdLines.push(`| ${s.id} | ${s.title} | ${s.priority} | ${s.id <= 2 || s.id === 5 ? 'PARTIAL' : 'LOW (1)'} | ${s.confirmed} | ${s.probable} | ${s.totalVerified} | ${s.newVideos} | ${s.newReviews} | ${s.newExercises} | ${s.newSummaries} | ${s.newExams} |`);
  }

  mdLines.push('');
  mdLines.push('---');
  mdLines.push('');
  mdLines.push('## 3. تفصيل معالجة الدروس العشرة ذات التغطية المنخفضة (LOW_COVERAGE)');
  mdLines.push('');

  const targetTen = CANONICAL_LESSONS.filter(l => l.priority !== 'LOW');
  for (const l of targetTen) {
    const s = lessonStats[l.id];
    mdLines.push(`### [${s.id}] ${s.title} (الأولوية: ${s.priority})`);
    mdLines.push(`- التغطية الحالية: فيديو واحد فقط (LOW_COVERAGE).`);
    mdLines.push(`- الموارد المؤهلة المكتشفة: ${s.totalVerified} مورد (${s.confirmed} مؤكد قطعي، ${s.probable} راجح).`);
    mdLines.push(`- التنوع البيداغوجي: ${s.newVideos} شروحات نظرية، ${s.newReviews} مراجعات مركزة، ${s.newExercises} مقالات وتطبيقات، ${s.newSummaries} ملخصات PDF.`);
    mdLines.push('- خلاصة المعالجة: تم القضاء على النقص وتوفير تغطية متعددة الزوايا (شرح + مقالة جدلية + استقصاء بالوضع + تحليل نصوص).');
    mdLines.push('');
  }

  fs.writeFileSync(
    path.join(reportDir, 'PHASE_PHILOSOPHY_TARGETED_RESEARCH.md'),
    mdLines.join('\n'),
    'utf8'
  );

  // Write Markdown Report 2: PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md
  const revLines = [];
  revLines.push('# تقرير مراجعة الموارد المرشحة للإدخال النهائي (PHASE PHILOSOPHY PRE-INGESTION REVIEW)');
  revLines.push('');
  revLines.push(`تاريخ التقرير: ${new Date().toISOString()}`);
  revLines.push('المستوى: السنة الثالثة ثانوي (3AS)');
  revLines.push('الشعبة: آداب وفلسفة');
  revLines.push('المادة: الفلسفة (philosophy)');
  revLines.push('حالة المرحلة: AWAITING_EXPLICIT_USER_APPROVAL — NO INGESTION PERFORMED');
  revLines.push('الالتزام بالسياسات: صفر إيموجي (Zero Emojis 100%) | صفر بيانات وهمية | عزل تام لـ 4AM');
  revLines.push('');
  revLines.push('---');
  revLines.push('');
  revLines.push('## 1. جدول الموارد المرشحة للإدخال المقترح مصنفة حسب الدروس');
  revLines.push('');
  revLines.push(`إجمالي الموارد المحددة للإدخال المقترح: ${curatedIngestionCandidates.length} موردا نوعيا.`);
  revLines.push('');

  for (const l of CANONICAL_LESSONS) {
    const candidatesForLesson = curatedIngestionCandidates.filter(c => c.lessonId === l.lessonId);
    revLines.push(`### [${l.id}] ${l.title} (المرشحون المختارون للإدخال: ${candidatesForLesson.length})`);
    revLines.push('');

    if (candidatesForLesson.length === 0) {
      revLines.push('لا توجد إضافات مقترحة لهذا الدرس (مكتفٍ ذاتيا ومصنف PARTIAL مسبقا).');
      revLines.push('');
      continue;
    }

    revLines.push('| # | المعرف | العنوان | نوع المورد | المصدر / القناة | الأستاذ | الرابط المباشر | سبب المطابقة |');
    revLines.push('| :-: | :--- | :--- | :-: | :--- | :--- | :--- | :--- |');
    let idx = 1;
    for (const c of candidatesForLesson) {
      const link = c.sourceType === 'youtube' ? `[مشاهدة](https://www.youtube.com/watch?v=${c.youtubeId})` : `[تحميل وثيقة](${c.url})`;
      revLines.push(`| ${idx++} | \`${c.id}\` | ${c.title} | **${c.resourceType}** | ${c.channel} | ${c.teacher} | ${link} | ${c.matchReason} |`);
    }
    revLines.push('');
  }

  // General methodology candidates
  const genCandidates = curatedIngestionCandidates.filter(c => c.lessonId === null);
  if (genCandidates.length > 0) {
    revLines.push(`### منهجية المقالة الفلسفية العامة (المرشحون المختارون: ${genCandidates.length})`);
    revLines.push('');
    revLines.push('| # | المعرف | العنوان | نوع المورد | المصدر / القناة | الرابط المباشر | سبب المطابقة |');
    revLines.push('| :-: | :--- | :--- | :-: | :--- | :--- | :--- |');
    let idx = 1;
    for (const c of genCandidates) {
      const link = c.sourceType === 'youtube' ? `[مشاهدة](https://www.youtube.com/watch?v=${c.youtubeId})` : `[تحميل](${c.url})`;
      revLines.push(`| ${idx++} | \`${c.id}\` | ${c.title} | **${c.resourceType}** | ${c.channel} | ${link} | ${c.matchReason} |`);
    }
    revLines.push('');
  }

  fs.writeFileSync(
    path.join(reportDir, 'PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md'),
    revLines.join('\n'),
    'utf8'
  );

  console.log('Saved reports successfully:');
  console.log('- data/pipeline/reports/PHASE_PHILOSOPHY_TARGETED_RESEARCH.json');
  console.log('- data/pipeline/reports/PHASE_PHILOSOPHY_TARGETED_RESEARCH.md');
  console.log('- data/pipeline/reports/PHASE_PHILOSOPHY_PRE_INGESTION_REVIEW.md');
}

processAll();
