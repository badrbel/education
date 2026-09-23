/**
 * mordix_ai — PHASE 11: Agent 5 (YouTube Lesson Researcher)
 * 
 * Harvests, filters, and prepares Lesson Explanation Videos for 4AM.
 * Evaluates Teacher Quality Profiles and rejects off-level content.
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const cacheDir = path.join(baseDir, 'data/pipeline/cache/youtube');

// Trusted channels & teachers
const TRUSTED_CHANNELS = [
  'المعلم زكرياء',
  'الأستاذ سليم مختارة',
  'الاستاذ سليم مختارة',
  'دار الرياضيات',
  'الأستاذ دقيش علي',
  'الأستاذ نور الدين',
  'الأستاذ طواهرية',
  'الاستاذ بن الصيد داود',
  'الاستاذ حمياني للفيزياء',
  'الأستاذ زوطاط يونس',
  'الأستاذ كمال بوقرة',
  'الأستاذ شابو',
  'الاستاذ شابو',
  'الأستاذ الفايدي للعلوم الطبيعية',
  'الأستاذ بن زينة',
  'محمد أبو شاكر لعبودي للتعليم المتوسط',
  'الأستاذ محمد بوالريش',
  'الأستاذ حسام للغة العربية',
  'الأستاذ يوسف مادن',
  'الأستاذ طاهر محمود',
  'قناة التلميذ المتميز',
  'معلمي تاج الوفاء',
  'الاستاذ الناجح',
  'الأستاذ الناجح',
  'Prof nacer',
  'الأستاذ ڨسوم شعيب',
  'الأستاذ محمود محمد',
  'شرح دروسي',
  'Teacher Oussama',
  'Mrs.samiya',
  'الانجليزية مع فتح الله',
  'Sadeg cours',
  'Amira English',
  'حميدوش للإنجليزية',
  'English with Nacira',
  'Francais Facile Algerie',
  'الأستاذ أبو بكر مبروك',
  'الأستاذة سيلار',
  'الأستاذ معمري عطاالله'
];

const OFF_LEVEL_PATTERNS = [
  /\b3as\b/i,
  /\b2as\b/i,
  /\b1as\b/i,
  /ثالثة ثانوي/,
  /ثانية ثانوي/,
  /أولى ثانوي/,
  /اولى ثانوي/,
  /بكالوريا/,
  /\bbac\b/i,
  /جامعة/,
  /السنة الأولى متوسط/,
  /السنة الثانية متوسط/,
  /السنة الثالثة متوسط/,
  /\b1am\b/i,
  /\b2am\b/i,
  /\b3am\b/i
];

function isOffLevel(title, query) {
  const text = `${title} ${query}`;
  return OFF_LEVEL_PATTERNS.some(p => p.test(text));
}

function stripEmojis(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLessonVideo(title) {
  const t = title.toLowerCase();
  // Exclude what is purely exercises or revisions
  if (/حل\s+تمرين|حلول\s+تمارين|تمارين|سلسلة|فرض|اختبار|مراجعة\s+شاملة/i.test(t)) {
    return false;
  }
  return /درس|شرح|مفهوم|ملخص\s+درس|المقطع/i.test(t) || /4\s*متوسط|رابعة\s*متوسط|bem/i.test(t);
}

function evaluateTeacherQuality(channelName) {
  if (!channelName) return { trusted: false, score: 0.5 };
  const clean = channelName.trim();
  const found = TRUSTED_CHANNELS.some(tc => clean.includes(tc) || tc.includes(clean));
  return {
    trusted: found,
    score: found ? 0.95 : 0.7
  };
}

async function runYTLessonResearcher() {
  console.log('==================================================');
  console.log('[AGENT 5] YouTube 4AM Lesson Explanation Researcher');
  console.log('==================================================');

  const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
  const candidates = [];
  const seenIds = new Set();

  for (const f of files) {
    try {
      const items = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
      if (!Array.isArray(items)) continue;

      for (const it of items) {
        if (!it.videoId || seenIds.has(it.videoId)) continue;

        const cleanTitle = stripEmojis(it.title || '');
        if (!cleanTitle || isOffLevel(cleanTitle, it.query || '')) continue;

        if (isLessonVideo(cleanTitle)) {
          seenIds.add(it.videoId);
          const tq = evaluateTeacherQuality(it.channelName);

          candidates.push({
            candidateId: `yt-lesson-${it.videoId}`,
            videoId: it.videoId,
            title: cleanTitle,
            channelName: stripEmojis(it.channelName || ''),
            channelId: it.channelId || null,
            duration: it.duration || null,
            url: `https://www.youtube.com/watch?v=https://www.youtube.com/watch?v=${it.videoId}`.replace('https://www.youtube.com/watch?v=https://www.youtube.com/watch?v=', 'https://www.youtube.com/watch?v='),
            sourceUrl: `https://www.youtube.com/watch?v=${it.videoId}`,
            sourceType: 'DIRECT_RESOURCE',
            type: 'LESSON_VIDEO',
            category: 'video_lesson',
            levelId: '4am',
            level: 'السنة الرابعة متوسط',
            queryContext: it.query || '',
            teacherScore: tq.score,
            isTrustedTeacher: tq.trusted,
            provenance: 'youtube_cache'
          });
        }
      }
    } catch (e) {}
  }

  console.log(`Discovered ${candidates.length} Lesson Explanation video candidates.`);

  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent5_yt_lessons_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(candidates, null, 2), 'utf8');
  console.log(`Saved raw YouTube lesson candidates to: ${outFile}`);

  return candidates;
}

if (require.main === module) {
  runYTLessonResearcher().catch(err => {
    console.error('Agent 5 Error:', err);
    process.exit(1);
  });
}

module.exports = { runYTLessonResearcher };
