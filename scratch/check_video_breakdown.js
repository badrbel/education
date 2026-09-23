const fs = require('fs');
const vm = require('vm');

const regPath = 'data/registry_4am.js';
const regContent = fs.readFileSync(regPath, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(regContent, sandbox);
const reg = sandbox.window.PlatformRegistry4AM;

const subjectConfigs = [
  { id: 'math_4am', name: 'الرياضيات', legacyId: '4am-bem-math' },
  { id: 'arabic_4am', name: 'اللغة العربية', legacyId: '4am-bem-arabic' },
  { id: 'french_4am', name: 'اللغة الفرنسية', legacyId: '4am-bem-french' },
  { id: 'english_4am', name: 'اللغة الإنجليزية', legacyId: '4am-bem-english' },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', legacyId: '4am-bem-physics' },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', legacyId: '4am-bem-science' },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', legacyId: '4am-bem-history' },
  { id: 'islamic_4am', name: 'التربية الإسلامية', legacyId: '4am-bem-islamic' },
  { id: 'civics_4am', name: 'التربية المدنية', legacyId: '4am-bem-civics' }
];

for (const sc of subjectConfigs) {
  const legacy = reg[sc.legacyId];
  const vids = (legacy && legacy.solution && legacy.solution.videoSolutions) || [];
  const v2024 = vids.filter(v => v.year === 2024);
  const v2023 = vids.filter(v => v.year === 2023);
  console.log(`${sc.name} (${sc.id}): 2024 -> ${v2024.length} vids | 2023 -> ${v2023.length} vids | total -> ${vids.length}`);
}
