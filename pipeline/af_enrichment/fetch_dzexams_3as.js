const https = require('https');
const fs = require('fs');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
};

https.get('https://www.dzexams.com/ar/3as/histoire-geographie/cours', options, (res) => {
  console.log('Status code:', res.statusCode);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Body length:', d.length);
    const docRegex = /data-id="([^"]+)"[\s\S]*?<span class="doc-title">\s*([^<]+)<\/span>/g;
    let match;
    const docs = [];
    while ((match = docRegex.exec(d)) !== null) {
      docs.push({
        dataId: match[1],
        title: match[2].trim(),
        url: `https://www.dzexams.com/ar/documents/${encodeURIComponent(match[1])}`
      });
    }
    console.log('Total extracted documents from page:', docs.length);
    console.log('Sample extracted documents:\n', JSON.stringify(docs.slice(0, 5), null, 2));
  });
}).on('error', err => {
  console.error('Error:', err.message);
});
