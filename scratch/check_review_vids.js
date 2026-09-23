global.window = {};
require('../data/registry_4am.js');
const registry4am = global.window.PlatformRegistry4AM;

let count = 0;
const reviewVids = [];
for (const [k, r] of Object.entries(registry4am)) {
  if (r.lessonTitle === 'المراجعات النهائية') {
    count++;
    reviewVids.push({ id: r.id, videoId: r.videoId, title: r.title, subjectName: r.subjectName });
  }
}
console.log('Videos with lessonTitle === المراجعات النهائية:', count);
console.log(reviewVids);
