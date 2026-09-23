const fs = require('fs');

const urls = JSON.parse(fs.readFileSync('scratch/all_external_urls.json', 'utf8'));
const reg3as = JSON.parse(fs.readFileSync('data/registry.js', 'utf8').replace(/^[^{]*/, '').replace(/;?\s*$/, ''));

const homeUrlItems = [];
for (const [id, r] of Object.entries(reg3as)) {
  const u = (r.problem && r.problem.url) || r.url;
  if (u === 'https://www.dzexams.com' || u === 'https://www.dzexams.com/') {
    homeUrlItems.push({ id, title: r.title, type: r.type, subject: r.subjectName, lesson: r.lessonTitle });
  }
}

console.log('Total items pointing to home url (https://www.dzexams.com):', homeUrlItems.length);
console.log('Sample 10 items:');
console.log(homeUrlItems.slice(0, 10));
