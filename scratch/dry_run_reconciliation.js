const fs = require('fs');
const path = require('path');

const fourAmJsPath = path.join(__dirname, '../data/four_am.js');
const registryJsPath = path.join(__dirname, '../data/registry_4am.js');

global.window = {};
require(fourAmJsPath);
require(registryJsPath);

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const rejectedIds = new Set(['0B00Ft4NWyc', 'HnUhBeKnLUs', 'QRiyqep8d3Y', 'R-UF4UIDUVA', 'nQPqhCTp084', 'rjSUGKr4J6s']);

console.log('1. Cleaning four_am.js channelsData...');
let removedFromChannels = 0;
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  for (const [lessonName, channels] of Object.entries(subjData.channelsData || {})) {
    for (let c = channels.length - 1; c >= 0; c--) {
      const ch = channels[c];
      ch.videos = (ch.videos || []).filter(v => {
        const id = v.id || v.videoId;
        if (rejectedIds.has(id)) {
          removedFromChannels++;
          console.log(`  Removed [${subjData.name} - ${lessonName}] video: ${v.title} (${id})`);
          return false;
        }
        return true;
      });
      // If channel has 0 videos left, remove channel
      if (ch.videos.length === 0) {
        channels.splice(c, 1);
      }
    }
  }
}
console.log(`Removed ${removedFromChannels} videos from four_am.js channelsData.`);

console.log('\n2. Cleaning registry_4am.js...');
let removedFromRegistry = 0;
const rejectedRegistryKeys = [];
for (const [key, res] of Object.entries(registry4am)) {
  const vidId = (res.videoId || res.id).replace(/^4am-(?:vid|comp)-/, '');
  if (rejectedIds.has(vidId) || rejectedIds.has(res.id)) {
    rejectedRegistryKeys.push(key);
    delete registry4am[key];
    removedFromRegistry++;
    console.log(`  Removed from registry [${key}] - ${res.title}`);
  }
}
console.log(`Removed ${removedFromRegistry} rejected items from registry_4am.js.`);

// 3. Update the 23 General Reviews to SUBJECT_LEVEL_RESOURCE
const generalReviewIds = [
  'nUQRjzF5jGk', 'oonAC1jxvlY', '8X6LUHQ5AeY', '6X4-1-Isj_c', 'lZIpNqeMIM0',
  'e12ZNzEf7A4', 'TYZjpF0fB0k', 'RQ8ydcxgR64', 'VtXA3Clvt34', 'G0UyoThCv4E',
  'AGALcbBFL8M', 'IoK7_8Sfju8', 'cmx3j1ji98I', 'FF-y_TmQR8E', 'ieNKBd5JrME',
  'ahci428Sx6A', '11WUOuTjRCU', 'b2ILhQitltU', 'actMsazbv_M', 'asJOmRz16MA',
  'FYCFOyIhiik', 'LOZNgAek6Jk', 'TmtQ3h_ecxw'
];

let updatedReviews = 0;
for (const [key, res] of Object.entries(registry4am)) {
  const vId = (res.videoId || res.id).replace(/^4am-(?:vid|comp)-/, '');
  if (generalReviewIds.includes(vId)) {
    res.sourceType = 'SUBJECT_LEVEL_RESOURCE';
    res.resourceType = 'SUBJECT_LEVEL_RESOURCE';
    res.lessonId = null;
    res.lessonTitle = 'المراجعات الشاملة لشهادة BEM';
    res.auditStatus = 'SAFE_TO_IMPORT';
    res.matchStatus = 'SUBJECT_LEVEL_RESOURCE';
    updatedReviews++;
  }
}
console.log(`Updated ${updatedReviews} general review items in registry_4am.js to SUBJECT_LEVEL_RESOURCE.`);

// Save test files to scratch to test validators before overwriting production
fs.writeFileSync('scratch/test_four_am.js', '/** mordix_ai — 4AM Curriculum */\nwindow.PlatformData4AM = ' + JSON.stringify(fourAmData, null, 2) + ';\n', 'utf8');
fs.writeFileSync('scratch/test_registry_4am.js', '/** mordix_ai — 4AM Registry */\nwindow.PlatformRegistry4AM = ' + JSON.stringify(registry4am, null, 2) + ';\n', 'utf8');

console.log('Test files saved to scratch/test_four_am.js and scratch/test_registry_4am.js');
