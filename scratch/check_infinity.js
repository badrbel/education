global.window = {};
require('../data/four_am.js');
const m = global.window.PlatformData4AM.math_4am.channelsData;
for (const [l, chs] of Object.entries(m)) {
  for (const ch of chs) {
    if (ch.channel.includes('infinity') || ch.channel.includes('أنفينيتي')) {
      console.log('Lesson:', l);
      console.log('Videos:', ch.videos.map(v => ({ id: v.id, title: v.title })));
    }
  }
}
