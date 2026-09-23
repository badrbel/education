/**
 * mordix_ai — PHASE 11: Agent 6 (YouTube Revision Researcher)
 * 
 * Harvests, filters, and classifies YouTube Revision Videos for 4AM:
 * Distinguishes LESSON_REVISION vs SUBJECT_REVISION vs BEM_REVISION.
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

function classifyRevisionScope(title) {
  const t = title.toLowerCase();
  if (/bem|شهادة\s+التعليم\s+المتوسط|البيام|بيام/i.test(t)) {
    return 'BEM_REVISION';
  }
  if (/مراجعة\s+شاملة\s+للفصل|مراجعة\s+الفصل|ملخص\s+شامل|المراجعة\s+الشاملة|كل\s+قواعد/i.test(t)) {
    return 'SUBJECT_REVISION';
  }
  return 'LESSON_REVISION';
}

function isRevisionVideo(title) {
  const t = title.toLowerCase();
  return /مراجعة|مراجعات|ملخص\s+شامل|المراجعة\s+النهائية|كل\s+ما\s+تحتاجه|مراجعة\s+ليلة\s+الامتحان/i.test(t);
}

async function runYTRevisionResearcher() {
  console.log('==================================================');
  console.log('[AGENT 6] YouTube 4AM Revision Researcher Starting...');
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

        if (isRevisionVideo(cleanTitle)) {
          seenIds.add(it.videoId);
          const scope = classifyRevisionScope(cleanTitle);

          candidates.push({
            candidateId: `yt-rev-${it.videoId}`,
            videoId: it.videoId,
            title: cleanTitle,
            channelName: stripEmojis(it.channelName || ''),
            channelId: it.channelId || null,
            duration: it.duration || null,
            url: `https://www.youtube.com/watch?v=${it.videoId}`,
            sourceUrl: `https://www.youtube.com/watch?v=${it.videoId}`,
            sourceType: 'DIRECT_RESOURCE',
            type: 'REVISION_VIDEO',
            revisionScope: scope,
            badge: scope === 'BEM_REVISION' ? 'مراجعة نهائية BEM' : (scope === 'SUBJECT_REVISION' ? 'مراجعة شاملة' : 'مراجعة مركزة'),
            category: 'video_revision',
            levelId: '4am',
            level: 'السنة الرابعة متوسط',
            queryContext: it.query || '',
            provenance: 'youtube_cache'
          });
        }
      }
    } catch (e) {}
  }

  console.log(`Discovered ${candidates.length} Revision video candidates.`);

  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent6_yt_revisions_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(candidates, null, 2), 'utf8');
  console.log(`Saved raw YouTube revision candidates to: ${outFile}`);

  return candidates;
}

if (require.main === module) {
  runYTRevisionResearcher().catch(err => {
    console.error('Agent 6 Error:', err);
    process.exit(1);
  });
}

module.exports = { runYTRevisionResearcher };
