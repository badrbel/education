const fs = require('fs');
const vm = require('vm');

const regCode = fs.readFileSync('data/registry_4am.js', 'utf8');
const fourAmCode = fs.readFileSync('data/four_am.js', 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(regCode, sandbox);
vm.runInContext(fourAmCode, sandbox);

const reg = sandbox.window.PlatformRegistry4AM;
const platformData = sandbox.window.PlatformData4AM;

console.log('--- Registry 4AM BEM items ---');
const bemItems = Object.values(reg).filter(r => r.type === 'bem' || (r.id && r.id.includes('bem')));
console.log('Count:', bemItems.length);
for (const item of bemItems) {
  console.log(item.id, '| subject:', item.subjectId, '| year:', item.year, '| videos:', (item.videos || []).length);
}

console.log('\n--- PlatformData4AM subjects bem arrays ---');
for (const [subjKey, subjData] of Object.entries(platformData)) {
  console.log(subjKey, 'bem array length:', (subjData.bem || []).length);
  if (subjData.bem && subjData.bem.length > 0) {
    console.log('   Sample:', JSON.stringify(subjData.bem[0]));
  }
}
