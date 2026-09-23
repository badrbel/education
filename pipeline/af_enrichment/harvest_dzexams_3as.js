/**
 * mordix_ai — DzExams 3AS Educational Documents Harvester
 * Harvests real summaries, terms, figures, exercises from DzExams 3AS cours pages
 * Phase AF-Enrichment — Zero Fake Data, Zero Emojis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const baseDir = path.resolve(__dirname, '../..');
const rawDir = path.join(baseDir, 'data/pipeline/af_enrichment/raw');

const SUBJECT_SLUGS = [
  { subjectId: 'history', subjectName: 'التاريخ والجغرافيا', slug: 'histoire-geographie' },
  { subjectId: 'arabic', subjectName: 'اللغة العربية', slug: 'arabe' },
  { subjectId: 'philosophy', subjectName: 'الفلسفة', slug: 'philosophie' },
  { subjectId: 'islamic', subjectName: 'العلوم الإسلامية', slug: 'tarbia-islamia' },
  { subjectId: 'english', subjectName: 'اللغة الإنجليزية', slug: 'anglais' },
  { subjectId: 'french', subjectName: 'اللغة الفرنسية', slug: 'francais' },
  { subjectId: 'math', subjectName: 'الرياضيات', slug: 'mathematiques' }
];

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
  }
};

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, html: d }));
    }).on('error', err => resolve({ statusCode: 500, html: '', error: err.message }));
  });
}

async function harvestAll() {
  console.log('=== HARVESTING DZEXAMS 3AS EDUCATIONAL DOCUMENTS ===');
  const allDocs = [];

  for (const s of SUBJECT_SLUGS) {
    const url = `https://www.dzexams.com/ar/3as/${s.slug}/cours`;
    console.log(`\nFetching ${s.subjectName} from: ${url}...`);
    const res = await fetchPage(url);
    if (res.statusCode !== 200 || !res.html) {
      console.log(`Failed or not found (Status: ${res.statusCode})`);
      continue;
    }

    const docRegex = /data-id="([^"]+)"[\s\S]*?<span class="doc-title">\s*([^<]+)<\/span>/g;
    let match;
    let sCount = 0;
    while ((match = docRegex.exec(res.html)) !== null) {
      const dataId = match[1];
      const title = match[2].trim().replace(/\s+/g, ' ');
      sCount++;
      allDocs.push({
        source: 'dzexams',
        sourceUrl: `https://www.dzexams.com/ar/documents/${encodeURIComponent(dataId)}`,
        dataId,
        title,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        level: '3as',
        branch: 'آداب وفلسفة',
        format: 'pdf',
        harvestDate: new Date().toISOString()
      });
    }
    console.log(`Extracted ${sCount} documents for ${s.subjectName}.`);
    await new Promise(r => setTimeout(r, 500));
  }

  const outPath = path.join(rawDir, 'raw_dzexams_documents.json');
  fs.writeFileSync(outPath, JSON.stringify(allDocs, null, 2), 'utf8');
  console.log(`\n[SUCCESS] Total DzExams documents harvested: ${allDocs.length}`);
  console.log(`Saved to: ${outPath}`);
}

harvestAll();
