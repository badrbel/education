const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
global.window = {};
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
const reg = global.window.PlatformRegistry4AM || {};

const yt40k = Object.values(reg).filter(r => r.id.startsWith('yt-40k-'));
console.log('Total yt-40k in registry:', yt40k.length);

const suspect = [];
for (const v of yt40k) {
  const t = (v.title || '').toLowerCase();
  const c = (v.teacher || '').toLowerCase();
  if (t.includes('a-level') || c.includes('a-level') || 
      t.includes('توجيهي') || t.includes('ثانوية عامة') || 
      t.includes('سنة ثانية') || t.includes('سنة ثالثة') || t.includes('سنة 3') || t.includes('سنة 2') ||
      t.includes('bac') || t.includes('باك')) {
    suspect.push({
      id: v.id,
      videoId: v.videoId,
      title: v.title,
      channel: v.teacher,
      subject: v.subjectName,
      lesson: v.lessonTitle,
      views: v.viewCount
    });
  }
}

console.log('Suspect count:', suspect.length);
for (const s of suspect) {
  console.log(`- [${s.subject} -> ${s.lesson}] ${s.title} | ${s.channel} | views: ${s.views} | id: ${s.videoId}`);
}
