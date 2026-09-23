/**
 * mordix_ai — BEM Exam Solutions Harvesting Engine
 * Harvests authentic YouTube solutions for official BEM exams across all 9 subjects
 * Zero Fake Data, Zero Search URLs, Zero Emojis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const cacheDir = path.join(baseDir, 'data/pipeline/cache/youtube_bem');
const rawDir = path.join(baseDir, 'data/pipeline/raw');

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
    await new Promise(r => setTimeout(r, 500));
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

// Target Official BEM subjects configuration
const BEM_TARGETS = [
  {
    subjectId: 'math_4am',
    subjectName: 'الرياضيات',
    resourceId: '4am-bem-math',
    queries: [
      'حل شهادة التعليم المتوسط 2024 رياضيات',
      'تصحيح موضوع الرياضيات BEM 2024',
      'حل امتحان شهادة التعليم المتوسط 2023 رياضيات',
      'تصحيح بيام 2024 رياضيات رسمي'
    ]
  },
  {
    subjectId: 'arabic_4am',
    subjectName: 'اللغة العربية',
    resourceId: '4am-bem-arabic',
    queries: [
      'حل شهادة التعليم المتوسط 2024 لغة عربية',
      'تصحيح موضوع اللغة العربية BEM 2024',
      'حل موضوع اللغة العربية بيام 2024',
      'حل شهادة التعليم المتوسط 2023 لغة عربية'
    ]
  },
  {
    subjectId: 'physics_4am',
    subjectName: 'العلوم الفيزيائية والتكنولوجيا',
    resourceId: '4am-bem-physics',
    queries: [
      'حل شهادة التعليم المتوسط 2024 فيزياء',
      'تصحيح موضوع العلوم الفيزيائية BEM 2024',
      'تصحيح بيام 2024 فيزياء شهادة التعليم المتوسط',
      'حل شهادة التعليم المتوسط 2023 فيزياء'
    ]
  },
  {
    subjectId: 'science_4am',
    subjectName: 'علوم الطبيعة والحياة',
    resourceId: '4am-bem-science',
    queries: [
      'حل شهادة التعليم المتوسط 2024 علوم طبيعية',
      'تصحيح موضوع علوم الطبيعة والحياة BEM 2024',
      'تصحيح بيام 2024 علوم طبيعية شهادة التعليم المتوسط',
      'حل شهادة التعليم المتوسط 2023 علوم طبيعية'
    ]
  },
  {
    subjectId: 'french_4am',
    subjectName: 'اللغة الفرنسية',
    resourceId: '4am-bem-french',
    queries: [
      'حل شهادة التعليم المتوسط 2024 فرنسية',
      'correction BEM 2024 français',
      'تصحيح موضوع الفرنسية BEM 2024',
      'حل شهادة التعليم المتوسط 2023 فرنسية'
    ]
  },
  {
    subjectId: 'english_4am',
    subjectName: 'اللغة الإنجليزية',
    resourceId: '4am-bem-english',
    queries: [
      'حل شهادة التعليم المتوسط 2024 إنجليزية',
      'correction BEM 2024 english',
      'تصحيح موضوع الإنجليزية BEM 2024',
      'حل شهادة التعليم المتوسط 2023 إنجليزية'
    ]
  },
  {
    subjectId: 'history_geography_4am',
    subjectName: 'التاريخ والجغرافيا',
    resourceId: '4am-bem-history',
    queries: [
      'حل شهادة التعليم المتوسط 2024 تاريخ وجغرافيا',
      'تصحيح موضوع التاريخ والجغرافيا BEM 2024',
      'حل شهادة التعليم المتوسط 2024 اجتماعيات',
      'حل شهادة التعليم المتوسط 2023 تاريخ وجغرافيا'
    ]
  },
  {
    subjectId: 'islamic_4am',
    subjectName: 'التربية الإسلامية',
    resourceId: '4am-bem-islamic',
    queries: [
      'حل شهادة التعليم المتوسط 2024 تربية إسلامية',
      'تصحيح موضوع التربية الإسلامية BEM 2024',
      'تصحيح بيام 2024 تربية إسلامية شهادة التعليم المتوسط',
      'حل شهادة التعليم المتوسط 2023 تربية إسلامية'
    ]
  },
  {
    subjectId: 'civics_4am',
    subjectName: 'التربية المدنية',
    resourceId: '4am-bem-civics',
    queries: [
      'حل شهادة التعليم المتوسط 2024 تربية مدنية',
      'تصحيح موضوع التربية المدنية BEM 2024',
      'تصحيح بيام 2024 تربية مدنية شهادة التعليم المتوسط',
      'حل شهادة التعليم المتوسط 2023 تربية مدنية'
    ]
  }
];

async function runHarvesting() {
  console.log('--- Starting BEM Exam Solutions Harvesting ---');
  const allResults = [];
  const harvestedVideoIds = new Set();

  for (const target of BEM_TARGETS) {
    console.log(`Processing Subject: [${target.subjectName}] (${target.subjectId})...`);
    let subjectCount = 0;

    for (const query of target.queries) {
      console.log(`  Query: "${query}"`);
      const videos = await fetchYouTubeSearch(query);
      console.log(`    Found ${videos.length} videos`);

      for (const v of videos) {
        const isDuplicate = harvestedVideoIds.has(v.videoId);
        harvestedVideoIds.add(v.videoId);

        allResults.push({
          subjectId: target.subjectId,
          subjectName: target.subjectName,
          resourceId: target.resourceId,
          searchQuery: query,
          isDuplicate,
          ...v
        });
        subjectCount++;
      }
      // Brief pause between queries
      await new Promise(r => setTimeout(r, 600));
    }
    console.log(`  Completed [${target.subjectName}]: total raw harvested entries: ${subjectCount}`);
  }

  const rawOutPath = path.join(rawDir, 'bem_solutions_raw.json');
  fs.writeFileSync(rawOutPath, JSON.stringify(allResults, null, 2), 'utf8');

  console.log('\n--- Harvesting Summary ---');
  console.log(`Total raw harvested records: ${allResults.length}`);
  console.log(`Unique video IDs: ${harvestedVideoIds.size}`);
  console.log(`Raw file saved: ${rawOutPath}`);
}

runHarvesting().catch(err => {
  console.error('Fatal error during harvesting:', err);
  process.exit(1);
});
