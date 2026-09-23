const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('data').filter(f => f.endsWith('.js'));
for (const file of files) {
  const filePath = path.join('data', file);
  const txt = fs.readFileSync(filePath, 'utf8');
  const matches = txt.match(/https?:\/\/(?:www\.)?dzexams\.com[^\s"',]*/g) || [];
  const homepage = matches.filter(u => u === 'https://www.dzexams.com' || u === 'https://www.dzexams.com/' || u === 'http://www.dzexams.com');
  if (homepage.length > 0) {
    console.log(file, 'has homepage matches:', homepage.length);
  }
}
