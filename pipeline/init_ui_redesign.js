const fs = require('fs');
const crypto = require('crypto');

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'data/registry.js',
  'data/philosophy.js',
  'data/registry_4am.js',
  'data/four_am.js'
];

const hashes = {};
for (const f of files) {
  const content = fs.readFileSync(f);
  hashes[f] = crypto.createHash('sha256').update(content).digest('hex');
}

fs.writeFileSync('data/pipeline/ui_redesign_baseline_hashes.json', JSON.stringify(hashes, null, 2));
console.log('Baseline hashes recorded successfully.');

// Backup files to be edited
fs.copyFileSync('index.html', 'index.html.backup_ui_redesign');
fs.copyFileSync('styles.css', 'styles.css.backup_ui_redesign');
fs.copyFileSync('app.js', 'app.js.backup_ui_redesign');
console.log('Backups created: index.html.backup_ui_redesign, styles.css.backup_ui_redesign, app.js.backup_ui_redesign');
