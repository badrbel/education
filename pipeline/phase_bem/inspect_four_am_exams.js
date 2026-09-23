const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fourAmContent = fs.readFileSync(path.join(__dirname, '../../data/four_am.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fourAmContent, sandbox);

const fourAm = sandbox.window.PlatformData4AM;
console.log('PlatformData4AM loaded successfully. Subjects:', Object.keys(fourAm));

for (const [sId, s] of Object.entries(fourAm)) {
  console.log(`\nSubject: ${sId} (${s.name})`);
  console.log(`- has exams?:`, !!s.exams, Array.isArray(s.exams) ? s.exams.length : 0);
  if (s.exams && s.exams.length) {
    s.exams.forEach(e => console.log(`  Exam ID: ${e.id} | Title: ${e.title} | Type: ${e.type} | Year: ${e.year || 'N/A'}`));
  }
}

const regContent = fs.readFileSync(path.join(__dirname, '../../data/registry_4am.js'), 'utf8');
const regSandbox = { window: {} };
vm.createContext(regSandbox);
vm.runInContext(regContent, regSandbox);

const reg = regSandbox.window.PlatformRegistry4AM;
console.log('\n--- Registry 4AM Exam & BEM resources ---');
const bemResources = Object.values(reg).filter(r => r.type === 'bem' || (r.id && r.id.includes('bem')));
console.log(`Total BEM resources in registry_4am: ${bemResources.length}`);
bemResources.forEach(r => {
  console.log(`ID: ${r.id} | Subject: ${r.subjectId} | Type: ${r.type} | Title: ${r.title} | Source: ${r.sourceUrl}`);
});

