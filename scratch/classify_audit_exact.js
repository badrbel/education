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

// Extract all unique video records across four_am.js and registry_4am.js
const uniqueMap = new Map();

// Helper to register
function registerVideo(item) {
  const vidId = extractVideoId(item.videoId) || extractVideoId(item.url) || extractVideoId(item.id);
  if (!vidId) return;

  if (!uniqueMap.has(vidId)) {
    uniqueMap.set(vidId, {
      videoId: vidId,
      url: item.url || `https://www.youtube.com/watch?v=${vidId}`,
      title: item.title || '',
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      lessonId: item.lessonId,
      lessonTitle: item.lessonTitle,
      teacher: item.teacher || (item.source && item.source.name) || '',
      occurrences: [item.origin]
    });
  } else {
    const existing = uniqueMap.get(vidId);
    if (!existing.occurrences.includes(item.origin)) {
      existing.occurrences.push(item.origin);
    }
    if (!existing.title && item.title) existing.title = item.title;
    if (!existing.teacher && item.teacher) existing.teacher = item.teacher;
    if (!existing.lessonTitle && item.lessonTitle) {
      existing.lessonTitle = item.lessonTitle;
      existing.lessonId = item.lessonId;
    }
  }
}

// 1. Scan registry_4am.js
for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (isVideo) {
    registerVideo({
      origin: 'registry_4am.js',
      id: res.id,
      videoId: res.videoId || (res.metadata && res.metadata.videoId) || res.id,
      url: res.url || res.sourceUrl,
      title: res.title,
      subjectId: res.subjectId,
      subjectName: res.subjectName,
      lessonId: res.lessonId,
      lessonTitle: res.lessonTitle,
      teacher: (res.source && res.source.name) || res.teacher
    });
  }
}

// 2. Scan four_am.js
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  const channelsData = subjData.channelsData || {};
  for (const [lessonName, channels] of Object.entries(channelsData)) {
    const lessonObj = (subjData.lessons || []).find(l => l.title === lessonName || l.lessonTitle === lessonName);
    const lessonId = lessonObj ? (lessonObj.canonical_id || lessonObj.lessonId) : null;
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        registerVideo({
          origin: 'four_am.js (channelsData)',
          id: vid.id,
          videoId: vid.videoId || vid.id,
          url: vid.url || `https://www.youtube.com/watch?v=${vid.id}`,
          title: vid.title,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lessonId,
          lessonTitle: lessonName,
          teacher: vid.teacher || ch.channel
        });
      }
    }
  }

  const exercisesData = subjData.exercisesData || {};
  for (const [lessonName, exercises] of Object.entries(exercisesData)) {
    const lessonObj = (subjData.lessons || []).find(l => l.title === lessonName || l.lessonTitle === lessonName);
    const lessonId = lessonObj ? (lessonObj.canonical_id || lessonObj.lessonId) : null;
    for (const ex of exercises) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        registerVideo({
          origin: 'four_am.js (exercisesData)',
          id: ex.id,
          videoId: ex.videoId || (ex.metadata && ex.metadata.videoId) || ex.id,
          url: ex.url,
          title: ex.title,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lessonId,
          lessonTitle: lessonName,
          teacher: ex.teacher || ex.channel || (ex.source && ex.source.name)
        });
      }
    }
  }
}

console.log(`Total unique YouTube videos cataloged: ${uniqueMap.size}`);

// Check for dummy or placeholder video IDs
const dummyCandidates = [];
for (const [vId, item] of uniqueMap) {
  if (/^(.)\1+$/.test(vId) || vId.toLowerCase().includes('dummy') || vId.toLowerCase().includes('placeholder')) {
    dummyCandidates.push(item);
  }
}
console.log('Dummy ID candidates:', dummyCandidates.length);

// Audit classification
const classified = {
  MATCH_CONFIRMED: [],
  MATCH_PROBABLE: [],
  NEEDS_VERIFICATION: [],
  REJECT_RECOMMENDED: []
};

// Patterns
const LEVEL_4AM_REGEX = /4\s*متوسط|رابعة\s*متوسط|السنة\s*الرابعة\s*متوسط|4\s*am\b|bem\b|بيام|شهادة\s*التعليم\s*المتوسط/i;

// Strict other-level regex (excluding 4AM)
function checkExplicitOtherLevel(title) {
  // If title has 4AM or BEM, it might be a multi-level review
  const has4am = LEVEL_4AM_REGEX.test(title);

  if (/الأولى\s*ثانوي|1\s*as\b|1\s*ثانوي/i.test(title) && !has4am) {
    return { level: '1AS (الأولى ثانوي)', reject: true };
  }
  if (/الثانية\s*ثانوي|2\s*as\b|2\s*ثانوي/i.test(title) && !has4am) {
    return { level: '2AS (الثانية ثانوي)', reject: true };
  }
  if (/الثالثة\s*ثانوي|3\s*as\b|3\s*ثانوي|بكالوريا|باك\s+|bac\b/i.test(title) && !has4am) {
    return { level: '3AS/BAC (الثالثة ثانوي / بكالوريا)', reject: true };
  }
  if (/السنة\s*الأولى\s*متوسط|1\s*متوسط|1\s*am\b/i.test(title) && !has4am) {
    return { level: '1AM (الأولى متوسط)', reject: true };
  }
  if (/السنة\s*الثانية\s*متوسط|2\s*متوسط|2\s*am\b/i.test(title) && !has4am) {
    return { level: '2AM (الثانية متوسط)', reject: true };
  }
  if (/السنة\s*الثالثة\s*متوسط|3\s*متوسط|3\s*am\b/i.test(title) && !has4am) {
    return { level: '3AM (الثالثة متوسط)', reject: true };
  }

  // Multi-level cases that mention 4AM as well
  if (/1\s*am|2\s*am|3\s*am|الثانية\s*متوسط|الثالثة\s*متوسط|باك/i.test(title) && has4am) {
    return { level: 'MULTI_LEVEL_INCL_4AM', reject: false };
  }

  return null;
}

// Function to calculate title-lesson relevance
function calculateLessonRelevance(title, lessonTitle) {
  if (!lessonTitle) return { match: false, score: 0 };
  const cleanL = lessonTitle.toLowerCase().replace(/[-–—/\\()0-9.]/g, ' ').trim();
  const cleanT = title.toLowerCase().replace(/[-–—/\\()0-9.]/g, ' ').trim();
  
  if (cleanT.includes(cleanL)) return { match: true, score: 10 };

  const lWords = cleanL.split(/\s+/).filter(w => w.length > 2 && !['في', 'على', 'من', 'إلى', 'عن', 'مع', 'أو', 'و', 'التي', 'الذي'].includes(w));
  let matchCount = 0;
  for (const w of lWords) {
    if (cleanT.includes(w)) matchCount++;
  }

  const score = lWords.length > 0 ? (matchCount / lWords.length) : 0;
  return { match: matchCount >= 1 && (score >= 0.33 || matchCount >= 2), score, matchCount, totalWords: lWords.length };
}

for (const [vidId, item] of uniqueMap) {
  const title = item.title;
  const lesson = item.lessonTitle || '';
  const has4amTag = LEVEL_4AM_REGEX.test(title);
  const otherLevel = checkExplicitOtherLevel(title);
  const relevance = calculateLessonRelevance(title, lesson);

  // Check 1: Explicit other level without 4AM tag -> REJECT_RECOMMENDED
  if (otherLevel && otherLevel.reject) {
    item.status = 'REJECT_RECOMMENDED';
    item.auditReason = `فيديو خاص بمستوى آخر (${otherLevel.level}) دون ذكر 4AM أو BEM في العنوان`;
    classified.REJECT_RECOMMENDED.push(item);
  }
  // Check 2: Multi-level including 4AM -> NEEDS_VERIFICATION
  else if (otherLevel && !otherLevel.reject) {
    item.status = 'NEEDS_VERIFICATION';
    item.auditReason = `فيديو مشترك متعدد المستويات يشمل 4AM (${otherLevel.level}) ويحتاج مراجعة دقة التطابق مع المنهاج`;
    classified.NEEDS_VERIFICATION.push(item);
  }
  // Check 3: Missing lesson link
  else if (!lesson) {
    item.status = 'NEEDS_VERIFICATION';
    item.auditReason = `فيديو غير مرتبط بعنوان درس محدد`;
    classified.NEEDS_VERIFICATION.push(item);
  }
  // Check 4: Explicit 4AM + Lesson match -> MATCH_CONFIRMED
  else if (has4amTag && relevance.match) {
    item.status = 'MATCH_CONFIRMED';
    item.auditReason = `تطابق مؤكد: العنوان يذكر صراحة 4AM/BEM ويتطابق موضوعياً مع الدرس (${lesson})`;
    classified.MATCH_CONFIRMED.push(item);
  }
  // Check 5: Explicit 4AM tag OR strong lesson keyword relevance -> MATCH_PROBABLE
  else if (has4amTag || relevance.match) {
    item.status = 'MATCH_PROBABLE';
    if (has4amTag) {
      item.auditReason = `تطابق راجح: الفيديو مخصص صراحة لـ 4AM/BEM ومدرج تحت الدرس (${lesson}) مع اختلاف طفيف في الصياغة`;
    } else {
      item.auditReason = `تطابق راجح: عنوان الفيديو يشرح عناصر الدرس (${lesson}) مباشرة دون ذكر وسم 4AM في العنوان الخارجي`;
    }
    classified.MATCH_PROBABLE.push(item);
  }
  // Check 6: Title does not have 4AM tag AND does not match lesson keywords -> NEEDS_VERIFICATION
  else {
    item.status = 'NEEDS_VERIFICATION';
    item.auditReason = `يحتاج مراجعة: العنوان عام أو متباين عن عناصر الدرس (${lesson}) ولا يتضمن وسم 4AM صريح`;
    classified.NEEDS_VERIFICATION.push(item);
  }
}

console.log('\n--- CLASSIFICATION RESULTS (UNIQUE VIDEOS: 598) ---');
console.log(`MATCH_CONFIRMED: ${classified.MATCH_CONFIRMED.length}`);
console.log(`MATCH_PROBABLE: ${classified.MATCH_PROBABLE.length}`);
console.log(`NEEDS_VERIFICATION: ${classified.NEEDS_VERIFICATION.length}`);
console.log(`REJECT_RECOMMENDED: ${classified.REJECT_RECOMMENDED.length}`);

// Save to scratch
fs.writeFileSync('scratch/audit_classified.json', JSON.stringify(classified, null, 2), 'utf8');
console.log('Saved to scratch/audit_classified.json');
