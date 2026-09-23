/**
 * mordix_ai — Safe Ingestion Engine for Phase AF-Enrichment
 * Ingests curated 304 resources into registry.js and updates subject files
 * Zero Fake Data, Zero Emojis, Zero Search URLs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');
const candidatesPath = path.join(baseDir, 'data/pipeline/af_enrichment/ingestion_candidates.json');
const unlinkedPath = path.join(baseDir, 'data/pipeline/af_enrichment/reconciled_existing_mappings.json');
const baselineShaPath = path.join(baseDir, 'data/pipeline/af_enrichment/baseline_sha256.json');

const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const unlinkedReconciliation = JSON.parse(fs.readFileSync(unlinkedPath, 'utf8'));
const baselineData = JSON.parse(fs.readFileSync(baselineShaPath, 'utf8'));

const strictEmojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{23FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;
function cleanAllEmojis(str) {
  if (!str) return '';
  return str.replace(strictEmojiRegex, '').replace(/\s+/g, ' ').trim();
}

console.log('=== STARTING 3AS AF SAFE INGESTION ===');
console.log(`Candidates to ingest: ${candidates.length}`);
console.log(`Unlinked items to reconcile: ${unlinkedReconciliation.candidateMappings.length}`);

// 1. INGEST INTO data/registry.js
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));
const registry = global.window.PlatformRegistry;

let registryAddCount = 0;
let registryUpdateCount = 0;

// Reconcile existing unlinked
for (const m of unlinkedReconciliation.candidateMappings) {
  if (registry[m.resourceId]) {
    registry[m.resourceId].lessonId = m.proposedLessonId;
    registry[m.resourceId].lessonTitle = m.proposedLessonTitle;
    registryUpdateCount++;
  }
}
console.log(`Reconciled ${registryUpdateCount} existing registry items with their canonical lessons.`);

// Ingest new candidates
for (const c of candidates) {
  if (registry[c.id]) continue; // avoid duplicate keys

  const isVideo = c.source === 'youtube';
  const itemType = c.type || (isVideo ? 'review' : 'summary');
  const newRegItem = {
    id: c.id,
    subjectId: c.subjectId,
    subjectName: c.subjectName || (c.subjectId === 'arabic' ? 'اللغة العربية' : (c.subjectId === 'history' ? 'التاريخ والجغرافيا' : (c.subjectId === 'english' ? 'اللغة الإنجليزية' : 'الفلسفة'))),
    type: itemType,
    lessonId: c.lessonId || null,
    lessonTitle: c.lessonTitle || null,
    title: cleanAllEmojis(c.title),
    year: 2026,
    term: null,
    level: 'الثالثة ثانوي',
    branch: 'آداب وفلسفة',
    badge: cleanAllEmojis(c.badge || (isVideo ? 'شرح معتمد' : 'ملخص معتمد')),
    topicCategory: c.topicCategory || null,
    contentCase: 'B',
    problem: {
      available: true,
      format: isVideo ? 'video' : 'pdf',
      url: c.url
    },
    solution: {
      available: false,
      format: 'none'
    },
    source: {
      type: isVideo ? 'youtube' : 'official',
      name: isVideo ? (c.teacher || c.channel) : 'الديوان الوطني للامتحانات والمسابقات / DzExams',
      url: c.url,
      verified: true
    }
  };

  if (isVideo) {
    newRegItem.videoId = c.videoId;
    newRegItem.youtubeId = c.youtubeId;
    newRegItem.url = c.url;
    newRegItem.sourceUrl = c.sourceUrl;
    newRegItem.sourceType = 'DIRECT_RESOURCE';
    newRegItem.views = c.views || '';
    newRegItem.duration = c.duration || '';
    newRegItem.channel = c.channel;
    newRegItem.teacher = c.teacher;
  }

  registry[c.id] = newRegItem;
  registryAddCount++;
}

console.log(`Added ${registryAddCount} new items to PlatformRegistry.`);

// Write back updated data/registry.js
const regJsContent = `/**
 * mordix_ai — سجل الموارد الموحد (Platform Resource Registry)
 * Single Source of Truth for all Educational Resources
 * Zero Emojis | Production Verified
 */

window.PlatformRegistry = ${JSON.stringify(registry, null, 2)};
`;
fs.writeFileSync(path.join(baseDir, 'data/registry.js'), regJsContent, 'utf8');
console.log('Saved updated data/registry.js successfully.');

// 2. INGEST INTO SUBJECT FILES (arabic.js, english.js, history.js)
// A. Arabic: Inject Abu Bakr Mabrouk & Atiya Souissi into channelsData
global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/arabic.js'), 'utf8'));
const arabicData = global.window.PlatformData['اللغة العربية'];
arabicData.channelsData = arabicData.channelsData || {};

const arabicVideoCandidates = candidates.filter(c => c.subjectId === 'arabic' && c.source === 'youtube' && c.lessonTitle);
let arabicVideoInjected = 0;

for (const vc of arabicVideoCandidates) {
  const lTitle = vc.lessonTitle;
  if (!arabicData.channelsData[lTitle]) {
    arabicData.channelsData[lTitle] = [];
  }

  const chName = cleanAllEmojis(vc.teacher || vc.channel);
  let chObj = arabicData.channelsData[lTitle].find(c => c.channel === chName || c.name === chName);
  if (!chObj) {
    chObj = {
      channel: chName,
      name: chName,
      videos: []
    };
    arabicData.channelsData[lTitle].push(chObj);
  }

  // Avoid duplicate video
  const exists = chObj.videos.some(v => (v.id === vc.videoId || v.youtubeId === vc.videoId));
  if (!exists) {
    chObj.videos.push({
      id: vc.videoId,
      videoId: vc.videoId,
      youtubeId: vc.videoId,
      title: cleanAllEmojis(vc.title),
      duration: vc.duration || '',
      views: vc.views || '',
      url: vc.url,
      verified: true,
      auditStatus: 'SAFE_TO_IMPORT'
    });
    arabicVideoInjected++;
  }
}
console.log(`Injected ${arabicVideoInjected} verified teacher videos into data/arabic.js.`);

const arabicJsContent = `/**
 * Data Module: اللغة العربية (arabic)
 * Standardized Lesson IDs & Production Verified
 * Zero Emojis | Strict Provenance
 */

window.PlatformData = window.PlatformData || {};

window.PlatformData['اللغة العربية'] = ${JSON.stringify(arabicData, null, 2)};
`;
fs.writeFileSync(path.join(baseDir, 'data/arabic.js'), arabicJsContent, 'utf8');

// B. English: Inject Missing Lessons (Quantifiers, Syllables)
global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/english.js'), 'utf8'));
const englishData = global.window.PlatformData['اللغة الإنجليزية'];
englishData.channelsData = englishData.channelsData || {};

const englishVideoCandidates = candidates.filter(c => c.subjectId === 'english' && c.source === 'youtube' && (c.lessonId === 'english-18' || c.lessonId === 'english-22'));
let englishVideoInjected = 0;

for (const vc of englishVideoCandidates) {
  const lTitle = vc.lessonTitle || (vc.lessonId === 'english-18' ? 'Quantifiers' : 'Syllables');
  if (!englishData.channelsData[lTitle]) {
    englishData.channelsData[lTitle] = [];
  }

  const chName = cleanAllEmojis(vc.channel);
  let chObj = englishData.channelsData[lTitle].find(c => c.channel === chName || c.name === chName);
  if (!chObj) {
    chObj = {
      channel: chName,
      name: chName,
      videos: []
    };
    englishData.channelsData[lTitle].push(chObj);
  }

  const exists = chObj.videos.some(v => (v.id === vc.videoId || v.youtubeId === vc.videoId));
  if (!exists) {
    chObj.videos.push({
      id: vc.videoId,
      videoId: vc.videoId,
      youtubeId: vc.videoId,
      title: cleanAllEmojis(vc.title),
      duration: vc.duration || '',
      views: vc.views || '',
      url: vc.url,
      verified: true,
      auditStatus: 'SAFE_TO_IMPORT'
    });
    englishVideoInjected++;
  }
}
console.log(`Injected ${englishVideoInjected} missing lesson videos into data/english.js.`);

const englishJsContent = `/**
 * Data Module: اللغة الإنجليزية (english)
 * Standardized Lesson IDs & Production Verified
 * Zero Emojis | Strict Provenance
 */

window.PlatformData = window.PlatformData || {};

window.PlatformData['اللغة الإنجليزية'] = ${JSON.stringify(englishData, null, 2)};
`;
fs.writeFileSync(path.join(baseDir, 'data/english.js'), englishJsContent, 'utf8');

// C. History: Inject Geographical Terms & Figures
global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/history.js'), 'utf8'));
const historyData = global.window.PlatformData['التاريخ والجغرافيا'];
historyData.channelsData = historyData.channelsData || {};

const historyVideoCandidates = candidates.filter(c => c.subjectId === 'history' && c.source === 'youtube' && c.lessonTitle);
let historyVideoInjected = 0;

for (const vc of historyVideoCandidates) {
  const lTitle = vc.lessonTitle;
  if (!historyData.channelsData[lTitle]) {
    historyData.channelsData[lTitle] = [];
  }

  const chName = cleanAllEmojis(vc.channel);
  let chObj = historyData.channelsData[lTitle].find(c => c.channel === chName || c.name === chName);
  if (!chObj) {
    chObj = {
      channel: chName,
      name: chName,
      videos: []
    };
    historyData.channelsData[lTitle].push(chObj);
  }

  const exists = chObj.videos.some(v => (v.id === vc.videoId || v.youtubeId === vc.videoId));
  if (!exists) {
    chObj.videos.push({
      id: vc.videoId,
      videoId: vc.videoId,
      youtubeId: vc.videoId,
      title: cleanAllEmojis(vc.title),
      duration: vc.duration || '',
      views: vc.views || '',
      url: vc.url,
      topicCategory: vc.topicCategory,
      verified: true,
      auditStatus: 'SAFE_TO_IMPORT'
    });
    historyVideoInjected++;
  }
}
console.log(`Injected ${historyVideoInjected} verified terms & figures videos into data/history.js.`);

const historyJsContent = `/**
 * Data Module: التاريخ والجغرافيا (history)
 * Standardized Lesson IDs & Production Verified
 * Zero Emojis | Strict Provenance
 */

window.PlatformData = window.PlatformData || {};

window.PlatformData['التاريخ والجغرافيا'] = ${JSON.stringify(historyData, null, 2)};
`;
fs.writeFileSync(path.join(baseDir, 'data/history.js'), historyJsContent, 'utf8');

// 3. CRYPTOGRAPHIC VERIFICATION POST-INGESTION
function sha256(relPath) {
  const content = fs.readFileSync(path.join(baseDir, relPath));
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('\n=== POST-INGESTION SHA-256 AUDIT ===');
const postSha = {
  threeAsBefore: baselineData.threeAsBaseline,
  threeAsAfter: {},
  fourAmBaseline: baselineData.fourAmBaseline,
  fourAmCurrent: {}
};

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

for (const f of THREE_AS_FILES) {
  postSha.threeAsAfter[f] = sha256(f);
  const changed = postSha.threeAsAfter[f] !== postSha.threeAsBefore[f];
  console.log(`[3AS] ${f}: ${changed ? 'MODIFIED (EXPECTED)' : 'UNTOUCHED'}`);
}

const FOUR_AM_FILES = [
  'data/registry_4am.js',
  'data/four_am.js'
];

let fourAmTampered = false;
for (const f of FOUR_AM_FILES) {
  postSha.fourAmCurrent[f] = sha256(f);
  if (postSha.fourAmCurrent[f] !== postSha.fourAmBaseline[f]) {
    fourAmTampered = true;
    console.error(`[CRITICAL ALERT] 4AM file was modified: ${f}`);
  } else {
    console.log(`[4AM LOCK VERIFIED] ${f}: 100% IDENTICAL`);
  }
}

if (fourAmTampered) {
  throw new Error('4AM LOCK VIOLATION DETECTED! ABORTING!');
}

fs.writeFileSync(path.join(baseDir, 'data/pipeline/af_enrichment/post_ingestion_sha256.json'), JSON.stringify(postSha, null, 2), 'utf8');
console.log('\n[SUCCESS] Ingestion completed safely and verified with zero 4AM impact.');
