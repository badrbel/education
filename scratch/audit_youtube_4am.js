const fs = require('fs');
const path = require('path');

// Mock window
global.window = {};

require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

console.log('--- 1. data/four_am.js summary ---');
let fourAmVideoCount = 0;
const fourAmVideos = [];

for (const [subjKey, subjData] of Object.entries(fourAmData)) {
  const channelsData = subjData.channelsData || {};
  for (const [lessonName, channels] of Object.entries(channelsData)) {
    for (const ch of channels) {
      const vids = ch.videos || [];
      for (const vid of vids) {
        fourAmVideoCount++;
        fourAmVideos.push({
          sourceDataset: 'data/four_am.js channelsData',
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonTitle: lessonName,
          channel: ch.channel,
          channelUrl: ch.channelUrl,
          id: vid.id,
          videoId: vid.videoId || vid.youtubeId || vid.id,
          title: vid.title,
          duration: vid.duration,
          teacher: vid.teacher,
          url: vid.url || (vid.id ? `https://www.youtube.com/watch?v=${vid.id}` : null),
          provenance: vid.provenance,
          rawVid: vid
        });
      }
    }
  }

  // Also check exercisesData if any
  const exercisesData = subjData.exercisesData || {};
  for (const [lessonName, exercises] of Object.entries(exercisesData)) {
    for (const ex of exercises) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        fourAmVideoCount++;
        fourAmVideos.push({
          sourceDataset: 'data/four_am.js exercisesData',
          subjectId: subjData.id,
          subjectName: subjData.name,
          lessonTitle: lessonName,
          channel: ex.channel || ex.teacher || (ex.source && ex.source.name),
          id: ex.id,
          videoId: ex.videoId || ex.youtubeId || (ex.metadata && ex.metadata.videoId),
          title: ex.title,
          url: ex.url,
          rawVid: ex
        });
      }
    }
  }
}
console.log('Total videos found in four_am.js:', fourAmVideoCount);

console.log('--- 2. data/registry_4am.js summary ---');
let regVideoCount = 0;
const registryVideos = [];

for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (isVideo) {
    regVideoCount++;
    registryVideos.push({
      sourceDataset: 'data/registry_4am.js',
      registryKey: key,
      id: res.id,
      resourceId: res.resourceId,
      subjectId: res.subjectId,
      subjectName: res.subjectName,
      lessonId: res.lessonId,
      lessonTitle: res.lessonTitle,
      type: res.type,
      title: res.title,
      url: res.url || res.sourceUrl,
      source: res.source,
      auditStatus: res.auditStatus,
      rawRes: res
    });
  }
}
console.log('Total YouTube/video resources found in registry_4am.js:', regVideoCount);

// Check overlap/correlation between registry and four_am
console.log('\n--- Checking overlap between four_am.js and registry_4am.js ---');
const fourAmIds = new Set(fourAmVideos.map(v => v.videoId || v.id));
const regIds = new Set(registryVideos.map(v => {
  if (v.rawRes.metadata && v.rawRes.metadata.videoId) return v.rawRes.metadata.videoId;
  if (v.rawRes.videoId) return v.rawRes.videoId;
  if (v.url) {
    const match = v.url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return v.id;
}));

console.log('Unique video IDs in four_am.js:', fourAmIds.size);
console.log('Unique video IDs in registry_4am.js:', regIds.size);

// Save to scratch for analysis
fs.writeFileSync('scratch/all_4am_videos_dump.json', JSON.stringify({
  fourAmVideos,
  registryVideos
}, null, 2), 'utf8');

console.log('Dump written to scratch/all_4am_videos_dump.json');
