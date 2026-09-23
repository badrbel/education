const fs = require('fs');
const urls = JSON.parse(fs.readFileSync('scratch/all_external_urls.json', 'utf8'));
const matches = urls.filter(u => u.url.startsWith('https://www.dzexams.com') && u.url.split('/').length <= 4);
console.log('Matches with short paths:');
console.log(matches);
