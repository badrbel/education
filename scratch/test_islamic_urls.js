const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode, location: res.headers.location });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  const urls = [
    'https://www.dzexams.com/ar/3as/islamique',
    'https://www.dzexams.com/ar/3as/chariaa',
    'https://www.dzexams.com/ar/3as/tarbia-islamia'
  ];
  for (const u of urls) {
    console.log(await checkUrl(u));
  }
}
run();
