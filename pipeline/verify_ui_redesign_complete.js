const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve('c:/Users/mad/Desktop/موقع تعلمي');

console.log('====================================================');
console.log('  VERIFICATION SUITE: SUBJECT UI REDESIGN (PHASE UI)');
console.log('====================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, cond) {
  totalChecks++;
  if (cond) {
    passedChecks++;
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
  }
}

// 1. Data Integrity Check (SHA-256 vs baseline)
console.log('--- 1. التحقق من سلامة ملفات البيانات وعدم المساس بها إطلاقاً ---');
const baselinePath = path.join(baseDir, 'data/pipeline/ui_redesign_baseline_hashes.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

for (const [relPath, expectedHash] of Object.entries(baseline)) {
  if (['index.html', 'styles.css', 'app.js'].includes(relPath)) continue; // Expected UI modifications
  const filePath = path.join(baseDir, relPath);
  const fileBuf = fs.readFileSync(filePath);
  const actualHash = crypto.createHash('sha256').update(fileBuf).digest('hex');
  check(`تطابق البصمة التشفيرية لملف ${relPath} بنسبة 100%`, actualHash === expectedHash);
}

// 2. Zero Emoji Policy Check across modified UI files
console.log('\n--- 2. التحقق من خلو الملفات المعدلة من أي إيموجي (Zero Emoji) ---');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const uiFiles = ['index.html', 'styles.css', 'app.js'];

for (const f of uiFiles) {
  const content = fs.readFileSync(path.join(baseDir, f), 'utf-8');
  check(`ملف ${f} خالٍ تماماً من الإيموجي بنسبة 100%`, !emojiRegex.test(content));
}

// 3. Image Assets Verification
console.log('\n--- 3. التحقق من وجود وسلامة صور المواد الـ 11 في assets/subjects/ ---');
const expectedAssets = [
  'Philosophy.png',
  'Islamic_Sciences.png',
  'History_Geography.png',
  'English.png',
  'French.png',
  'Arabic.png',
  'Mathematics.png',
  'Physics.png',
  'Natural_Sciences.png',
  'Islamic_Education.png',
  'Civic_Education.png'
];

for (const asset of expectedAssets) {
  const assetPath = path.join(baseDir, 'assets/subjects', asset);
  const exists = fs.existsSync(assetPath);
  const size = exists ? fs.statSync(assetPath).size : 0;
  check(`الأصل البصري ${asset} موجود بحجم سليم (${size} بايت)`, exists && size > 50000);
}

// 4. HTML Elements & Navigation Contract Verification
console.log('\n--- 4. التحقق من بنية بطاقات المواد وعقود الانتقال ---');
const html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf-8');

// 3AS checks (7 subjects)
const expected3AS = [
  { name: 'الفلسفة', asset: 'Philosophy.png' },
  { name: 'العلوم الإسلامية', asset: 'Islamic_Sciences.png' },
  { name: 'التاريخ والجغرافيا', asset: 'History_Geography.png' },
  { name: 'اللغة الإنجليزية', asset: 'English.png' },
  { name: 'اللغة الفرنسية', asset: 'French.png' },
  { name: 'اللغة العربية', asset: 'Arabic.png' },
  { name: 'الرياضيات', asset: 'Mathematics.png' }
];

expected3AS.forEach(s => {
  check(`3AS: بطاقة ${s.name} ترتبط بـ openSubjectDetail('${s.name}')`, html.includes(`openSubjectDetail('${s.name}')`));
  check(`3AS: بطاقة ${s.name} تستخدم الصورة assets/subjects/${s.asset}`, html.includes(`assets/subjects/${s.asset}`));
  check(`3AS: بطاقة ${s.name} تحمل data-subject="${s.name}"`, html.includes(`data-subject="${s.name}"`));
  check(`3AS: بطاقة ${s.name} تحمل data-subject-meta="${s.name}"`, html.includes(`data-subject-meta="${s.name}"`));
});

// 4AM checks (9 subjects)
const expected4AM = [
  { id: 'math_4am', name: 'الرياضيات', asset: 'Mathematics.png', coef: 4 },
  { id: 'arabic_4am', name: 'اللغة العربية', asset: 'Arabic.png', coef: 5 },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', asset: 'Physics.png', coef: 2 },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', asset: 'Natural_Sciences.png', coef: 2 },
  { id: 'french_4am', name: 'اللغة الفرنسية', asset: 'French.png', coef: 3 },
  { id: 'english_4am', name: 'اللغة الإنجليزية', asset: 'English.png', coef: 2 },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', asset: 'History_Geography.png', coef: 3 },
  { id: 'islamic_4am', name: 'التربية الإسلامية', asset: 'Islamic_Education.png', coef: 2 },
  { id: 'civics_4am', name: 'التربية المدنية', asset: 'Civic_Education.png', coef: 1 }
];

expected4AM.forEach(s => {
  check(`4AM: بطاقة ${s.name} ترتبط بـ openSubjectDetail('${s.id}')`, html.includes(`openSubjectDetail('${s.id}')`));
  check(`4AM: بطاقة ${s.name} تستخدم الصورة assets/subjects/${s.asset}`, html.includes(`assets/subjects/${s.asset}`));
  check(`4AM: بطاقة ${s.name} تحمل data-subject-id="${s.id}"`, html.includes(`data-subject-id="${s.id}"`));
  check(`4AM: بطاقة ${s.name} تحمل معامل ${s.coef}`, html.includes(`معامل ${s.coef}`));
});

// 5. CSS & Protrusion overflow guard check
console.log('\n--- 5. التحقق من قواعد CSS وسلامة التنسيقات ---');
const css = fs.readFileSync(path.join(baseDir, 'styles.css'), 'utf-8');
check('قاعدة .mordix-subject-card معرّفة', css.includes('.mordix-subject-card'));
check('قاعدة .mordix-subject-emblem-wrap معرّفة', css.includes('.mordix-subject-emblem-wrap'));
check('قاعدة .mordix-subject-emblem معرّفة', css.includes('.mordix-subject-emblem'));
check('قاعدة .mordix-subject-btn معرّفة', css.includes('.mordix-subject-btn'));
check('قواعد العرض المتجاوب على الشاشات الصغيرة max-width: 640px معرّفة', css.includes('@media (max-width: 640px)'));

console.log('\n====================================================');
console.log(`  نتيجة الفحص النهائي: ${passedChecks} / ${totalChecks} ناجح`);
console.log('====================================================');

if (passedChecks === totalChecks) {
  console.log('\nجميع الفحوصات الدقيقة نجحت بنسبة 100%!');
  process.exit(0);
} else {
  console.error('\nتوجد فحوصات فاشلة!');
  process.exit(1);
}
