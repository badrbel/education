const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
fs.copyFileSync(
  path.join(baseDir, 'data/registry_4am.js'),
  path.join(baseDir, 'data/registry_4am.backup_phase11_8.js')
);
fs.copyFileSync(
  path.join(baseDir, 'data/four_am.js'),
  path.join(baseDir, 'data/four_am.backup_phase11_8.js')
);
console.log('Phase 11.8 Backups created:');
console.log('- data/registry_4am.backup_phase11_8.js');
console.log('- data/four_am.backup_phase11_8.js');
