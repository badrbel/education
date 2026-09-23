const fs = require('fs');
global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

function extractVidId(str) {
  if (!str) return null;
  const m = str.match(/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const fourAmVidIds = new Set();
for (const [sKey, sData] of Object.entries(fourAmData)) {
  for (const [lName, channels] of Object.entries(sData.channelsData || {})) {
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        const id = extractVidId(vid.videoId) || extractVidId(vid.id) || extractVidId(vid.url);
        if (id) fourAmVidIds.add(id);
      }
    }
  }
  for (const [lName, exList] of Object.entries(sData.exercisesData || {})) {
    for (const ex of exList) {
      if (ex.type === 'youtube_video' || (ex.url && ex.url.includes('youtube'))) {
        const id = extractVidId(ex.videoId) || extractVidId(ex.id) || extractVidId(ex.url);
        if (id) fourAmVidIds.add(id);
      }
    }
  }
}

const regVidIds = new Set();
const regOnly = [];
for (const [key, res] of Object.entries(registry4am)) {
  const isVideo = res.type === 'video' || res.type === 'youtube_video' || 
                  (res.url && res.url.includes('youtube')) || 
                  (res.sourceUrl && res.sourceUrl.includes('youtube')) ||
                  (res.source && res.source.type === 'youtube');
  if (isVideo) {
    const vId = extractVidId(res.videoId) || 
                extractVidId(res.metadata && res.metadata.videoId) || 
                extractVidId(res.url) || 
                extractVidId(res.sourceUrl) ||
                extractVidId(res.id);
    if (vId) {
      regVidIds.add(vId);
      if (!fourAmVidIds.has(vId)) {
        regOnly.push({ key, id: res.id, vId, title: res.title, lessonTitle: res.lessonTitle });
      }
    }
  }
}

console.log('Normalized Unique Video IDs in four_am.js:', fourAmVidIds.size);
console.log('Normalized Unique Video IDs in registry_4am.js:', regVidIds.size);
console.log('In registry but not in four_am:', regOnly.length);
console.log('Intersection size:', [...regVidIds].filter(id => fourAmVidIds.has(id)).length);
