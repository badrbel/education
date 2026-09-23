const https = require('https');

https.get('https://www.youtube.com/watch?v=BwHUObvb_Wo', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const title = (d.match(/<title>(.*?)<\/title>/) || [])[1];
    const desc = (d.match(/"shortDescription":"(.*?)"/) || [])[1];
    console.log('Title:', title);
    console.log('Short Description:', (desc || '').slice(0, 300));
  });
});
