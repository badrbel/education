const fs = require('fs');
const path = require('path');

global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  if (typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;
  
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  return null;
}

function isSearchUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com/results') || 
         url.includes('google.com/search') || 
         url.includes('search_query=');
}

// Check cross-level contamination keywords
const CROSS_LEVEL_PATTERNS = [
  { pattern: /الأولى ثانوي|1as|1 ثانوي/i, level: '1AS' },
  { pattern: /الثانية ثانوي|2as|2 ثانوي/i, level: '2AS' },
  { pattern: /الثالثة ثانوي|3as|3 ثانوي|بكالوريا|باك |bac\b/i, level: '3AS/BAC' },
  { pattern: /الأولى متوسط|1am|1 متوسط/i, level: '1AM' },
  { pattern: /الثانية متوسط|2am|2 متوسط/i, level: '2AM' },
  { pattern: /الثالثة متوسط|3am|3 متوسط/i, level: '3AM' },
  { pattern: /جامعي|جامعة|السنة الأولى جامعي/i, level: 'UNIVERSITY' }
];

// 4AM confirmation patterns
const LEVEL_4AM_PATTERNS = [
  /رابعة متوسط/i,
  /4 متوسط/i,
  /السنة الرابعة متوسط/i,
  /4am\b/i,
  /bem\b/i,
  /بيام/i,
  /شهادة التعليم المتوسط/i
];

// Collect all unique video items across four_am.js and registry_4am.js
// We also track each unique video occurrence.
const allVideos = [];

// 1. From registry_4am.js
for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (isVideo) {
    allVideos.push({
      origin: 'registry_4am.js',
      key: key,
      id: res.id,
      title: res.title || '',
      url: res.url || res.sourceUrl || '',
      rawVideoId: res.videoId || (res.metadata && res.metadata.videoId) || res.id,
      subjectId: res.subjectId,
      subjectName: res.subjectName,
      lessonId: res.lessonId,
      lessonTitle: res.lessonTitle,
      teacher: (res.source && res.source.name) || res.teacher || '',
      type: res.type
    });
  }
}

// 2. From four_am.js
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  const channelsData = subjData.channelsData || {};
  for (const [lessonName, channels] of Object.entries(channelsData)) {
    // Find canonical lessonId
    const lessonObj = (subjData.lessons || []).find(l => l.title === lessonName || l.lessonTitle === lessonName);
    const lessonId = lessonObj ? (lessonObj.canonical_id || lessonObj.lessonId) : null;

    for (const ch of channels) {
      const vids = ch.videos || [];
      for (const vid of vids) {
        allVideos.push({
          origin: 'four_am.js (channelsData)',
          key: vid.id,
          id: vid.id,
          title: vid.title || '',
          url: vid.url || (vid.id ? `https://www.youtube.com/watch?v=${vid.id}` : ''),
          rawVideoId: vid.videoId || vid.id,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lessonId,
          lessonTitle: lessonName,
          teacher: vid.teacher || ch.channel || '',
          type: 'video'
        });
      }
    }
  }

  // Also check exercisesData
  const exercisesData = subjData.exercisesData || {};
  for (const [lessonName, exercises] of Object.entries(exercisesData)) {
    const lessonObj = (subjData.lessons || []).find(l => l.title === lessonName || l.lessonTitle === lessonName);
    const lessonId = lessonObj ? (lessonObj.canonical_id || lessonObj.lessonId) : null;
    for (const ex of exercises) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        allVideos.push({
          origin: 'four_am.js (exercisesData)',
          key: ex.id,
          id: ex.id,
          title: ex.title || '',
          url: ex.url || '',
          rawVideoId: ex.videoId || (ex.metadata && ex.metadata.videoId) || ex.id,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lessonId,
          lessonTitle: lessonName,
          teacher: ex.teacher || ex.channel || '',
          type: 'exercise'
        });
      }
    }
  }
}

console.log(`Total video instances across both sources: ${allVideos.length}`);

// Perform Audit on each instance
const auditedList = [];

let countTotal = allVideos.length;
let countRealVideoId = 0;
let countSearchUrls = 0;
let countInvalidUrls = 0;
let countMatchConfirmed = 0;
let countMatchProbable = 0;
let countNeedsVerification = 0;
let countUnlinkedLesson = 0;

const manualReviewList = [];
const rejectList = [];

for (const item of allVideos) {
  const extractedId = extractVideoId(item.rawVideoId) || extractVideoId(item.url);
  const isSearch = isSearchUrl(item.url);
  const hasValidVideoId = !!(extractedId && YOUTUBE_ID_REGEX.test(extractedId));

  if (isSearch) countSearchUrls++;
  if (!hasValidVideoId || isSearch) countInvalidUrls++;
  else countRealVideoId++;

  // Curriculum linkage analysis
  const title = item.title;
  const lesson = item.lessonTitle || '';
  const subject = item.subjectName || '';
  const teacher = item.teacher || '';

  // Check cross-level contamination
  let crossLevelDetected = null;
  for (const cl of CROSS_LEVEL_PATTERNS) {
    if (cl.pattern.test(title)) {
      crossLevelDetected = cl.level;
      break;
    }
  }

  // Check 4AM confirmation
  let has4AMMention = LEVEL_4AM_PATTERNS.some(p => p.test(title));

  // Check lesson relevance
  let lessonRelevance = false;
  // Clean lesson words for matching
  const cleanLesson = lesson.replace(/[-–—/\\()0-9.]/g, ' ').trim();
  const lessonKeywords = cleanLesson.split(/\s+/).filter(w => w.length > 2 && !['في', 'على', 'من', 'إلى', 'عن', 'مع', 'أو', 'و'].includes(w));
  
  let matchScore = 0;
  for (const kw of lessonKeywords) {
    if (title.includes(kw)) matchScore++;
  }

  // Specific lesson name check
  if (title.includes(lesson) || (lessonKeywords.length > 0 && matchScore >= Math.min(2, lessonKeywords.length))) {
    lessonRelevance = true;
  }

  // Classification decision
  let status = 'NEEDS_VERIFICATION';
  let auditNotes = [];

  if (crossLevelDetected) {
    status = 'NEEDS_VERIFICATION';
    auditNotes.push(`CROSS_LEVEL_WARNING: Title mentions "${crossLevelDetected}"`);
    manualReviewList.push({
      ...item,
      extractedId,
      status,
      reason: `Mention of other level: ${crossLevelDetected}`
    });
  } else if (!lesson) {
    countUnlinkedLesson++;
    status = 'NEEDS_VERIFICATION';
    auditNotes.push('UNLINKED_LESSON: No lessonTitle associated');
    manualReviewList.push({
      ...item,
      extractedId,
      status,
      reason: 'No lesson linked'
    });
  } else if (has4AMMention && lessonRelevance) {
    status = 'MATCH_CONFIRMED';
    countMatchConfirmed++;
  } else if (has4AMMention || lessonRelevance) {
    status = 'MATCH_PROBABLE';
    countMatchProbable++;
  } else {
    // Neither 4AM explicit mention nor direct lesson keyword match in title
    status = 'NEEDS_VERIFICATION';
    countNeedsVerification++;
    auditNotes.push('TITLE_DIVERGENCE: Title has neither explicit 4AM tag nor primary lesson keywords');
    manualReviewList.push({
      ...item,
      extractedId,
      status,
      reason: 'Title does not explicitly mention 4AM or direct lesson keywords'
    });
  }

  auditedList.push({
    ...item,
    extractedId,
    hasValidVideoId,
    isSearch,
    status,
    crossLevelDetected,
    auditNotes
  });
}

console.log('--- AUDIT SUMMARY ---');
console.log(`Total 4AM video items audited: ${countTotal}`);
console.log(`Real 11-char Video ID: ${countRealVideoId}`);
console.log(`Search URLs: ${countSearchUrls}`);
console.log(`Invalid URLs: ${countInvalidUrls}`);
console.log(`MATCH_CONFIRMED: ${countMatchConfirmed}`);
console.log(`MATCH_PROBABLE: ${countMatchProbable}`);
console.log(`NEEDS_VERIFICATION: ${countNeedsVerification + manualReviewList.filter(m => m.reason.includes('CROSS_LEVEL')).length + countUnlinkedLesson}`);
console.log(`Unlinked to lesson: ${countUnlinkedLesson}`);
console.log(`Manual review list count: ${manualReviewList.length}`);
console.log(`Direct reject list count: ${rejectList.length}`);

// Unique by VideoId analysis
console.log('\n--- UNIQUE VIDEO ID AUDIT ---');
const uniqueVideos = new Map();
for (const item of auditedList) {
  const vidId = item.extractedId || item.id;
  if (!uniqueVideos.has(vidId)) {
    uniqueVideos.set(vidId, item);
  }
}
console.log(`Unique video IDs audited: ${uniqueVideos.size}`);

// Write full audit result to JSON for inspection
fs.writeFileSync('scratch/audit_results_details.json', JSON.stringify({
  summary: {
    countTotal,
    uniqueVideosCount: uniqueVideos.size,
    countRealVideoId,
    countSearchUrls,
    countInvalidUrls,
    countMatchConfirmed,
    countMatchProbable,
    countNeedsVerification,
    countUnlinkedLesson,
    manualReviewCount: manualReviewList.length,
    rejectCount: rejectList.length
  },
  manualReviewList,
  rejectList
}, null, 2), 'utf8');

console.log('Written to scratch/audit_results_details.json');
