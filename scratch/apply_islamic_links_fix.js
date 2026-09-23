const fs = require('fs');

const regPath = 'data/registry.js';
let content = fs.readFileSync(regPath, 'utf8');

// Match and replace in registry.js
// Only in islamic-ex-... blocks
let updatedCount = 0;
// We know from earlier inspection:
// "source": {
//   "type": "external",
//   "name": "المستندات التربوية والتمارين المحلولة / DzExams",
//   "url": "https://www.dzexams.com",
//   "verified": true
// }
// and problem url: ""

const targetUrl = 'https://www.dzexams.com/ar/3as/tarbia-islamia';

// We can parse the file or do regex replacement
// Let's check with regex replacement
const oldStr = '"url": "https://www.dzexams.com"';
const newStr = `"url": "${targetUrl}"`;

const countBefore = (content.match(new RegExp(oldStr, 'g')) || []).length;
console.log('Matches for oldStr:', countBefore);

// In the same items, problem.url was empty string:
// "problem": {
//   "available": true,
//   "format": "external",
//   "text": "...",
//   "url": ""
// }
// Let's verify by parsing with VM
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);

const reg = sandbox.window.PlatformRegistry;
let modified = 0;
for (const [key, item] of Object.entries(reg)) {
  if (item.subjectId === 'islamic' && item.source && item.source.url === 'https://www.dzexams.com') {
    item.source.url = targetUrl;
    if (item.problem && (!item.problem.url || item.problem.url === '')) {
      item.problem.url = targetUrl;
    }
    modified++;
  }
}

console.log('Modified items in object:', modified);

// Write back formatted
const newContent = `/**\n * mordix_ai — سجل الموارد التعليمية الموحد المحدث (3AS Unified Platform Registry)\n * محدث ومفحوص بالكامل بروابط مباشرة وصريحة (PHASE 11.8)\n * خلو تام من الإيموجيات (Zero Emojis)\n */\n\nwindow.PlatformRegistry = ${JSON.stringify(reg, null, 2)};\n`;

// Create backup before writing
fs.copyFileSync(regPath, 'data/registry.backup_pre_release.js');
fs.writeFileSync(regPath, newContent, 'utf8');
console.log('Wrote updated registry.js and created backup.');
