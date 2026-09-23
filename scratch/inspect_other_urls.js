const fs = require('fs');

const urls = JSON.parse(fs.readFileSync('scratch/all_external_urls.json', 'utf8'));

const other = urls.filter(item => {
  const u = item.url;
  return !u.includes('/sujets/') && !u.includes('/bem/') && !u.includes('/bac/') && !u.match(/\/ar\/(4am|3as|1as|2as)\/[^/]+\/[^/]+/);
});

console.log('Total other URLs:', other.length);
console.log('Sample 30 other URLs:');
console.log(other.slice(0, 30).map(o => ({ url: o.url, count: o.count, types: o.types, subjects: o.subjects })));
