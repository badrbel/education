/**
 * mordix_ai — Phase Philosophy Research: Initialization & Baseline
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');

function sha256(relPath) {
  const content = fs.readFileSync(path.join(baseDir, relPath));
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Ensure directories
fs.mkdirSync(path.join(baseDir, 'pipeline/philosophy_research'), { recursive: true });
fs.mkdirSync(path.join(baseDir, 'data/pipeline/philosophy_research'), { recursive: true });

// Backup philosophy.js
fs.copyFileSync(path.join(baseDir, 'data/philosophy.js'), path.join(baseDir, 'data/philosophy.backup_phase_philo.js'));
console.log('Created backup: data/philosophy.backup_phase_philo.js');

// Record 4AM baseline
const baseline = {
  timestamp: new Date().toISOString(),
  phase: 'PHASE PHILOSOPHY-COVERAGE-RESEARCH',
  fourAmBaseline: {
    'data/registry_4am.js': sha256('data/registry_4am.js'),
    'data/four_am.js': sha256('data/four_am.js')
  },
  philosophyBaseline: sha256('data/philosophy.js'),
  registryBaseline: sha256('data/registry.js')
};

fs.writeFileSync(path.join(baseDir, 'data/pipeline/philosophy_research/baseline_sha256.json'), JSON.stringify(baseline, null, 2), 'utf8');
console.log('Baseline recorded successfully.');
console.log('4AM hashes:', baseline.fourAmBaseline);
