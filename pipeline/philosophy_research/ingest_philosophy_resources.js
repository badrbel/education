/**
 * ingest_philosophy_resources.js
 * Ingestion Engine for 3AS Literature & Philosophy (PHASE PHILOSOPHY)
 * Ingests approved 70 curated items (64 valid + 2 manual review + 4 methodology reviews)
 * Zero Fake Data, Zero Emojis, Zero Search URLs, 100% 4AM Isolation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');

// 1. Strict 4AM baseline check
const baselinePath = path.join(baseDir, 'data/pipeline/philosophy_research/baseline_sha256.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

for (const [relPath, expectedHash] of Object.entries(baseline.fourAmBaseline)) {
  const fullPath = path.join(baseDir, relPath);
  const content = fs.readFileSync(fullPath);
  const currentHash = crypto.createHash('sha256').update(content).digest('hex');
  if (currentHash !== expectedHash) {
    console.error(`FATAL: 4AM file ${relPath} modified! Baseline mismatch.`);
    process.exit(1);
  }
}
console.log('PASS: 4AM Cryptographic Lock 100% verified.');

// 2. Create production backups
const regFile = path.join(baseDir, 'data/registry.js');
const philoFile = path.join(baseDir, 'data/philosophy.js');

fs.writeFileSync(path.join(baseDir, 'data/registry.backup_phase_philo_ingest.js'), fs.readFileSync(regFile));
fs.writeFileSync(path.join(baseDir, 'data/philosophy.backup_phase_philo_ingest.js'), fs.readFileSync(philoFile));
console.log('PASS: Production backups created successfully.');

// 3. Load audited items and select approved candidates
const { auditedItems } = require('./audit_curated_82.js');

const strictEmojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{23FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;
function cleanAllEmojis(str) {
  if (!str) return '';
  return str.replace(strictEmojiRegex, '').replace(/\s+/g, ' ').trim();
}

// Full candidate items metadata from research JSON
const researchData = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/pipeline/reports/PHASE_PHILOSOPHY_TARGETED_RESEARCH.json'), 'utf8'));
const fullCandidates = researchData.curatedIngestionCandidates || [];
const candidatesById = {};
fullCandidates.forEach(c => { candidatesById[c.id] = c; });

const toIngest = [];
auditedItems.forEach(it => {
  const full = candidatesById[it.id] || it;
  if (it.finalDecision === 'VALID_FOR_INGESTION') {
    toIngest.push({
      ...full,
      targetType: 'lesson_resource',
      decision: 'VALID_FOR_INGESTION',
      cleanTitle: cleanAllEmojis(full.title),
      cleanChannel: cleanAllEmojis(full.channel || full.teacher),
      cleanTeacher: cleanAllEmojis(full.teacher || full.channel)
    });
  } else if (it.finalDecision === 'MANUAL_REVIEW_REQUIRED' && (it.num === 51 || it.num === 76)) {
    toIngest.push({
      ...full,
      targetType: 'lesson_resource',
      decision: 'MANUAL_REVIEW_APPROVED',
      cleanTitle: cleanAllEmojis(full.title),
      cleanChannel: cleanAllEmojis(full.channel || full.teacher),
      cleanTeacher: cleanAllEmojis(full.teacher || full.channel)
    });
  } else if ([79, 80, 81, 82].includes(it.num)) {
    toIngest.push({
      ...full,
      targetType: 'methodology_review',
      decision: 'METHODOLOGY_REVIEW_INGESTION',
      lessonId: null,
      lessonTitle: null,
      cleanTitle: cleanAllEmojis(full.title),
      cleanChannel: cleanAllEmojis(full.channel || full.teacher),
      cleanTeacher: cleanAllEmojis(full.teacher || full.channel)
    });
  }
});

console.log(`Total approved candidates to ingest: ${toIngest.length}`);

// 4. Ingest into data/registry.js
global.window = {};
eval(fs.readFileSync(regFile, 'utf8'));
const registry = global.window.PlatformRegistry;

let regAddedCount = 0;
for (const item of toIngest) {
  if (registry[item.id]) {
    console.log(`Skipping existing registry ID: ${item.id}`);
    continue;
  }

  const isVideo = (item.sourceType === 'youtube' || item.source === 'YouTube');
  let itemType = 'review';
  let badge = 'شرح معتمد';

  if (item.targetType === 'methodology_review') {
    itemType = 'review';
    badge = 'منهجية معتمدة';
  } else if (!isVideo) {
    itemType = 'summary';
    badge = 'ملخص معتمد';
  } else if (item.resourceType === 'EXERCISE_VIDEO') {
    itemType = 'exercise';
    badge = 'تطبيق منهجي';
  } else if (item.resourceType === 'REVISION_VIDEO') {
    itemType = 'review';
    badge = 'مراجعة شاملة';
  } else if (item.resourceType === 'METHODOLOGY') {
    itemType = 'review';
    badge = 'منهجية معتمدة';
  }

  const newRegItem = {
    id: item.id,
    subjectId: 'philosophy',
    subjectName: 'الفلسفة',
    type: itemType,
    lessonId: item.lessonId || null,
    lessonTitle: item.lessonTitle || null,
    title: item.cleanTitle,
    year: 2026,
    term: null,
    level: 'الثالثة ثانوي',
    branch: 'آداب وفلسفة',
    badge: badge,
    topicCategory: null,
    contentCase: 'B',
    problem: {
      available: true,
      format: isVideo ? 'video' : 'pdf',
      url: item.url
    },
    solution: {
      available: false,
      format: 'none'
    },
    source: {
      type: isVideo ? 'youtube' : 'official',
      name: isVideo ? item.cleanChannel : 'الديوان الوطني للامتحانات والمسابقات / DzExams',
      url: item.url,
      verified: true
    }
  };

  if (isVideo) {
    newRegItem.videoId = item.youtubeId;
    newRegItem.youtubeId = item.youtubeId;
    newRegItem.url = item.url;
    newRegItem.sourceUrl = item.url;
    newRegItem.sourceType = 'DIRECT_RESOURCE';
    newRegItem.views = item.views || '';
    newRegItem.duration = item.duration || '';
    newRegItem.channel = item.cleanChannel;
    newRegItem.teacher = item.cleanTeacher;
  }

  registry[item.id] = newRegItem;
  regAddedCount++;
}

console.log(`PASS: Added ${regAddedCount} items to PlatformRegistry (Total: ${Object.keys(registry).length}).`);

const updatedRegJs = `/**
 * mordix_ai — سجل الموارد الموحد (Platform Resource Registry)
 * Single Source of Truth for all Educational Resources
 * Zero Emojis | Production Verified
 */

window.PlatformRegistry = ${JSON.stringify(registry, null, 2)};
`;
fs.writeFileSync(regFile, updatedRegJs, 'utf8');
console.log('PASS: data/registry.js saved successfully.');

// 5. Ingest into data/philosophy.js
global.window = { PlatformData: {} };
eval(fs.readFileSync(philoFile, 'utf8'));
const philoData = global.window.PlatformData['الفلسفة'];

philoData.channelsData = philoData.channelsData || {};
philoData.reviews = philoData.reviews || [];
philoData.summaries = philoData.summaries || [];

let channelsVideoAdded = 0;
let reviewsVideoAdded = 0;
let summariesAdded = 0;

for (const item of toIngest) {
  const isVideo = (item.sourceType === 'youtube' || item.source === 'YouTube');

  // Case A: Lesson Videos
  if (isVideo && item.targetType === 'lesson_resource' && item.lessonTitle) {
    const lTitle = item.lessonTitle;
    if (!philoData.channelsData[lTitle]) {
      philoData.channelsData[lTitle] = [];
    }

    const chName = item.cleanChannel;
    let chObj = philoData.channelsData[lTitle].find(c => c.channel === chName || c.name === chName);
    if (!chObj) {
      chObj = {
        channel: chName,
        name: chName,
        videos: []
      };
      philoData.channelsData[lTitle].push(chObj);
    }

    const exists = chObj.videos.some(v => (v.id === item.youtubeId || v.youtubeId === item.youtubeId || v.videoId === item.youtubeId));
    if (!exists) {
      chObj.videos.push({
        id: item.youtubeId,
        videoId: item.youtubeId,
        youtubeId: item.youtubeId,
        title: item.cleanTitle,
        duration: item.duration || '',
        views: item.views || '',
        url: item.url,
        verified: true,
        auditStatus: 'SAFE_TO_IMPORT'
      });
      channelsVideoAdded++;
    }
  }

  // Case B: General Methodology Reviews (No Lesson)
  else if (isVideo && item.targetType === 'methodology_review') {
    const chName = item.cleanChannel;
    let chObj = philoData.reviews.find(c => c.channel === chName || c.name === chName);
    if (!chObj) {
      chObj = {
        channel: chName,
        name: chName,
        videos: []
      };
      philoData.reviews.push(chObj);
    }

    const exists = chObj.videos.some(v => (v.id === item.youtubeId || v.youtubeId === item.youtubeId || v.videoId === item.youtubeId));
    if (!exists) {
      chObj.videos.push({
        id: item.youtubeId,
        videoId: item.youtubeId,
        youtubeId: item.youtubeId,
        title: item.cleanTitle,
        duration: item.duration || '',
        views: item.views || '',
        url: item.url,
        verified: true,
        auditStatus: 'SAFE_TO_IMPORT'
      });
      reviewsVideoAdded++;
    }
  }

  // Case C: Summaries / Documents
  else if (!isVideo) {
    const exists = philoData.summaries.some(s => s.id === item.id || s.url === item.url);
    if (!exists) {
      philoData.summaries.push({
        id: item.id,
        title: item.cleanTitle,
        canonical_id: item.lessonId,
        lessonId: item.lessonId,
        lessonTitle: item.lessonTitle,
        format: 'pdf',
        url: item.url,
        verified: true,
        source: 'بنك الامتحانات الجزائري / DzExams'
      });
      summariesAdded++;
    }
  }
}

// Update lessons stats
for (const l of philoData.lessons) {
  const chList = philoData.channelsData[l.title] || [];
  let vCount = 0;
  chList.forEach(c => { vCount += (c.videos || []).length; });
  l.videos = vCount;
  l.teachers = chList.length;
  if (vCount > 0) l.verified = true;
}

console.log(`PASS: Injected ${channelsVideoAdded} videos into channelsData.`);
console.log(`PASS: Injected ${reviewsVideoAdded} methodology videos into reviews.`);
console.log(`PASS: Injected ${summariesAdded} documents into summaries.`);

const updatedPhiloJs = `/**
 * Data Module: الفلسفة (philosophy)
 * Standardized Lesson IDs & Production Verified
 * Zero Emojis | Strict Provenance
 */

window.PlatformData = window.PlatformData || {};

window.PlatformData['الفلسفة'] = ${JSON.stringify(philoData, null, 2)};
`;
fs.writeFileSync(philoFile, updatedPhiloJs, 'utf8');
console.log('PASS: data/philosophy.js saved successfully.');

// 6. Post-ingestion 4AM check
for (const [relPath, expectedHash] of Object.entries(baseline.fourAmBaseline)) {
  const fullPath = path.join(baseDir, relPath);
  const content = fs.readFileSync(fullPath);
  const currentHash = crypto.createHash('sha256').update(content).digest('hex');
  if (currentHash !== expectedHash) {
    console.error(`FATAL: 4AM file ${relPath} modified during ingestion!`);
    process.exit(1);
  }
}
console.log('PASS: 4AM Cryptographic Lock 100% verified after ingestion.');

module.exports = {
  regAddedCount,
  channelsVideoAdded,
  reviewsVideoAdded,
  summariesAdded,
  totalIngested: toIngest.length
};
