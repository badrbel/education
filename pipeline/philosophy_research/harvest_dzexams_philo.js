/**
 * mordix_ai — DzExams 3AS Philosophy Harvester
 * Harvests authentic PDF summaries, essay topics, and BAC models for Philosophy
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const baseDir = path.resolve(__dirname, '../..');
const outDir = path.join(baseDir, 'data/pipeline/philosophy_research/raw');

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

const PAGES = [
  { url: 'https://www.dzexams.com/ar/3as/philosophie/cours', type: 'summary' },
  { url: 'https://www.dzexams.com/ar/3as/philosophie/exercices', type: 'exercise' },
  { url: 'https://www.dzexams.com/ar/3as/philosophie/sujets', type: 'exam' }
];

async function harvest() {
  console.log('=== HARVESTING DZEXAMS 3AS PHILOSOPHY ===');
  const allDocs = [];

  for (const p of PAGES) {
    console.log(`Fetching: ${p.url}...`);
    const res = await fetchPage(p.url);
    if (res.statusCode !== 200 || !res.html) {
      console.log(`Status ${res.statusCode}`);
      continue;
    }

    const docRegex = /data-id="([^"]+)"[\s\S]*?<span class="doc-title">\s*([^<]+)<\/span>/g;
    let match;
    let count = 0;
    while ((match = docRegex.exec(res.html)) !== null) {
      const dataId = match[1];
      const title = match[2].trim().replace(/\s+/g, ' ');
      allDocs.push({
        source: 'dzexams',
        dataId: dataId,
        title: title,
        type: p.type,
        url: `https://www.dzexams.com/ar/3as/document/${dataId}`,
        downloadUrl: `https://www.dzexams.com/ar/telecharger/${dataId}`,
        subjectId: 'philosophy',
        subjectName: 'الفلسفة'
      });
      count++;
    }
    console.log(`Found ${count} documents for ${p.type}`);
  }

  console.log(`Total Philosophy documents harvested: ${allDocs.length}`);
  fs.writeFileSync(
    path.join(outDir, 'raw_dzexams_philosophy.json'),
    JSON.stringify(allDocs, null, 2),
    'utf8'
  );
}

harvest();
