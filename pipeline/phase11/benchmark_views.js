const https = require('https');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

function getYouTubeViews(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const mInteraction = data.match(/itemprop="interactionCount"\s+content="(\d+)"/);
        const mCount = data.match(/"viewCount":\s*"(\d+)"/);
        let views = null;
        if (mInteraction) views = parseInt(mInteraction[1], 10);
        else if (mCount) views = parseInt(mCount[1], 10);
        resolve({ videoId, views, status: res.statusCode });
      });
    });
    req.on('error', () => resolve({ videoId, views: null, error: true }));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve({ videoId, views: null, timeout: true });
    });
  });
}

// Simple concurrency runner
async function fetchViewsWithConcurrency(videoList, limit = 10) {
  const results = [];
  let index = 0;
  
  async function worker() {
    while (index < videoList.length) {
      const cur = videoList[index++];
      const res = await getYouTubeViews(cur.videoId);
      results.push({ ...cur, viewCount: res.views });
      if (results.length % 10 === 0) {
        console.log(`Fetched views: ${results.length}/${videoList.length}`);
      }
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
}

async function run() {
  const candPath = path.join(baseDir, 'data/pipeline/verified/phase11_agent11_deduped.json');
  const candidates = JSON.parse(fs.readFileSync(candPath, 'utf8'));

  global.window = {};
  eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
  const registry = global.window.PlatformRegistry4AM || {};
  const existingVideoIds = new Set();
  for (const r of Object.values(registry)) {
    if (r.videoId) existingVideoIds.add(r.videoId);
  }

  // Filter for MATCH_CONFIRMED videos not yet imported
  const confirmedVideos = candidates.filter(c => {
    return c.videoId && !existingVideoIds.has(c.videoId) && c.lessonId && c.matchStatus === 'MATCH_CONFIRMED';
  });

  console.log(`Total MATCH_CONFIRMED videos to check: ${confirmedVideos.length}`);

  // Test on first 30
  const sample = confirmedVideos.slice(0, 30);
  const start = Date.now();
  const checked = await fetchViewsWithConcurrency(sample, 8);
  console.log(`Finished 30 checks in ${((Date.now() - start)/1000).toFixed(1)}s`);

  const over40k = checked.filter(c => c.viewCount && c.viewCount >= 40000);
  console.log(`Videos with >= 40K views: ${over40k.length}/${sample.length} (${((over40k.length/sample.length)*100).toFixed(1)}%)`);
  
  for (const v of over40k) {
    console.log(` - [${v.viewCount.toLocaleString()} views] [${v.subjectName}] ${v.lessonTitle} -> ${v.title}`);
  }
}

run();
