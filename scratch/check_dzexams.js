const fs = require('fs');

function check(filePath, name) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const matches = txt.match(/https?:\/\/(?:www\.)?dzexams\.com[^\s"',]*/g) || [];
  const homepage = matches.filter(u => u === 'https://www.dzexams.com' || u === 'https://www.dzexams.com/' || u === 'http://www.dzexams.com');
  console.log(name, 'Total DzExams URLs:', matches.length, 'Homepage URLs:', homepage.length);
  return { total: matches.length, homepage: homepage.length };
}

check('data/registry.js', 'registry.js (3AS)');
check('data/registry_4am.js', 'registry_4am.js (4AM)');
