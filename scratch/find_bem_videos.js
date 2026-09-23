const fs = require('fs');

const fourAmTxt = fs.readFileSync('data/four_am.js', 'utf8');
const reg4amTxt = fs.readFileSync('data/registry_4am.js', 'utf8');

console.log('four_am.js mentions of BEM:', (fourAmTxt.match(/BEM|شهادة التعليم المتوسط/gi) || []).length);
console.log('registry_4am.js mentions of BEM:', (reg4amTxt.match(/BEM|شهادة التعليم المتوسط/gi) || []).length);

// Let's check where the 91 youtube videos from previous phase were saved!
// Let's check scratch, git diff, or reports
const files = fs.readdirSync('.');
const reportFiles = files.filter(f => f.includes('BEM') || f.includes('YOUTUBE') || f.includes('REPORT'));
console.log('Relevant files in root:', reportFiles);

if (fs.existsSync('scratch')) {
  console.log('Scratch files:', fs.readdirSync('scratch'));
}
