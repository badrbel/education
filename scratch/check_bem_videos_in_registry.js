const fs = require('fs');
const vm = require('vm');

const regCode = fs.readFileSync('data/registry_4am.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(regCode, sandbox);

const reg = sandbox.window.PlatformRegistry4AM;
const bemItems = Object.values(reg).filter(r => r.type === 'bem');

let totalVids = 0;
for (const item of bemItems) {
  const vids = (item.solution && item.solution.videoSolutions) || [];
  totalVids += vids.length;
  console.log(item.id, '|', item.subjectName, '| total videos:', vids.length);
  const byYear = {};
  vids.forEach(v => {
    byYear[v.year] = (byYear[v.year] || 0) + 1;
  });
  console.log('   years:', byYear);
}
console.log('Total BEM videos across all 9 items:', totalVids);
