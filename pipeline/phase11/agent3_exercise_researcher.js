/**
 * mordix_ai — PHASE 11: Agent 3 (Exercise & Problem Researcher)
 * 
 * Harvests exercise sheets, series, problem sets, and applications
 * across all 9 official 4AM subjects from DzExams and offline competitor files.
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

const SUBJECTS = [
  { id: 'math_4am', slug: 'mathematiques', name: 'الرياضيات' },
  { id: 'arabic_4am', slug: 'arabe', name: 'اللغة العربية' },
  { id: 'physics_4am', slug: 'physique', name: 'العلوم الفيزيائية والتكنولوجيا' },
  { id: 'science_4am', slug: 'sciences-naturelles', name: 'علوم الطبيعة والحياة' },
  { id: 'french_4am', slug: 'francais', name: 'اللغة الفرنسية' },
  { id: 'english_4am', slug: 'anglais', name: 'اللغة الإنجليزية' },
  { id: 'history_geography_4am', slug: 'histoire-geographie', name: 'التاريخ والجغرافيا' },
  { id: 'islamic_4am', slug: 'tarbia-islamia', name: 'التربية الإسلامية' },
  { id: 'civics_4am', slug: 'tarbia-madania', name: 'التربية المدنية' }
];

function decodeDzId(encoded) {
  try {
    const raw = Buffer.from(encoded, 'base64').toString('binary');
    let decoded = '';
    for (let i = 0; i < raw.length; i++) {
      decoded += String.fromCharCode(raw.charCodeAt(i) - 8);
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

function stripEmojis(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fetchUrl(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = 'https://www.dzexams.com' + redirectUrl;
        }
        return resolve(fetchUrl(redirectUrl, maxRedirects - 1));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data, url });
      });
    });
    req.on('error', err => reject(err));
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function isExerciseTitle(title) {
  const t = title.toLowerCase();

  // Negative patterns: strictly exclude what is NOT an exercise
  const negativePatterns = [
    /اختبارات?\s+الفصل/i,
    /فروض?\s+الفصل/i,
    /امتحانات?\s+الفصل/i,
    /شهادة\s+التعليم\s+المتوسط/i,
    /مواضيع\s+شهادة/i,
    /حوليات\s+شهادة/i,
    /مذكرات\s+/i,
    /مذكرة\s+/i,
    /التوزيع\s+السنوي/i,
    /المخطط\s+السنوي/i,
    /كتاب\s+مدرسي/i,
    /الكتاب\s+المدرسي/i,
    /أولمبياد/i
  ];

  for (const neg of negativePatterns) {
    if (neg.test(t) && !/تمارين|سلسلة|تطبيق/i.test(t)) {
      return false;
    }
  }

  // Pure summary/lesson with no exercises
  if (/^درس\s+/i.test(t) || /^دروس\s+/i.test(t) || /^ملخص\s+/i.test(t) || /^الموجز\s+/i.test(t)) {
    if (!/تمارين|تطبيقات|مسائل|سلسلة|مع\s+الحل/i.test(t)) {
      return false;
    }
  }

  // Positive exercise indicators
  const positivePatterns = [
    /تمرين/i,
    /تمارين/i,
    /سلسلة/i,
    /سلاسل/i,
    /تطبيق/i,
    /تطبيقات/i,
    /مسائل/i,
    /مسألة/i,
    /أنشطة\s+تعلمية/i,
    /أوراق\s+عمل/i,
    /وضعية\s+إدماجية/i,
    /وضعيات\s+إدماجية/i,
    /وضعية\s+ادماجية/i,
    /وضعيات\s+ادماجية/i,
    /حلول\s+تمارين/i,
    /سؤال\s+وجواب/i,
    /سؤال\s+مع\s+الحل/i
  ];

  return positivePatterns.some(pos => pos.test(t));
}

function extractTeacherFromTitle(title) {
  const match = title.match(/(?:إعداد\s+الأستاذ(?:ة)?|للأستاذ(?:ة)?|الاستاذ(?:ة)?|الأستاذ(?:ة)?)\s+([^\-]+?)(?:\s*-\s*4\s*متوسط|\s*$)/i);
  if (match) {
    return stripEmojis(match[1].trim());
  }
  return null;
}

function determineExerciseSubtype(title) {
  const t = title.toLowerCase();
  if (/سلسلة|سلاسل/i.test(t)) return 'series';
  if (/أوراق\s+عمل/i.test(t)) return 'worksheet';
  if (/وضعية\s+إدماجية|وضعيات/i.test(t)) return 'problem';
  if (/تطبيق|تطبيقات/i.test(t)) return 'application';
  if (/حل|محلول|مرفق\s+بالحل/i.test(t)) return 'solved_exercise';
  return 'exercise';
}

async function harvestDzExamsExercises(subject) {
  const coursUrl = `https://www.dzexams.com/ar/4am/${subject.slug}/cours`;
  let pageRes;
  try {
    pageRes = await fetchUrl(coursUrl);
  } catch (err) {
    console.error(`Error fetching ${coursUrl}:`, err.message);
    return [];
  }

  if (pageRes.statusCode !== 200) return [];

  const html = pageRes.data;
  const itemRegex = /<a\s+[^>]*data-id="([^"]+)"[^>]*class="[^"]*btn-item-document[^"]*"[^>]*>[\s\S]*?<span\s+class="doc-title">([\s\S]*?)<\/span>[\s\S]*?<\/a>/gi;
  const itemRegexAlt = /<a\s+[^>]*class="[^"]*btn-item-document[^"]*"[^>]*data-id="([^"]+)"[^>]*>[\s\S]*?<span\s+class="doc-title">([\s\S]*?)<\/span>[\s\S]*?<\/a>/gi;

  const foundDocs = [];
  const seenIds = new Set();
  let match;

  while ((match = itemRegex.exec(html)) !== null) {
    const rawId = match[1];
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
    if (!seenIds.has(rawId)) {
      seenIds.add(rawId);
      foundDocs.push({ rawId, rawTitle });
    }
  }

  while ((match = itemRegexAlt.exec(html)) !== null) {
    const rawId = match[1];
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
    if (!seenIds.has(rawId)) {
      seenIds.add(rawId);
      foundDocs.push({ rawId, rawTitle });
    }
  }

  const candidates = [];
  for (const doc of foundDocs) {
    const cleanTitle = stripEmojis(doc.rawTitle);
    if (isExerciseTitle(cleanTitle)) {
      const decodedSlug = decodeDzId(doc.rawId);
      if (decodedSlug) {
        const subtype = determineExerciseSubtype(cleanTitle);
        const hasSolution = subtype === 'solved_exercise' || /مع\s+الحل|محلول|بالحل/i.test(cleanTitle);
        candidates.push({
          candidateId: `ex-${subject.id}-${decodedSlug.substring(0, 12)}`,
          rawId: doc.rawId,
          decodedSlug,
          title: cleanTitle,
          teacher: extractTeacherFromTitle(cleanTitle),
          subtype,
          hasSolution,
          landingUrl: `https://www.dzexams.com/ar/documents/${decodedSlug}`,
          sourceUrl: `https://www.dzexams.com/ar/documents/${decodedSlug}`,
          sourceType: 'SOURCE_PAGE',
          subjectId: subject.id,
          subjectName: subject.name,
          levelId: '4am',
          level: 'السنة الرابعة متوسط',
          type: 'EXERCISE',
          category: 'exercise_series',
          provenance: 'dzexams'
        });
      }
    }
  }

  return candidates;
}

// Harvest offline competitor exercises
function harvestCompetitorExercises() {
  const rawCompPath = path.join(baseDir, 'data/pipeline/raw/competitor_4am_discovery.json');
  if (!fs.existsSync(rawCompPath)) return [];

  const rawData = JSON.parse(fs.readFileSync(rawCompPath, 'utf8'));
  const items = rawData.discoveredItems || [];
  const exerciseItems = [];

  for (const item of items) {
    if (item.resourceType === 'EXERCISE' || /تمرين|تمارين|سلسلة/i.test(item.lessonTitle || '')) {
      exerciseItems.push({
        candidateId: `comp-ex-${item.subjectId}-${exerciseItems.length}`,
        title: stripEmojis(item.lessonTitle || 'تمرين تطبيقي'),
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        levelId: '4am',
        level: 'السنة الرابعة متوسط',
        type: 'EXERCISE',
        subtype: 'application',
        hasSolution: false,
        landingUrl: item.sourceUrl || null,
        sourceUrl: item.sourceUrl || null,
        sourceType: 'SOURCE_PAGE',
        provenance: 'competitor_dump',
        category: 'exercise_series'
      });
    }
  }
  return exerciseItems;
}

async function runExerciseResearcher() {
  console.log('==================================================');
  console.log('[AGENT 3] 4AM Exercise & Series Researcher Starting...');
  console.log('==================================================');

  const allHarvested = [];

  for (const subject of SUBJECTS) {
    console.log(`Harvesting exercises for: ${subject.name} (${subject.slug})`);
    const dzItems = await harvestDzExamsExercises(subject);
    console.log(`  Found ${dzItems.length} exercise candidates from DzExams`);
    allHarvested.push(...dzItems);
  }

  const compItems = harvestCompetitorExercises();
  console.log(`Harvested ${compItems.length} exercise candidates from competitor dumps.`);
  allHarvested.push(...compItems);

  console.log(`Total Exercise candidates harvested: ${allHarvested.length}`);

  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent3_exercises_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(allHarvested, null, 2), 'utf8');
  console.log(`Saved raw exercise candidates to: ${outFile}`);

  return allHarvested;
}

if (require.main === module) {
  runExerciseResearcher().catch(err => {
    console.error('Agent 3 Error:', err);
    process.exit(1);
  });
}

module.exports = { runExerciseResearcher };
