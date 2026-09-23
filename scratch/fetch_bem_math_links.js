const https = require('https');

https.get('https://www.dzexams.com/ar/bem/mathematiques', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const regex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const links = [];
    while ((match = regex.exec(data)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (text.includes('موضوع') || text.includes('2024') || text.includes('2020') || match[1].includes('/sujets/')) {
        links.push({ href: match[1], text });
      }
    }
    console.log('Found links count:', links.length);
    console.log('Sample links (first 15):', links.slice(0, 15));
  });
}).on('error', err => console.error(err));
