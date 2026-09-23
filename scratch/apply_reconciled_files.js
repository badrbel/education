const fs = require('fs');
const path = require('path');

const fourAmJsPath = path.join(__dirname, '../data/four_am.js');
const registryJsPath = path.join(__dirname, '../data/registry_4am.js');

// Create backups
fs.copyFileSync(fourAmJsPath, path.join(__dirname, '../data/four_am.js.bak'));
fs.copyFileSync(registryJsPath, path.join(__dirname, '../data/registry_4am.js.bak'));
console.log('Backups created at data/*.bak');

// Copy test files into place
fs.copyFileSync('scratch/test_four_am.js', fourAmJsPath);
fs.copyFileSync('scratch/test_registry_4am.js', registryJsPath);
console.log('Updated production files with reconciled datasets.');
