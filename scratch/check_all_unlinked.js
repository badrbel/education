global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const unlinkedOrMacroVideos = [];

for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (!isVideo) continue;

  const subjData = fourAmData[res.subjectId];
  if (!subjData) {
    unlinkedOrMacroVideos.push({ key, title: res.title, reason: 'Unknown subjectId ' + res.subjectId });
    continue;
  }

  const lessonTitles = (subjData.lessons || []).map(l => l.title);
  if (!res.lessonTitle || !lessonTitles.includes(res.lessonTitle)) {
    unlinkedOrMacroVideos.push({
      key,
      id: res.id,
      title: res.title,
      subjectName: res.subjectName,
      lessonTitle: res.lessonTitle || 'NONE',
      reason: res.lessonTitle ? 'lessonTitle is not in official lessons array' : 'missing lessonTitle'
    });
  }
}

console.log('Unlinked or Macro videos in registry_4am.js:', unlinkedOrMacroVideos.length);
console.log('Subjects breakdown:', unlinkedOrMacroVideos.reduce((acc, v) => {
  acc[v.subjectName] = (acc[v.subjectName] || 0) + 1;
  return acc;
}, {}));
