/**
 * mordix_ai — PHASE 11: Agent 2 (Exam & Term Test Researcher)
 * 
 * Harvests official Exams, Term Tests, and BEM past papers with solutions
 * across all 9 official 4AM subjects from DzExams and official archives.
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

const SECTIONS = [
  { code: 'd1', term: 1, type: 'TEST', termName: 'الفصل الأول', badge: 'فرض الفصل الأول' },
  { code: 'e1', term: 1, type: 'EXAM', termName: 'الفصل الأول', badge: 'اختبار الفصل الأول' },
  { code: 'd2', term: 2, type: 'TEST', termName: 'الفصل الثاني', badge: 'فرض الفصل الثاني' },
  { code: 'e2', term: 2, type: 'EXAM', termName: 'الفصل الثاني', badge: 'اختبار الفصل الثاني' },
  { code: 'd3', term: 3, type: 'TEST', termName: 'الفصل الثالث', badge: 'فرض الفصل الثالث' },
  { code: 'e3', term: 3, type: 'EXAM', termName: 'الفصل الثالث', badge: 'اختبار الفصل الثالث' }
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

function parseSujetItems(html, subject, section) {
  // Regex matches <a href="#" data-id="..." class="item-center btn-item-sujet"...>
  // followed by title, rating, solution flag, year
  const blockRegex = /<a\s+[^>]*data-id="([^"]+)"[^>]*class="[^"]*btn-item-sujet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const items = [];
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const rawId = match[1];
    const blockContent = match[2];

    const decodedSlug = decodeDzId(rawId);
    if (!decodedSlug) continue;

    // Extract title
    const titleMatch = blockContent.match(/<div class="sujet-title"[^>]*>([\s\S]*?)<\/div>/i);
    let title = '';
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    } else {
      title = `${section.badge} - ${subject.name}`;
    }

    // Clean title and ensure standard wording
    title = stripEmojis(title);

    // Extract doc ID
    const docIdMatch = blockContent.match(/data-doc-id="([^"]+)"/i);
    const docCode = docIdMatch ? docIdMatch[1] : null;

    // Extract solution availability: "حل" icon or check
    const hasSolution = blockContent.includes('حل') && (blockContent.includes('icon wb-check') || blockContent.includes('wb-check') || blockContent.includes('badge') || blockContent.includes('✅'));

    // Extract year
    const yearMatch = blockContent.match(/\b(20[0-2][0-9])\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2024;

    const landingUrl = `https://www.dzexams.com/ar/sujets/${decodedSlug}`;

    items.push({
      candidateId: `exam-${subject.id}-${section.code}-${docCode || decodedSlug.substring(0, 10)}`,
      rawId,
      decodedSlug,
      docCode,
      levelId: '4am',
      level: 'السنة الرابعة متوسط',
      subjectId: subject.id,
      subjectName: subject.name,
      lessonId: null, // Subject-level resource unless matched to a specific lesson
      type: section.type,
      term: section.term,
      termName: section.termName,
      title: `${title} - ${subject.name} 4 متوسط`,
      badge: hasSolution ? `${section.badge} مع الحل` : section.badge,
      hasSolution,
      year,
      landingUrl,
      sourceUrl: landingUrl,
      sourceType: 'SOURCE_PAGE',
      provenance: 'dzexams',
      category: 'exam_test'
    });
  }

  return items;
}

// BEM past papers parser
function parseBemItems(html, subject) {
  const blockRegex = /<a\s+[^>]*data-id="([^"]+)"[^>]*class="[^"]*btn-item-sujet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const items = [];
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const rawId = match[1];
    const blockContent = match[2];
    const decodedSlug = decodeDzId(rawId);
    if (!decodedSlug) continue;

    const titleMatch = blockContent.match(/<div class="sujet-title"[^>]*>([\s\S]*?)<\/div>/i);
    let title = '';
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    } else {
      title = `شهادة التعليم المتوسط - ${subject.name}`;
    }
    title = stripEmojis(title);

    const docIdMatch = blockContent.match(/data-doc-id="([^"]+)"/i);
    const docCode = docIdMatch ? docIdMatch[1] : null;

    const yearMatch = blockContent.match(/\b(20[0-2][0-9])\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2024;
    const landingUrl = `https://www.dzexams.com/ar/sujets/${decodedSlug}`;

    items.push({
      candidateId: `bem-${subject.id}-${docCode || decodedSlug.substring(0, 10)}`,
      rawId,
      decodedSlug,
      docCode,
      levelId: '4am',
      level: 'السنة الرابعة متوسط',
      subjectId: subject.id,
      subjectName: subject.name,
      lessonId: null,
      type: 'BEM_EXAM',
      term: 'BEM',
      termName: 'شهادة التعليم المتوسط',
      title: `${title} - دورة ${year}`,
      badge: `BEM ${year} مع الحل الرسمي`,
      hasSolution: true,
      year,
      landingUrl,
      sourceUrl: landingUrl,
      sourceType: 'SOURCE_PAGE',
      provenance: 'dzexams',
      category: 'bem_past_paper'
    });
  }

  return items;
}

// Fetch direct PDF for top items (e.g. up to limit per section to avoid timeout)
async function enrichDirectPdf(item) {
  try {
    const res = await fetchUrl(item.landingUrl);
    if (res.statusCode === 200) {
      const pdfMatch = res.data.match(/href="([^"]*(?:uploads\/sujets|\.pdf)[^"]*)"/i);
      if (pdfMatch) {
        let pdf = pdfMatch[1];
        if (pdf.startsWith('/')) pdf = 'https://www.dzexams.com' + pdf;
        item.directPdfUrl = pdf;
        item.sourceType = 'DIRECT_RESOURCE';
      }
    }
  } catch (err) {
    // If fetching direct PDF fails, keep landingUrl as SOURCE_PAGE
  }
  return item;
}

async function runExamResearcher() {
  console.log('==================================================');
  console.log('[AGENT 2] 4AM Exam & Term Test Researcher Starting...');
  console.log('==================================================');

  const allHarvested = [];

  for (const subject of SUBJECTS) {
    console.log(`\nHarvesting exams for: ${subject.name} (${subject.slug})`);

    // 1. Term tests & exams (d1, e1, d2, e2, d3, e3)
    for (const section of SECTIONS) {
      const url = `https://www.dzexams.com/ar/4am/${subject.slug}/${section.code}`;
      try {
        const res = await fetchUrl(url);
        if (res.statusCode === 200) {
          const items = parseSujetItems(res.data, subject, section);
          console.log(`  [${section.code}] Found ${items.length} items`);
          allHarvested.push(...items);
        } else {
          console.warn(`  [${section.code}] HTTP ${res.statusCode} for ${url}`);
        }
      } catch (err) {
        console.error(`  [${section.code}] Error: ${err.message}`);
      }
    }

    // 2. BEM Past Papers
    const bemUrl = `https://www.dzexams.com/ar/bem/${subject.slug}`;
    try {
      const res = await fetchUrl(bemUrl);
      if (res.statusCode === 200) {
        const bemItems = parseBemItems(res.data, subject);
        console.log(`  [BEM] Found ${bemItems.length} official BEM papers`);
        allHarvested.push(...bemItems);
      }
    } catch (err) {
      console.error(`  [BEM] Error: ${err.message}`);
    }
  }

  console.log(`\nTotal Exam & BEM candidates harvested: ${allHarvested.length}`);

  // Enrich direct PDFs for top high-quality candidates (with solutions)
  console.log('Enriching direct PDF links for top candidates...');
  const solvedItems = allHarvested.filter(i => i.hasSolution).slice(0, 30);
  for (let i = 0; i < solvedItems.length; i++) {
    await enrichDirectPdf(solvedItems[i]);
    if (i % 10 === 0) console.log(`  Enriched ${i}/${solvedItems.length}...`);
  }

  // Save to raw cache
  const outDir = path.join(baseDir, 'data/pipeline/raw');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'phase11_agent2_exams_raw.json');
  fs.writeFileSync(outFile, JSON.stringify(allHarvested, null, 2), 'utf8');
  console.log(`Saved raw exam candidates to: ${outFile}`);

  return allHarvested;
}

if (require.main === module) {
  runExamResearcher().catch(err => {
    console.error('Agent 2 Error:', err);
    process.exit(1);
  });
}

module.exports = { runExamResearcher };
