/**
 * mordix_ai — BEM Solutions Ingestion Engine
 * Ingests 91 verified YouTube solutions into existing BEM exam resources across 9 subjects
 * Zero Fake Data, Zero Search URLs, Zero Emojis
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const auditJsonPath = path.join(baseDir, 'data/pipeline/reports/PHASE_BEM_SOLUTIONS_AUDIT.json');
const registry4amPath = path.join(baseDir, 'data/registry_4am.js');
const fourAmPath = path.join(baseDir, 'data/four_am.js');

if (!fs.existsSync(auditJsonPath)) {
  console.error('Audit report JSON not found:', auditJsonPath);
  process.exit(1);
}

const auditData = JSON.parse(fs.readFileSync(auditJsonPath, 'utf8'));
const curatedList = auditData.curatedSelection || [];
console.log(`Loaded ${curatedList.length} curated solutions from audit report.`);

// Group solutions by subjectId
const solutionsBySubject = {};
curatedList.forEach(item => {
  const sId = item.subjectId;
  if (!solutionsBySubject[sId]) solutionsBySubject[sId] = [];
  solutionsBySubject[sId].push({
    id: item.videoId,
    videoId: item.videoId,
    youtubeId: item.videoId,
    title: item.title,
    channel: item.channelName,
    teacher: item.channelName,
    year: item.examYear,
    duration: item.duration,
    url: `https://www.youtube.com/watch?v=${item.videoId}`,
    verified: true,
    auditStatus: 'SAFE_TO_IMPORT'
  });
});

// Load existing registry_4am.js
const regSandbox = { window: {} };
vm.createContext(regSandbox);
const rawRegistryCode = fs.readFileSync(registry4amPath, 'utf8');
vm.runInContext(rawRegistryCode, regSandbox);
const registry4am = regSandbox.window.PlatformRegistry4AM;

// Ingest into registry_4am
let enrichedCount = 0;
const subjects = [
  { id: 'math_4am', name: 'الرياضيات', resId: '4am-bem-math' },
  { id: 'arabic_4am', name: 'اللغة العربية', resId: '4am-bem-arabic' },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', resId: '4am-bem-physics' },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', resId: '4am-bem-science' },
  { id: 'french_4am', name: 'اللغة الفرنسية', resId: '4am-bem-french' },
  { id: 'english_4am', name: 'اللغة الإنجليزية', resId: '4am-bem-english' },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', resId: '4am-bem-history' },
  { id: 'islamic_4am', name: 'التربية الإسلامية', resId: '4am-bem-islamic' },
  { id: 'civics_4am', name: 'التربية المدنية', resId: '4am-bem-civics' }
];

subjects.forEach(s => {
  const bemRes = registry4am[s.resId];
  if (!bemRes) {
    console.warn(`BEM resource ${s.resId} not found in registry_4am!`);
    return;
  }
  const vSolutions = solutionsBySubject[s.id] || [];
  bemRes.solution = bemRes.solution || {};
  bemRes.solution.available = true;
  bemRes.solution.videoSolutionsCount = vSolutions.length;
  bemRes.solution.videoSolutions = vSolutions;
  bemRes.videoSolutions = vSolutions;
  enrichedCount += vSolutions.length;
  console.log(`Enriched [${s.name}] (${s.resId}) with ${vSolutions.length} video solutions.`);
});

// Write updated registry_4am.js
const newRegistryCode = `/**\n * mordix_ai — سجل الموارد التعليمية الموحد لطور 4AM\n * محدث ومفحوص بالكامل بروابط مباشرة وصريحة (PHASE 11.8)\n * خلو تام من الإيموجيات (Zero Emojis)\n */\n\nwindow.PlatformRegistry4AM = ${JSON.stringify(registry4am, null, 2)};\n`;
fs.writeFileSync(registry4amPath, newRegistryCode, 'utf8');
console.log(`Saved updated registry_4am.js (${enrichedCount} total video solutions attached).`);

// Load and update four_am.js baccalaureate array
const fourAmSandbox = { window: {} };
vm.createContext(fourAmSandbox);
const rawFourAmCode = fs.readFileSync(fourAmPath, 'utf8');
vm.runInContext(rawFourAmCode, fourAmSandbox);
const data4am = fourAmSandbox.window.PlatformData4AM;

subjects.forEach(s => {
  const subj = data4am[s.id];
  if (!subj) return;
  subj.baccalaureate = [];
  subj.bem = {
    id: s.resId,
    title: `مواضيع وحلول شهادة التعليم المتوسط (BEM) - ${s.name}`,
    type: 'bem',
    badge: 'أرشيف رسمي وحلول مرئية',
    sourceUrl: subj.bemUrl || `https://www.dzexams.com/ar/bem`,
    videoSolutionsCount: (solutionsBySubject[s.id] || []).length,
    videoSolutions: solutionsBySubject[s.id] || []
  };
});

const newFourAmCode = `/**\n * mordix_ai — منهاج السنة الرابعة متوسط المعتمد (4AM Curriculum)\n * محدث ومفحوص بالكامل بروابط مباشرة وصريحة (PHASE 11.8)\n * خلو تام من الإيموجيات (Zero Emojis)\n */\n\nwindow.PlatformData4AM = ${JSON.stringify(data4am, null, 2)};\n`;
fs.writeFileSync(fourAmPath, newFourAmCode, 'utf8');
console.log('Saved updated four_am.js with populated BEM baccalaureate entries.');

// Calculate new hashes
const newRegHash = crypto.createHash('sha256').update(fs.readFileSync(registry4amPath)).digest('hex');
const newFourAmHash = crypto.createHash('sha256').update(fs.readFileSync(fourAmPath)).digest('hex');

// Update af_enrichment baseline
const afBaselinePath = path.join(baseDir, 'data/pipeline/af_enrichment/baseline_sha256.json');
if (fs.existsSync(afBaselinePath)) {
  const afBase = JSON.parse(fs.readFileSync(afBaselinePath, 'utf8'));
  afBase.fourAmBaseline['data/registry_4am.js'] = newRegHash;
  afBase.fourAmBaseline['data/four_am.js'] = newFourAmHash;
  fs.writeFileSync(afBaselinePath, JSON.stringify(afBase, null, 2), 'utf8');
  console.log('Updated af_enrichment 4AM baseline hashes.');
}

// Update phase bem baseline
const bemBaselinePath = path.join(baseDir, 'data/pipeline/bem_solutions_baseline_hashes.json');
if (fs.existsSync(bemBaselinePath)) {
  const bemBase = JSON.parse(fs.readFileSync(bemBaselinePath, 'utf8'));
  bemBase['data/registry_4am.js'] = newRegHash;
  bemBase['data/four_am.js'] = newFourAmHash;
  fs.writeFileSync(bemBaselinePath, JSON.stringify(bemBase, null, 2), 'utf8');
  console.log('Updated bem_solutions baseline hashes.');
}

console.log('\n--- Ingestion Complete Successfully ---');
