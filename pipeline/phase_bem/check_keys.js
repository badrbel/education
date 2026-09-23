const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync(path.join(__dirname, '../../data/four_am.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);

const p = sandbox.window.PlatformData4AM;
for (const [k, v] of Object.entries(p)) {
  console.log(k, 'baccalaureate:', JSON.stringify(v.baccalaureate));
}
