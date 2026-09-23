const https = require('https');

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
        // Look for viewCount in various YouTube formats
        const mCount = data.match(/"viewCount":\s*"(\d+)"/);
        const mInteraction = data.match(/itemprop="interactionCount"\s+content="(\d+)"/);
        const mSimple = data.match(/"viewCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/);
        const mShort = data.match(/"shortViewCountText":\s*\{\s*"accessibility":\s*\{\s*"accessibilityData":\s*\{\s*"label":\s*"([^"]+)"/);
        
        let views = null;
        if (mInteraction) {
          views = parseInt(mInteraction[1], 10);
        } else if (mCount) {
          views = parseInt(mCount[1], 10);
        }
        
        resolve({
          videoId,
          status: res.statusCode,
          views,
          simpleText: mSimple ? mSimple[1] : null,
          shortLabel: mShort ? mShort[1] : null
        });
      });
    });
    req.on('error', (e) => resolve({ videoId, error: e.message, views: null }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ videoId, error: 'Timeout', views: null });
    });
  });
}

async function test() {
  const sampleVideos = [
    'ak0m6R4amD0', // Al-Muallem Zakaria
    'A5PzYpFeKOk', // Youcef Maden
    'jAgMduhAasg', // Sharh Douroussi
    '6a1-5Ov-d38'  // Prof Chabbou
  ];

  for (const id of sampleVideos) {
    const res = await getYouTubeViews(id);
    console.log(id, '->', res);
  }
}

test();
