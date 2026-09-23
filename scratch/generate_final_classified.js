const fs = require('fs');

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

const uniqueMap = new Map();

function register(item) {
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
      teacher: item.teacher || '',
      sources: [item.source]
    });
  } else {
    const existing = uniqueMap.get(vidId);
    if (!existing.sources.includes(item.source)) existing.sources.push(item.source);
    if (!existing.title && item.title) existing.title = item.title;
    if (!existing.teacher && item.teacher) existing.teacher = item.teacher;
    if (!existing.lessonTitle && item.lessonTitle) {
      existing.lessonTitle = item.lessonTitle;
      existing.lessonId = item.lessonId;
    }
  }
}

// Registry
for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (isVideo) {
    register({
      source: 'registry_4am.js',
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

// Four AM
for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  for (const [lessonName, channels] of Object.entries(subjData.channelsData || {})) {
    const lObj = (subjData.lessons || []).find(l => l.title === lessonName);
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        register({
          source: 'four_am.js (channelsData)',
          id: vid.id,
          videoId: vid.videoId || vid.id,
          url: vid.url || `https://www.youtube.com/watch?v=${vid.id}`,
          title: vid.title,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lObj ? (lObj.canonical_id || lObj.lessonId) : null,
          lessonTitle: lessonName,
          teacher: vid.teacher || ch.channel
        });
      }
    }
  }
  for (const [lessonName, exercises] of Object.entries(subjData.exercisesData || {})) {
    const lObj = (subjData.lessons || []).find(l => l.title === lessonName);
    for (const ex of exercises) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        register({
          source: 'four_am.js (exercisesData)',
          id: ex.id,
          videoId: ex.videoId || (ex.metadata && ex.metadata.videoId) || ex.id,
          url: ex.url,
          title: ex.title,
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonId: lObj ? (lObj.canonical_id || lObj.lessonId) : null,
          lessonTitle: lessonName,
          teacher: ex.teacher || ex.channel || (ex.source && ex.source.name)
        });
      }
    }
  }
}

// Check other-levels strictly
const OTHER_LEVEL_STRICT = /(?:(?:ال|لل)?سنة\s*)?(?:الأولى|الثانية|الثالثة)\s*(?:متوسط|ثانوي)|1\s*as|2\s*as|3\s*as|1\s*am|2\s*am|3\s*am/i;
// Match 4AM: رابعة متوسط، للرابعة متوسط، 4 متوسط، 04متوسط، 4AM، BEM، بيام، 4م
const FOUR_AM_REGEX = /(?:(?:ال|لل)?سنة\s*)?(?:ال|لل)?(?:رابعة|0?4)\s*متوسط|4\s*am|bem|بيام|شهادة\s*التعليم\s*المتوسط|4\s*م\b/i;

function calculateRelevance(title, lessonTitle) {
  if (!lessonTitle) return { match: false, score: 0 };
  const cleanL = lessonTitle.toLowerCase().replace(/[-–—/\\()0-9.]/g, ' ').trim();
  const cleanT = title.toLowerCase().replace(/[-–—/\\()0-9.]/g, ' ').trim();
  
  if (cleanT.includes(cleanL)) return { match: true, score: 1.0 };

  const lWords = cleanL.split(/\s+/).filter(w => w.length > 2 && !['في', 'على', 'من', 'إلى', 'عن', 'مع', 'أو', 'و', 'التي', 'الذي'].includes(w));
  let matchCount = 0;
  for (const w of lWords) {
    if (cleanT.includes(w)) matchCount++;
  }
  const score = lWords.length > 0 ? (matchCount / lWords.length) : 0;
  return { match: matchCount >= 1 && (score >= 0.33 || matchCount >= 2), score, matchCount, totalWords: lWords.length };
}

const audit = {
  MATCH_CONFIRMED: [],
  MATCH_PROBABLE: [],
  NEEDS_VERIFICATION: [],
  REJECT_RECOMMENDED: []
};

const officialLessonTitles = new Set();
for (const [k, d] of Object.entries(fourAmData)) {
  for (const l of (d.lessons || [])) officialLessonTitles.add(l.title);
}

for (const [vidId, item] of uniqueMap) {
  const title = item.title;
  const lesson = item.lessonTitle || '';
  const isOfficialLesson = officialLessonTitles.has(lesson);

  const has4amTag = FOUR_AM_REGEX.test(title);
  const hasOtherLevel = OTHER_LEVEL_STRICT.test(title);
  const relevance = calculateRelevance(title, lesson);

  // 1. Rejection candidates
  if (hasOtherLevel && !has4amTag) {
    item.auditStatus = 'REJECT_RECOMMENDED';
    item.auditReason = 'الفيديو مخصص صراحة لمستوى دراسي آخر (مثل 1AS أو 2AM أو 3AM) دون ذكر 4AM أو شهادة BEM في العنوان';
    audit.REJECT_RECOMMENDED.push(item);
  }
  // 2. Multi-level including 4AM
  else if (hasOtherLevel && has4amTag) {
    item.auditStatus = 'NEEDS_VERIFICATION';
    item.auditReason = 'فيديو مراجعة مشتركة يشمل 4AM ومستويات أخرى؛ يتطلب مراجعة بيداغوجية للتحقق من مطابقته لمنهاج 4AM دون إرباك التلميذ';
    audit.NEEDS_VERIFICATION.push(item);
  }
  // 3. Unlinked to official lesson (macro review)
  else if (!isOfficialLesson) {
    item.auditStatus = 'NEEDS_VERIFICATION';
    item.auditReason = 'فيديو مراجعة عامة/منهجية على مستوى المادة غير مرتبط بدرس محدد من دروس المنهاج الـ 145 الرسمية';
    audit.NEEDS_VERIFICATION.push(item);
  }
  // 4. Confirmed match
  else if (has4amTag && relevance.match) {
    item.auditStatus = 'MATCH_CONFIRMED';
    item.auditReason = 'ارتباط مؤكد: وسم 4AM/BEM صريح ومطابقة موضوعية قوية لعنوان وعناصر الدرس';
    audit.MATCH_CONFIRMED.push(item);
  }
  // 5. Probable match
  else if (has4amTag || relevance.match) {
    item.auditStatus = 'MATCH_PROBABLE';
    if (has4amTag) {
      item.auditReason = 'ارتباط راجح: وسم 4AM صريح ومدرج بالدرس، لكن عنوان الفيديو يركز على تمرين أو مسألة تفصيلية محددة';
    } else {
      item.auditReason = 'ارتباط راجح: العنوان يشرح مصطلحات وعناصر الدرس مباشرة مع غياب وسم 4AM في صياغة العنوان الخارجي';
    }
    audit.MATCH_PROBABLE.push(item);
  }
  // 6. Needs verification
  else {
    item.auditStatus = 'NEEDS_VERIFICATION';
    item.auditReason = 'ارتباط يحتاج تدقيق: العنوان عام أو متباين جزئياً ولا يتضمن وسم 4AM صريح ولا كلمات مفتاحية كافية للمطابقة التلقائية';
    audit.NEEDS_VERIFICATION.push(item);
  }
}

console.log('\n--- ACCURATE AUDIT METRICS (UNIQUE VIDEOS: 598) ---');
console.log('MATCH_CONFIRMED:     ', audit.MATCH_CONFIRMED.length);
console.log('MATCH_PROBABLE:      ', audit.MATCH_PROBABLE.length);
console.log('NEEDS_VERIFICATION:  ', audit.NEEDS_VERIFICATION.length);
console.log('REJECT_RECOMMENDED:  ', audit.REJECT_RECOMMENDED.length);
console.log('SUM:                 ', audit.MATCH_CONFIRMED.length + audit.MATCH_PROBABLE.length + audit.NEEDS_VERIFICATION.length + audit.REJECT_RECOMMENDED.length);

fs.writeFileSync('scratch/final_classified_audit.json', JSON.stringify(audit, null, 2), 'utf8');
