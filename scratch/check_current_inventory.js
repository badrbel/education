global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');
const reg = global.window.PlatformRegistry4AM;
const types = {};
for (const [k, v] of Object.entries(reg)) {
  types[v.type] = (types[v.type] || 0) + 1;
}
console.log('Total resources in registry_4am.js:', Object.keys(reg).length);
console.log('Types breakdown:', types);
