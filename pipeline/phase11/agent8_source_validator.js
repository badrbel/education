/**
 * mordix_ai — PHASE 11: Agent 8 (Source & Link Validator)
 * 
 * Verifies link authenticity, domain reliability, and strict 4AM level isolation.
 * Strictly rejects off-level leakage (3AS/2AS/1AS/3AM/2AM/1AM) and search URLs.
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const rawDir = path.join(baseDir, 'data/pipeline/raw');

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

function isOffLevel(title, context) {
  const combined = `${title || ''} ${context || ''}`;
  return OFF_LEVEL_PATTERNS.some(p => p.test(combined));
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  // Strictly reject search queries
  if (url.includes('results?search_query=') || url.includes('google.com/search')) {
    return false;
  }
  // Check valid protocol
  if (url.startsWith('https://www.youtube.com/watch?v=') || url.startsWith('https://youtu.be/')) {
    const vidId = url.slice(-11);
    return /^[a-zA-Z0-9_-]{11}$/.test(vidId);
  }
  if (url.startsWith('https://www.dzexams.com/')) {
    return true;
  }
  if (url.startsWith('C:/Users/mad/Pictures/') || url.startsWith('C:\\Users\\mad\\Pictures\\')) {
    return true;
  }
  return false;
}

function runSourceValidator() {
  console.log('==================================================');
  console.log('[AGENT 8] 4AM Source & Link Validator Starting...');
  console.log('==================================================');

  const files = [
    'phase11_agent2_exams_raw.json',
    'phase11_agent3_exercises_raw.json',
    'phase11_agent4_revisions_raw.json',
    'phase11_agent5_yt_lessons_raw.json',
    'phase11_agent6_yt_revisions_raw.json',
    'phase11_agent7_yt_exercises_raw.json'
  ];

  let totalLoaded = 0;
  const rawPool = [];

  for (const f of files) {
    const p = path.join(rawDir, f);
    if (fs.existsSync(p)) {
      try {
        const items = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (Array.isArray(items)) {
          totalLoaded += items.length;
          rawPool.push(...items);
        }
      } catch (e) {}
    }
  }

  console.log(`Loaded ${totalLoaded} raw candidates across all categories.`);

  let rejectedSearchUrl = 0;
  let rejectedOffLevel = 0;
  let rejectedInvalidUrl = 0;
  const validated = [];

  for (const item of rawPool) {
    const targetUrl = item.directPdfUrl || item.landingUrl || item.sourceUrl || item.url;

    // 1. Search URL check
    if (targetUrl && (targetUrl.includes('search_query=') || targetUrl.includes('google.com/search'))) {
      rejectedSearchUrl++;
      continue;
    }

    // 2. Off-level leakage check
    if (isOffLevel(item.title, item.queryContext)) {
      rejectedOffLevel++;
      continue;
    }

    // 3. URL validity check
    if (!isValidUrl(targetUrl)) {
      rejectedInvalidUrl++;
      continue;
    }

    validated.push({
      ...item,
      urlValidated: true,
      isolationStatus: 'SAFE_4AM_ONLY'
    });
  }

  console.log(`Source Validation Results:`);
  console.log(`  Passed validation: ${validated.length}`);
  console.log(`  Rejected (Search URLs): ${rejectedSearchUrl}`);
  console.log(`  Rejected (Off-level leakage): ${rejectedOffLevel}`);
  console.log(`  Rejected (Invalid URLs): ${rejectedInvalidUrl}`);

  const outDir = path.join(baseDir, 'data/pipeline/verified');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent8_source_validated.json');
  fs.writeFileSync(outFile, JSON.stringify(validated, null, 2), 'utf8');
  console.log(`Saved source-validated candidates to: ${outFile}`);

  return validated;
}

if (require.main === module) {
  runSourceValidator();
}

module.exports = { runSourceValidator };
