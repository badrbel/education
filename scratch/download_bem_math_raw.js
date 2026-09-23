const https = require('https');
const fs = require('fs');

https.get('https://www.dzexams.com/ar/bem/mathematiques', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scratch/bem_math_raw.html', data, 'utf8');
    console.log('Saved scratch/bem_math_raw.html, size:', data.length);
  });
});
