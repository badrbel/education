const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const baselinePath = path.join(baseDir, 'data/pipeline/bem_solutions_baseline_hashes.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

let allMatch = true;
console.log('--- Baseline Integrity Verification ---');

for (const [relPath, expectedHash] of Object.entries(baseline)) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`MISSING FILE: ${relPath}`);
    allMatch = false;
    continue;
  }
  const fileBuf = fs.readFileSync(fullPath);
  const actualHash = crypto.createHash('sha256').update(fileBuf).digest('hex');

  if (actualHash === expectedHash) {
    console.log(`[PASS] ${relPath} (UNMODIFIED)`);
  } else {
    console.error(`[FAIL] ${relPath} MODIFIED! Expected ${expectedHash}, got ${actualHash}`);
    allMatch = false;
  }
}

if (allMatch) {
  console.log('\nALL BASELINE PRODUCTION FILES ARE 100% UNMODIFIED AND SAFE.');
} else {
  console.error('\nINTEGRITY VIOLATION DETECTED!');
  process.exit(1);
}
