/**
 * mordix_ai — Targeted 3AS AF Educational Resource Discovery Engine
 * Phase AF-Enrichment — Zero Fake Data, Zero Emojis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const cacheDir = path.join(baseDir, 'data/pipeline/cache/youtube');
const rawDir = path.join(baseDir, 'data/pipeline/af_enrichment/raw');

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

let cookieJar = 'SOCS=CAESEwgDEgk2ODE4MTQzMzAaAmFyIAEaBgiA_LyaBg; CONSENT=YES+cb; YSC=test; GPS=1;';

function updateCookieJar(setCookies) {
  if (!setCookies || !Array.isArray(setCookies)) return;
  const jarMap = new Map();
  cookieJar.split('; ').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) jarMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  });
  setCookies.forEach(sc => {
    const clean = sc.split(';')[0];
    const idx = clean.indexOf('=');
    if (idx > 0) jarMap.set(clean.slice(0, idx).trim(), clean.slice(idx + 1).trim());
  });
  cookieJar = Array.from(jarMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

function fetchUrlWithRedirects(targetUrl, maxRedirects = 3) {
  return new Promise((resolve) => {
    if (maxRedirects <= 0) return resolve({ statusCode: 500, html: '' });

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cookie': cookieJar
      }
    };

    https.get(targetUrl, options, (res) => {
      if (res.headers['set-cookie']) {
        updateCookieJar(res.headers['set-cookie']);
      }

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `https://www.youtube.com${redirectUrl}`;
        }
        return resolve(fetchUrlWithRedirects(redirectUrl, maxRedirects - 1));
      }

      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, html }));
    }).on('error', () => resolve({ statusCode: 500, html: '' }));
  });
}

async function fetchYouTubeSearch(query) {
  const hash = crypto.createHash('md5').update(query).digest('hex');
  const cacheFile = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        return cachedData;
      }
    } catch (e) {}
  }

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  let res = await fetchUrlWithRedirects(url);
  if (res.statusCode !== 200 || !res.html.includes('ytInitialData')) {
    await new Promise(r => setTimeout(r, 400));
    res = await fetchUrlWithRedirects(url);
  }

  if (res.statusCode !== 200) return [];

  const match = res.html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
                res.html.match(/var\s+ytInitialData\s*=\s*({.+?});/s);
  if (!match) return [];

  try {
    const json = JSON.parse(match[1]);
    const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const videos = [];

    function extract(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.videoRenderer) {
        const vr = obj.videoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.map(r => r.text).join('') || vr.title?.simpleText || '';
        const channelName = vr.ownerText?.runs?.map(r => r.text).join('') || '';
        const duration = vr.lengthText?.simpleText || '';
        const viewCountText = vr.viewCountText?.simpleText || '';
        const descriptionSnippet = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || '';

        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          videos.push({
            videoId,
            title,
            channelName,
            duration,
            views: viewCountText,
            descriptionSnippet,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }
      for (const key of Object.keys(obj)) {
        extract(obj[key]);
      }
    }

    if (Array.isArray(contents)) {
      contents.forEach(c => extract(c));
    }

    fs.writeFileSync(cacheFile, JSON.stringify(videos, null, 2), 'utf8');
    return videos;
  } catch (err) {
    return [];
  }
}

// Queries planned for Phase AF-Enrichment
const SEARCH_TARGETS = [
  // 1. Abu Bakr Mabrouk (Arabic 3AS)
  {
    category: 'ABU_BAKR_MABROUK',
    subject: 'arabic',
    queries: [
      'الأستاذ بوبكر مبروك اللغة العربية بكالوريا',
      'الأستاذ أبو بكر مبروك بكالوريا آداب وفلسفة',
      'الأستاذ بوبكر مبروك البناء الفكري بكالوريا',
      'الأستاذ بوبكر مبروك الإعراب التقديري بكالوريا',
      'الأستاذ بوبكر مبروك البدل وعطف النسق بكالوريا'
    ]
  },
  // 2. Atiya Souissi (Arabic 3AS)
  {
    category: 'ATIYA_SOUISSI',
    subject: 'arabic',
    queries: [
      'الأستاذ عطية سويسي بكالوريا آداب وفلسفة',
      'الأستاذ عطية سويسي قواعد اللغة العربية بكالوريا',
      'الأستاذ عطية سويسي البناء اللغوي بكالوريا',
      'الأستاذ عطية سويسي معاني وإعراب إذا وإذ وإذن بكالوريا'
    ]
  },
  // 3. Geographical Terms (3AS BAC)
  {
    category: 'GEOGRAPHICAL_TERMS',
    subject: 'history',
    queries: [
      'مصطلحات الجغرافيا كاملة بكالوريا جميع الشعب',
      'مصطلحات الوحدة الأولى جغرافيا بكالوريا التقدم والتخلف',
      'مصطلحات الوحدة الثانية جغرافيا بكالوريا القوى الاقتصادية',
      'مصطلحات الجغرافيا الأستاذ بورنان بكالوريا',
      'مصطلحات الجغرافيا الأستاذ قنشوبة بكالوريا'
    ]
  },
  // 4. Historical Figures (3AS BAC)
  {
    category: 'HISTORICAL_FIGURES',
    subject: 'history',
    queries: [
      'شخصيات التاريخ كاملة بكالوريا آداب وفلسفة',
      'شخصيات الحرب الباردة بكالوريا الأستاذ بورنان',
      'شخصيات الثورة التحريرية الجزائرية بكالوريا',
      'شخصيات التاريخ الأستاذ قنشوبة بكالوريا'
    ]
  },
  // 5. English Missing Lessons (Quantifiers, Syllables)
  {
    category: 'MISSING_LESSONS_ENGLISH',
    subject: 'english',
    queries: [
      'Quantifiers 3AS BAC baccalaureate English',
      'Quantifiers درس الإنجليزية بكالوريا',
      'Syllables counting syllables 3AS BAC English',
      'عدد المقاطع الصوتية syllables بكالوريا انجليزية'
    ]
  },
  // 6. Philosophy Core Revisions & Summaries
  {
    category: 'PHILOSOPHY_REVISION',
    subject: 'philosophy',
    queries: [
      'مراجعة شاملة في الفلسفة بكالوريا آداب وفلسفة',
      'مقالات الفلسفة المتوقعة بكالوريا آداب وفلسفة',
      'الأستاذ خليل سعيداني فلسفة آداب وفلسفة بكالوريا',
      'منهجية كتابة مقالة فلسفية بكالوريا آداب وفلسفة'
    ]
  }
];

async function runDiscovery() {
  console.log('=== STARTING TARGETED 3AS AF EDUCATIONAL HARVESTING ===');
  const allHarvested = [];

  for (const target of SEARCH_TARGETS) {
    console.log(`\n--- Harvesting Category: ${target.category} (Subject: ${target.subject}) ---`);
    for (const q of target.queries) {
      console.log(`Searching: "${q}"...`);
      const results = await fetchYouTubeSearch(q);
      console.log(`Found ${results.length} raw video candidates.`);
      for (const item of results) {
        allHarvested.push({
          ...item,
          harvestCategory: target.category,
          harvestSubject: target.subject,
          query: q,
          harvestDate: new Date().toISOString()
        });
      }
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const rawOutPath = path.join(rawDir, 'raw_candidates.json');
  fs.writeFileSync(rawOutPath, JSON.stringify(allHarvested, null, 2), 'utf8');
  console.log(`\n[SUCCESS] Total raw candidates harvested: ${allHarvested.length}`);
  console.log(`Saved to: ${rawOutPath}`);
}

runDiscovery();
