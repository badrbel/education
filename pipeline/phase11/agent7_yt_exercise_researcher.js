/**
 * mordix_ai — PHASE 11: Agent 7 (YouTube Exercise Researcher)
 * 
 * Harvests, filters, and prepares Exercise Solution Videos for 4AM.
 * Evaluates Problem/Solution indicators and rejects off-level content.
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const cacheDir = path.join(baseDir, 'data/pipeline/cache/youtube');

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

function isExerciseVideo(title) {
  const t = title.toLowerCase();
  return /حل\s+تمرين|حلول\s+تمارين|حل\s+سلسلة|تمارين\s+حول|تطبيق|تطبيقات|حل\s+وضعية|مسألة|تمرين\s+رائع|تمرين\s+مقترح/i.test(t);
}

async function runYTExerciseResearcher() {
  console.log('==================================================');
  console.log('[AGENT 7] YouTube 4AM Exercise Solution Researcher Starting...');
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

        if (isExerciseVideo(cleanTitle)) {
          seenIds.add(it.videoId);

          candidates.push({
            candidateId: `yt-ex-${it.videoId}`,
            videoId: it.videoId,
            title: cleanTitle,
            channelName: stripEmojis(it.channelName || ''),
            channelId: it.channelId || null,
            duration: it.duration || null,
            url: `https://www.youtube.com/watch?v=${it.videoId}`,
            sourceUrl: `https://www.youtube.com/watch?v=${it.videoId}`,
            sourceType: 'DIRECT_RESOURCE',
            type: 'EXERCISE_VIDEO',
            badge: 'حل تمرين بالفيديو',
            category: 'video_exercise',
            levelId: '4am',
            level: 'السنة الرابعة متوسط',
            queryContext: it.query || '',
            hasSolution: true,
            provenance: 'youtube_cache'
          });
        }
      }
    } catch (e) {}
  }

  console.log(`Discovered ${candidates.length} Exercise Solution video candidates.`);

  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent7_yt_exercises_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(candidates, null, 2), 'utf8');
  console.log(`Saved raw YouTube exercise candidates to: ${outFile}`);

  return candidates;
}

if (require.main === module) {
  runYTExerciseResearcher().catch(err => {
    console.error('Agent 7 Error:', err);
    process.exit(1);
  });
}

module.exports = { runYTExerciseResearcher };
