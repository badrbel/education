const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));

const reg = global.window.PlatformRegistry;
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{23FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/u;

for (const [id, r] of Object.entries(reg)) {
  const text = `${r.title} ${r.badge || ''} ${r.source && r.source.name || ''}`;
  if (emojiRegex.test(text)) {
    console.log('Emoji in registry item:', id, '->', text);
  }
}

global.window = { PlatformData: {} };
eval(fs.readFileSync(path.join(baseDir, 'data/history.js'), 'utf8'));

for (const [sName, sObj] of Object.entries(global.window.PlatformData)) {
  for (const [lTitle, chList] of Object.entries(sObj.channelsData || {})) {
    for (const ch of chList) {
      for (const v of ch.videos || []) {
        const text = `${v.title || ''} ${ch.channel || ''}`;
        if (emojiRegex.test(text)) {
          console.log(`Emoji in [${sName} -> ${lTitle}]:`, text);
        }
      }
    }
  }
}
