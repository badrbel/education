const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('data/registry.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const reg = sandbox.window.PlatformRegistry;
const bacItems = Object.values(reg).filter(r => r.type === 'bac');
console.log('Total 3AS BAC items:', bacItems.length);
if (bacItems.length > 0) {
  console.log('Sample BAC item:', JSON.stringify(bacItems[0], null, 2));
  const subjects = {};
  bacItems.forEach(b => {
    subjects[b.subjectId] = (subjects[b.subjectId] || 0) + 1;
  });
  console.log('By subject:', subjects);
}
