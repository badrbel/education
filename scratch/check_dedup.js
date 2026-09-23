const fs = require('fs');
global.window = {};

// Load 3AS
require('../data/registry.js');
require('../data/math.js');
require('../data/arabic.js');
require('../data/french.js');
require('../data/english.js');
require('../data/history.js');
require('../data/islamic.js');

const registry3as = global.window.PlatformRegistry || {};
const data3as = global.window.PlatformData || {};

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  if (typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const videoIds3as = new Set();
for (const [k, r] of Object.entries(registry3as)) {
  if (r.type === 'video' || r.type === 'youtube_video' || (r.url && r.url.includes('youtube'))) {
    const id = extractVideoId(r.videoId) || extractVideoId(r.url) || extractVideoId(r.id);
    if (id) videoIds3as.add(id);
  }
}
for (const [sKey, sData] of Object.entries(data3as)) {
  if (sData && sData.channelsData) {
    for (const [lName, channels] of Object.entries(sData.channelsData)) {
      for (const ch of channels) {
        for (const vid of ch.videos || []) {
          const id = extractVideoId(vid.id) || extractVideoId(vid.videoId) || extractVideoId(vid.url);
          if (id) videoIds3as.add(id);
        }
      }
    }
  }
}
console.log('Total 3AS unique Video IDs:', videoIds3as.size);

// Load 4AM
require('../data/four_am.js');
require('../data/registry_4am.js');
const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const videoOccurrences = new Map();
function track(source, vidId, subjId, subjName, lessonTitle, raw) {
  if (!vidId) return;
  if (!videoOccurrences.has(vidId)) {
    videoOccurrences.set(vidId, {
      videoId: vidId,
      places: []
    });
  }
  videoOccurrences.get(vidId).places.push({
    source,
    subjId,
    subjName,
    lessonTitle,
    raw
  });
}

// Registry 4AM
for (const [k, r] of Object.entries(registry4am)) {
  if (r.type === 'video' || r.type === 'youtube_video' || (r.url && r.url.includes('youtube')) || (r.source && r.source.type === 'youtube')) {
    const id = extractVideoId(r.videoId) || extractVideoId(r.url) || extractVideoId(r.id);
    track('registry_4am.js', id, r.subjectId, r.subjectName, r.lessonTitle, r);
  }
}

// four_am channelsData
for (const [sKey, sData] of Object.entries(fourAmData)) {
  for (const [lName, channels] of Object.entries(sData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        const id = extractVideoId(vid.videoId) || extractVideoId(vid.id) || extractVideoId(vid.url);
        track('four_am.js channelsData', id, sData.id, sData.name, lName, vid);
      }
    }
  }
  // four_am exercisesData
  for (const [lName, exs] of Object.entries(sData.exercisesData || {})) {
    for (const ex of exs) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        const id = extractVideoId(ex.videoId) || extractVideoId(ex.id) || extractVideoId(ex.url);
        track('four_am.js exercisesData', id, sData.id, sData.name, lName, ex);
      }
    }
  }
}

console.log('Total 4AM unique Video IDs tracked:', videoOccurrences.size);

let singlePlaceCount = 0;
let multipleLessonsCount = 0;
let multipleSubjectsCount = 0;
let crossLevelWith3asCount = 0;

const multiLessonList = [];
const multiSubjectList = [];
const cross3asList = [];

for (const [vId, data] of videoOccurrences) {
  if (videoIds3as.has(vId)) {
    crossLevelWith3asCount++;
    cross3asList.push({ vId, data });
  }

  const lessons = new Set(data.places.map(p => p.lessonTitle).filter(Boolean));
  const subjects = new Set(data.places.map(p => p.subjId || p.subjName).filter(Boolean));

  if (lessons.size <= 1 && subjects.size <= 1) {
    singlePlaceCount++;
  }
  if (lessons.size > 1) {
    multipleLessonsCount++;
    multiLessonList.push({ vId, lessons: Array.from(lessons), places: data.places });
  }
  if (subjects.size > 1) {
    multipleSubjectsCount++;
    multiSubjectList.push({ vId, subjects: Array.from(subjects), places: data.places });
  }
}

console.log('\n--- DEDUPLICATION ANALYSIS RESULTS ---');
console.log(`Video ID appearing in exactly 1 lesson/context: ${singlePlaceCount}`);
console.log(`Video ID appearing in multiple lessons: ${multipleLessonsCount}`);
console.log(`Video ID appearing in multiple subjects: ${multipleSubjectsCount}`);
console.log(`Video ID appearing in 4AM AND 3AS: ${crossLevelWith3asCount}`);

if (crossLevelWith3asCount > 0) {
  console.log('Cross 3AS videos:', cross3asList);
}
if (multipleSubjectsCount > 0) {
  console.log('Multiple subjects videos:', multiSubjectList);
}
if (multipleLessonsCount > 0) {
  console.log(`Sample multiple lessons videos (count ${multipleLessonsCount}):`, multiLessonList.slice(0, 5));
}
