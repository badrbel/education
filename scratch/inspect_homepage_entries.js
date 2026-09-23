const fs = require('fs');

const regPath = 'data/registry.js';
let content = fs.readFileSync(regPath, 'utf8');

// Match any entry in registry.js with url: "https://www.dzexams.com"
// Let's verify which keys have this URL
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);

const reg = sandbox.window.PlatformRegistry || sandbox.PlatformRegistry;
const keysWithHomepage = [];
for (const [id, res] of Object.entries(reg)) {
  const sUrl = res.source && res.source.url;
  const pUrl = res.problem && res.problem.url;
  if (sUrl === 'https://www.dzexams.com' || sUrl === 'https://www.dzexams.com/' || pUrl === 'https://www.dzexams.com' || pUrl === 'https://www.dzexams.com/') {
    keysWithHomepage.push({ id, subjectId: res.subjectId, sUrl, pUrl });
  }
}

console.log('Found', keysWithHomepage.length, 'entries with homepage URL');
console.log('Sample subjectIds:', [...new Set(keysWithHomepage.map(k => k.subjectId))]);
