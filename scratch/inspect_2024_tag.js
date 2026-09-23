const https = require('https');

https.get('https://www.dzexams.com/ar/bem/mathematiques', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('2024');
    if (idx !== -1) {
      console.log('--- Context around 2024 (1000 chars): ---');
      console.log(data.substring(idx - 300, idx + 700));
    }
  });
});
