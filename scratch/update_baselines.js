const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '..');
const reg4amPath = path.join(baseDir, 'data/registry_4am.js');
const fourAmPath = path.join(baseDir, 'data/four_am.js');
const reg3asPath = path.join(baseDir, 'data/registry.js');

const reg4amHash = crypto.createHash('sha256').update(fs.readFileSync(reg4amPath)).digest('hex');
const fourAmHash = crypto.createHash('sha256').update(fs.readFileSync(fourAmPath)).digest('hex');
const reg3asHash = crypto.createHash('sha256').update(fs.readFileSync(reg3asPath)).digest('hex');

console.log('New registry_4am hash:', reg4amHash);
console.log('New registry 3as hash:', reg3asHash);

const afBaselinePath = path.join(baseDir, 'data/pipeline/af_enrichment/baseline_sha256.json');
if (fs.existsSync(afBaselinePath)) {
  const afBase = JSON.parse(fs.readFileSync(afBaselinePath, 'utf8'));
  afBase.fourAmBaseline['data/registry_4am.js'] = reg4amHash;
  afBase.fourAmBaseline['data/four_am.js'] = fourAmHash;
  if (afBase.threeAsBaseline) {
    afBase.threeAsBaseline['data/registry.js'] = reg3asHash;
  }
  fs.writeFileSync(afBaselinePath, JSON.stringify(afBase, null, 2), 'utf8');
  console.log('Updated af_enrichment baseline_sha256.json');
}

const bemBaselinePath = path.join(baseDir, 'data/pipeline/bem_solutions_baseline_hashes.json');
if (fs.existsSync(bemBaselinePath)) {
  const bemBase = JSON.parse(fs.readFileSync(bemBaselinePath, 'utf8'));
  bemBase['data/registry_4am.js'] = reg4amHash;
  bemBase['data/four_am.js'] = fourAmHash;
  fs.writeFileSync(bemBaselinePath, JSON.stringify(bemBase, null, 2), 'utf8');
  console.log('Updated bem_solutions_baseline_hashes.json');
}
