const fs = require('fs');

const reg3as = JSON.parse(fs.readFileSync('data/registry.js', 'utf8').replace(/^[^{]*/, '').replace(/;?\s*$/, ''));

const found = [];
for (const [id, r] of Object.entries(reg3as)) {
  const str = JSON.stringify(r);
  if (str.includes('"https://www.dzexams.com"')) {
    found.push({ id, type: r.type, title: r.title, problem: r.problem, solution: r.solution, source: r.source });
  }
}

console.log('Found count:', found.length);
if (found.length > 0) {
  console.log('First 2 found:', JSON.stringify(found.slice(0, 2), null, 2));
}
