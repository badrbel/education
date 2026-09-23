/**
 * mordix_ai — PHASE 11: Agent 4 (Revision & Summary Researcher)
 * 
 * Harvests Course Summaries, Revision Booklets, Lesson Summaries,
 * and BEM revision fiches across all 9 official 4AM subjects.
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

function isRevisionOrSummaryTitle(title) {
  const t = title.toLowerCase();

  // Exclude what is purely exams, devoirs, or curriculum admin docs
  const negativePatterns = [
    /اختبارات?\s+الفصل/i,
    /فروض?\s+الفصل/i,
    /التوزيع\s+السنوي/i,
    /المخطط\s+السنوي/i,
    /أولمبياد/i
  ];

  for (const neg of negativePatterns) {
    if (neg.test(t)) return false;
  }

  const positivePatterns = [
    /ملخص/i,
    /ملخصات/i,
    /مراجعة/i,
    /مراجعات/i,
    /مطوية/i,
    /كراس/i,
    /الموجز/i,
    /دليل/i,
    /شامل/i,
    /قواعد/i,
    /خرائط\s+ذهنية/i,
    /بطاقات\s+استذكار/i,
    /حوليات/i,
    /كل\s+ما\s+يخص/i,
    /مفاهيم/i
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

function classifyRevisionType(title) {
  const t = title.toLowerCase();
  if (/ملخص|الموجز|مطوية|خرائط\s+ذهنية/i.test(t)) return 'SUMMARY';
  return 'REVISION';
}

async function harvestDzExamsSummaries(subject) {
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
    if (isRevisionOrSummaryTitle(cleanTitle)) {
      const decodedSlug = decodeDzId(doc.rawId);
      if (decodedSlug) {
        const type = classifyRevisionType(cleanTitle);
        candidates.push({
          candidateId: `rev-${subject.id}-${decodedSlug.substring(0, 12)}`,
          rawId: doc.rawId,
          decodedSlug,
          title: cleanTitle,
          teacher: extractTeacherFromTitle(cleanTitle),
          type,
          subtype: type === 'SUMMARY' ? 'summary_fiche' : 'revision_sheet',
          landingUrl: `https://www.dzexams.com/ar/documents/${decodedSlug}`,
          sourceUrl: `https://www.dzexams.com/ar/documents/${decodedSlug}`,
          sourceType: 'SOURCE_PAGE',
          subjectId: subject.id,
          subjectName: subject.name,
          levelId: '4am',
          level: 'السنة الرابعة متوسط',
          category: type === 'SUMMARY' ? 'course_summary' : 'revision_guide',
          provenance: 'dzexams'
        });
      }
    }
  }

  return candidates;
}

// Harvest competitor offline summaries/revisions
function harvestCompetitorRevisions() {
  const dirs = [
    'C:/Users/mad/Pictures/6525',
    'C:/Users/mad/Pictures/2027'
  ];

  const candidates = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && (f.includes('المراجعات') || f.includes('دروس') || f.includes('undefined')));
    for (const f of files) {
      if (f.includes('المراجعات')) {
        candidates.push({
          candidateId: `comp-rev-arabic-01`,
          title: 'المراجعات النهائية في اللغة العربية 4 متوسط',
          subjectId: 'arabic_4am',
          subjectName: 'اللغة العربية',
          levelId: '4am',
          level: 'السنة الرابعة متوسط',
          type: 'REVISION',
          subtype: 'revision_guide',
          sourceUrl: 'C:/Users/mad/Pictures/6525/' + f,
          sourceType: 'SOURCE_PAGE',
          category: 'revision_guide',
          provenance: 'competitor_dump'
        });
      }
    }
  }
  return candidates;
}

async function runRevisionResearcher() {
  console.log('==================================================');
  console.log('[AGENT 4] 4AM Revision & Summary Researcher Starting...');
  console.log('==================================================');

  const allHarvested = [];

  for (const subject of SUBJECTS) {
    console.log(`Harvesting revisions & summaries for: ${subject.name} (${subject.slug})`);
    const dzItems = await harvestDzExamsSummaries(subject);
    console.log(`  Found ${dzItems.length} revision/summary candidates from DzExams`);
    allHarvested.push(...dzItems);
  }

  const compItems = harvestCompetitorRevisions();
  console.log(`Harvested ${compItems.length} revision candidates from competitor files.`);
  allHarvested.push(...compItems);

  console.log(`Total Revision & Summary candidates harvested: ${allHarvested.length}`);

  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent4_revisions_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(allHarvested, null, 2), 'utf8');
  console.log(`Saved raw revision candidates to: ${outFile}`);

  return allHarvested;
}

if (require.main === module) {
  runRevisionResearcher().catch(err => {
    console.error('Agent 4 Error:', err);
    process.exit(1);
  });
}

module.exports = { runRevisionResearcher };
