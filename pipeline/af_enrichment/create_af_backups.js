const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');

const THREE_AS_FILES = [
  'data/registry.js',
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];

const FOUR_AM_FILES = [
  'data/registry_4am.js',
  'data/four_am.js'
];

function computeHash(relPath) {
  const fullPath = path.join(baseDir, relPath);
  const buf = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

console.log('=== 1. CREATING 3AS BACKUPS ===');
for (const f of THREE_AS_FILES) {
  const src = path.join(baseDir, f);
  const dest = path.join(baseDir, f.replace(/\.js$/, '.backup_phase_af.js'));
  fs.copyFileSync(src, dest);
  console.log(`[BACKUP CREATED] ${dest}`);
}

console.log('\n=== 2. RECORDING SHA-256 BASELINES ===');
const baselines = {
  timestamp: new Date().toISOString(),
  phase: 'PHASE AF-ENRICHMENT',
  threeAsBaseline: {},
  fourAmBaseline: {}
};

for (const f of THREE_AS_FILES) {
  baselines.threeAsBaseline[f] = computeHash(f);
  console.log(`[3AS BASELINE]  ${f}: ${baselines.threeAsBaseline[f]}`);
}

for (const f of FOUR_AM_FILES) {
  baselines.fourAmBaseline[f] = computeHash(f);
  console.log(`[4AM BASELINE]  ${f}: ${baselines.fourAmBaseline[f]}`);
}

const outPath = path.join(baseDir, 'data/pipeline/af_enrichment/baseline_sha256.json');
fs.writeFileSync(outPath, JSON.stringify(baselines, null, 2), 'utf8');
console.log(`\nBaseline recorded at: ${outPath}`);

function verify4AMLock() {
  const saved = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  for (const [f, expectedHash] of Object.entries(saved.fourAmBaseline)) {
    const current = computeHash(f);
    if (current !== expectedHash) {
      throw new Error(`[CRITICAL SECURITY ALERT] 4AM file altered: ${f}! Expected: ${expectedHash}, Got: ${current}`);
    }
  }
  console.log('[4AM LOCK VERIFIED] All 4AM files remain 100% cryptographically untouched.');
  return true;
}

module.exports = {
  THREE_AS_FILES,
  FOUR_AM_FILES,
  computeHash,
  verify4AMLock
};
