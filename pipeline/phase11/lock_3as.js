const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');

const THREE_AS_FILES = [
  'data/registry.js',
  'data/math.js',
  'data/arabic.js',
  'data/french.js',
  'data/english.js',
  'data/history.js',
  'data/islamic.js'
];

function computeFileHash(relPath) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`3AS File not found: ${relPath}`);
  }
  const content = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function establish3ASBaseline() {
  const baseline = {};
  for (const f of THREE_AS_FILES) {
    baseline[f] = computeFileHash(f);
  }
  const baselinePath = path.join(__dirname, '3as_crypto_baseline.json');
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
  console.log(`[3AS LOCK] Baseline established for ${THREE_AS_FILES.length} 3AS files.`);
  return baseline;
}

function verify3ASIntegrity() {
  const baselinePath = path.join(__dirname, '3as_crypto_baseline.json');
  if (!fs.existsSync(baselinePath)) {
    throw new Error('[3AS LOCK ERROR] Baseline not found. Run establish3ASBaseline() first.');
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  let altered = false;

  for (const [f, expectedHash] of Object.entries(baseline)) {
    const currentHash = computeFileHash(f);
    if (currentHash !== expectedHash) {
      console.error(`[CRITICAL ALERT] 3AS file modified: ${f}`);
      console.error(`Expected: ${expectedHash}`);
      console.error(`Actual:   ${currentHash}`);
      altered = true;
    }
  }

  if (altered) {
    throw new Error('[STOP] 3AS data modification detected! Aborting operation to protect 3AS isolation.');
  }
  console.log('[3AS LOCK VERIFIED] All 3AS files are 100% untouched and cryptographically identical.');
  return true;
}

if (require.main === module) {
  establish3ASBaseline();
}

module.exports = {
  THREE_AS_FILES,
  computeFileHash,
  establish3ASBaseline,
  verify3ASIntegrity
};
