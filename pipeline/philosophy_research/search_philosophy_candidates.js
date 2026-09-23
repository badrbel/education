/**
 * mordix_ai — Philosophy Targeted Discovery Engine
 * Harvests authentic 3AS Philosophy resources from YouTube
 * Zero Fake Data, Zero Search URLs, Zero Emojis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const cacheDir = path.join(baseDir, 'data/pipeline/cache/youtube_philo');
const rawDir = path.join(baseDir, 'data/pipeline/philosophy_research/raw');

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

// 13 Canonical Lessons targets
const LESSON_TARGETS = [
  {
    id: 1,
    lessonId: 'philo_3as_lp_01',
    title: 'الإحساس والإدراك',
    queries: [
      'درس الإحساس والإدراك بكالوريا آداب وفلسفة',
      'مقالة الإحساس والإدراك 3 ثانوي آداب وفلسفة',
      'مقالة التمييز بين الإحساس والإدراك خليل سعيداني'
    ]
  },
  {
    id: 2,
    lessonId: 'philo_3as_lp_02',
    title: 'اللغة والفكر',
    queries: [
      'درس اللغة والفكر بكالوريا آداب وفلسفة',
      'مقالة الدال والمدلول اللغة والفكر بكالوريا',
      'مقالة هل الفكر أسبق من اللغة فلسفة 3 ثانوي'
    ]
  },
  {
    id: 3,
    lessonId: 'philo_3as_lp_03',
    title: 'الشعور واللاشعور',
    queries: [
      'درس الشعور واللاشعور بكالوريا آداب وفلسفة',
      'مقالة الشعور واللاشعور 3 ثانوي آداب وفلسفة',
      'هل الحياة النفسية شعورية أم لاشعورية بكالوريا',
      'الشعور واللاشعور خليل سعيداني فلسفة',
      'مقالة اللاشعور مدرسة التحليل النفسي فرويد بكالوريا'
    ]
  },
  {
    id: 4,
    lessonId: 'philo_3as_lp_04',
    title: 'الذاكرة والخيال',
    queries: [
      'درس الذاكرة والخيال بكالوريا آداب وفلسفة',
      'مقالة الذاكرة مادية أم نفسية اجتماعية بكالوريا',
      'درس الذاكرة الفردية والاجتماعية 3 ثانوي فلسفة',
      'الذاكرة والخيال خليل سعيداني فلسفة',
      'مقالة النسيان والذاكرة 3 ثانوي آداب وفلسفة'
    ]
  },
  {
    id: 5,
    lessonId: 'philo_3as_lp_05',
    title: 'العادة والإرادة',
    queries: [
      'درس العادة والإرادة بكالوريا آداب وفلسفة',
      'مقالة العادة أثر سلبي أم إيجابي 3 ثانوي',
      'العلاقة بين العادة والإرادة فلسفة بكالوريا'
    ]
  },
  {
    id: 6,
    lessonId: 'philo_3as_lp_06',
    title: 'الأخلاق بين الثوابت والمتغيرات',
    queries: [
      'درس الأخلاق بين الثوابت والمتغيرات بكالوريا آداب وفلسفة',
      'مقالة الأخلاق مطلقة أم نسبية 3 ثانوي آداب وفلسفة',
      'أساس القيمة الأخلاقية العقل أم المنفعة أم المجتمع بكالوريا',
      'الأخلاق بين الثوابت والمتغيرات خليل سعيداني',
      'مقالة الأخلاق الإسلامية والغربية فلسفة بكالوريا'
    ]
  },
  {
    id: 7,
    lessonId: 'philo_3as_lp_07',
    title: 'الحقوق والواجبات والعدل',
    queries: [
      'درس الحقوق والواجبات والعدل بكالوريا آداب وفلسفة',
      'مقالة أسبقية الحق أم الواجب في العدالة بكالوريا',
      'العدالة بين المساواة والتفاوت 3 ثانوي آداب وفلسفة',
      'الحقوق والواجبات والعدل خليل سعيداني',
      'مقالة العدل بين القانون الطبيعي والقانون الوضعي بكالوريا'
    ]
  },
  {
    id: 8,
    lessonId: 'philo_3as_lp_08',
    title: 'الحرية والمسؤولية',
    queries: [
      'درس الحرية والمسؤولية بكالوريا آداب وفلسفة',
      'مقالة هل الإنسان حر أم مقيد 3 ثانوي آداب وفلسفة',
      'الحتمية والحرية الجريمة والعقاب فلسفة بكالوريا',
      'الحرية والمسؤولية خليل سعيداني فلسفة',
      'مقالة شرط المسؤولية الحرية والوعي فلسفة 3 ثانوي'
    ]
  },
  {
    id: 9,
    lessonId: 'philo_3as_lp_09',
    title: 'العلاقات الأسرية والحياة الاقتصادية والسياسية',
    queries: [
      'درس العلاقات الأسرية والحياة الاقتصادية والسياسية بكالوريا',
      'مقالة الأنظمة الاقتصادية الرأسمالية والاشتراكية فلسفة بكالوريا',
      'مقالة الدولة والمجتمع والأسرة 3 ثانوي آداب وفلسفة',
      'الحياة الاقتصادية والسياسية خليل سعيداني فلسفة',
      'مقالة الأخلاق والسياسة الغاية تبرر الوسيلة ميكيافيلي بكالوريا'
    ]
  },
  {
    id: 10,
    lessonId: 'philo_3as_lp_10',
    title: 'العنف والتسامح',
    queries: [
      'درس العنف والتسامح بكالوريا آداب وفلسفة',
      'مقالة العنف والتسامح فلسفة 3 ثانوي',
      'هل العنف مدان في كل الحالات أم مشروع فلسفة بكالوريا',
      'العنف والتسامح خليل سعيداني فلسفة',
      'مقالة التسامح والتعايش بين الشعوب فلسفة بكالوريا'
    ]
  },
  {
    id: 11,
    lessonId: 'philo_3as_lp_11',
    title: 'فلسفة الرياضيات',
    queries: [
      'درس فلسفة الرياضيات بكالوريا آداب وفلسفة',
      'مقالة أصل المفاهيم الرياضية العقل أم التجربة بكالوريا',
      'أزمة اليقين الرياضي والبديهيات فلسفة 3 ثانوي',
      'فلسفة الرياضيات خليل سعيداني',
      'مقالة الرياضيات الكلاسيكية والرياضيات المعاصرة الاكسيوماتيك بكالوريا'
    ]
  },
  {
    id: 12,
    lessonId: 'philo_3as_lp_12',
    title: 'علوم المادة الجامدة وعلوم المادة الحية',
    queries: [
      'درس علوم المادة الجامدة وعلوم المادة الحية بكالوريا',
      'مقالة الحتمية والتجريب في البيولوجيا المادة الحية فلسفة',
      'تطبيق المنهج التجريبي على المادة الحية 3 ثانوي آداب وفلسفة',
      'علوم المادة الجامدة وعلوم المادة الحية خليل سعيداني',
      'مقالة عوائق تطبيق المنهج التجريبي في البيولوجيا بكالوريا'
    ]
  },
  {
    id: 13,
    lessonId: 'philo_3as_lp_13',
    title: 'العلوم الإنسانية',
    queries: [
      'درس العلوم الإنسانية بكالوريا آداب وفلسفة',
      'مقالة الحادثة التاريخية والعلوم الإنسانية فلسفة بكالوريا',
      'تطبيق المنهج التجريبي في علم النفس وعلم الاجتماع والتاريخ 3 ثانوي',
      'العلوم الإنسانية خليل سعيداني فلسفة',
      'مقالة هل يمكن دراسة الظاهرة الإنسانية دراسة علمية بكالوريا'
    ]
  }
];

const GENERAL_TARGETS = [
  {
    queries: [
      'منهجية المقالة الفلسفية الجدلية والاستقصاء بالوضع بكالوريا',
      'منهجية تحليل نص فلسفي بكالوريا آداب وفلسفة',
      'مراجعة شاملة فلسفة 3 ثانوي آداب وفلسفة خليل سعيداني',
      'مقالات فلسفية مقترحة بكالوريا آداب وفلسفة'
    ]
  }
];

async function runDiscovery() {
  console.log('=== STARTING PHILOSOPHY RESEARCH DISCOVERY ===');
  const allCandidates = [];

  for (const t of LESSON_TARGETS) {
    console.log(`\nSearching for Lesson [${t.id}] ${t.title}...`);
    for (const q of t.queries) {
      process.stdout.write(`  Query: "${q}"... `);
      const vids = await fetchYouTubeSearch(q);
      console.log(`found ${vids.length} videos`);
      for (const v of vids) {
        allCandidates.push({
          targetLessonId: t.lessonId,
          targetLessonTitle: t.title,
          targetLessonNum: t.id,
          query: q,
          ...v
        });
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\nSearching for General Philosophy Review & Methodology...');
  for (const gt of GENERAL_TARGETS) {
    for (const q of gt.queries) {
      process.stdout.write(`  Query: "${q}"... `);
      const vids = await fetchYouTubeSearch(q);
      console.log(`found ${vids.length} videos`);
      for (const v of vids) {
        allCandidates.push({
          targetLessonId: null,
          targetLessonTitle: null,
          targetLessonNum: null,
          query: q,
          ...v
        });
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\nTotal raw items discovered: ${allCandidates.length}`);
  fs.writeFileSync(
    path.join(rawDir, 'raw_philosophy_candidates.json'),
    JSON.stringify(allCandidates, null, 2),
    'utf8'
  );
  console.log(`Raw candidates saved to: data/pipeline/philosophy_research/raw/raw_philosophy_candidates.json`);
}

runDiscovery();
