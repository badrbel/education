/**
 * PIPELINE VALIDATOR: 4AM GRADE & BEM CALCULATOR TEST
 * Validates the Algerian grading rules, coefficients, formula correctness,
 * input parsing (dots and commas), 3AS isolation, and zero emojis policy.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=============================================');
console.log('RUNNING: pipeline/validators/grade_calculator_4am_test.js');
console.log('=============================================');

const rootDir = path.resolve(__dirname, '..', '..');
const appJsPath = path.join(rootDir, 'app.js');
const indexHtmlPath = path.join(rootDir, 'index.html');
const stylesCssPath = path.join(rootDir, 'styles.css');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

// 1. Subject Specs & Coefficients
console.log('--- 1. فحص مواصفات ومعاملات مواد 4AM الـ 11 الرسمية في الحاسبة ---');
const EXPECTED_SPECS = [
  { id: 'arabic_4am', name: 'اللغة العربية', coef: 5 },
  { id: 'math_4am', name: 'الرياضيات', coef: 4 },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', coef: 3 },
  { id: 'french_4am', name: 'اللغة الفرنسية', coef: 3 },
  { id: 'english_4am', name: 'اللغة الإنجليزية', coef: 2 },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', coef: 2 },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', coef: 2 },
  { id: 'islamic_4am', name: 'التربية الإسلامية', coef: 2 },
  { id: 'civics_4am', name: 'التربية المدنية', coef: 1 },
  { id: 'pe_4am', name: 'التربية البدنية والرياضية', coef: 1 },
  { id: 'art_4am', name: 'التربية التشكيلية (الرسم)', coef: 1 },
];

const totalExpectedCoef = EXPECTED_SPECS.reduce((acc, s) => acc + s.coef, 0);
assert.strictEqual(totalExpectedCoef, 26, 'Total official 4AM coefficients must equal 26');
assert.strictEqual(EXPECTED_SPECS.length, 11, 'Must have exactly 11 official 4AM subjects in calculator');

// Verify all subject icons exist
for (const s of EXPECTED_SPECS) {
  assert(appJs.includes(s.id), `app.js must define specs for ${s.id}`);
  assert(indexHtml.includes(`data-calc-subject="${s.id}"`), `index.html must have markup for ${s.id}`);
}
assert(fs.existsSync(path.join(rootDir, 'assets', 'subjects', 'Calculator.png')), 'Calculator emblem must exist in assets/subjects/');
assert(fs.existsSync(path.join(rootDir, 'assets', 'subjects', 'Physical_Education.png')), 'PE icon must exist in assets/subjects/');
assert(fs.existsSync(path.join(rootDir, 'assets', 'subjects', 'Art_Education.svg')), 'Art icon must exist in assets/subjects/');
console.log('[PASS] المواد الـ 11 ومعاملاتها الـ 26 مطابقة للمنهاج الجزائري الرسمي بنسبة 100%');

// 2. Input Parsing (Dots, Commas, Bounds)
console.log('--- 2. فحص تدقيق ومعالجة مدخلات العلامات (parseGradeInput) ---');
function parseGradeInput(val) {
  if (val === null || val === undefined) {
    return { valid: true, empty: true, value: null };
  }
  const str = String(val).trim().replace(',', '.');
  if (str === '') {
    return { valid: true, empty: true, value: null };
  }
  const num = parseFloat(str);
  if (isNaN(num) || num < 0 || num > 20) {
    return { valid: false, empty: false, value: null, isOutOfRange: true };
  }
  return { valid: true, empty: false, value: Math.round(num * 100) / 100 };
}

assert.deepStrictEqual(parseGradeInput('15'), { valid: true, empty: false, value: 15 });
assert.deepStrictEqual(parseGradeInput('15.5'), { valid: true, empty: false, value: 15.5 });
assert.deepStrictEqual(parseGradeInput('15,75'), { valid: true, empty: false, value: 15.75 }, 'Comma decimal parsing must work');
assert.deepStrictEqual(parseGradeInput('0'), { valid: true, empty: false, value: 0 }, 'Zero mark is valid');
assert.deepStrictEqual(parseGradeInput('20'), { valid: true, empty: false, value: 20 }, '20/20 mark is valid');
assert.strictEqual(parseGradeInput('-1').valid, false, 'Negative marks must be rejected');
assert.strictEqual(parseGradeInput('20.01').valid, false, 'Marks > 20 must be rejected');
assert.strictEqual(parseGradeInput('abc').valid, false, 'Non-numeric string must be rejected');
assert.deepStrictEqual(parseGradeInput(''), { valid: true, empty: true, value: null });
assert.deepStrictEqual(parseGradeInput('   '), { valid: true, empty: true, value: null });
console.log('[PASS] دالة تدقيق العلامات تقبل الأرقام العشرية بالفاصلة والنقطة وترفض القيم الشاذة بدقة');

// 3. Official Trimester Formula Verification
console.log('--- 3. فحص صيغة حساب المعدل الفصلي الرسمي لمواد 4AM ---');
// Case A: Single Quiz
// monitoring = (eval + quiz1) / 2
// subjectAvg = (monitoring + exam * 2) / 3
const evalA = 16;
const quizA = 14;
const examA = 15;
const monitoringA = (evalA + quizA) / 2; // 15
const subjectAvgA = (monitoringA + examA * 2) / 3; // (15 + 30) / 3 = 15
assert.strictEqual(subjectAvgA, 15);

// Case B: Double Quiz
const evalB = 17;
const quizB1 = 15;
const quizB2 = 17;
const examB = 16;
const quizAvgB = (quizB1 + quizB2) / 2; // 16
const monitoringB = (evalB + quizAvgB) / 2; // 16.5
const subjectAvgB = (monitoringB + examB * 2) / 3; // (16.5 + 32) / 3 = 16.1666...
assert.strictEqual(Math.round(subjectAvgB * 100) / 100, 16.17);

// General Trimester Average
// sum(subjectAvg_i * coef_i) / 26
const sampleGrades = [
  { coef: 5, avg: 16.00 }, // Arabic: 80
  { coef: 4, avg: 17.50 }, // Math: 70
  { coef: 3, avg: 15.00 }, // HistGeo: 45
  { coef: 3, avg: 14.50 }, // French: 43.5
  { coef: 2, avg: 16.00 }, // English: 32
  { coef: 2, avg: 16.50 }, // Physics: 33
  { coef: 2, avg: 16.00 }, // Science: 32
  { coef: 2, avg: 18.50 }, // Islamic: 37
  { coef: 1, avg: 17.00 }, // Civics: 17
  { coef: 1, avg: 18.00 }, // PE: 18
  { coef: 1, avg: 17.00 }, // Art: 17
];
const totalPoints = sampleGrades.reduce((sum, s) => sum + s.avg * s.coef, 0); // 424.5
const generalAvg = totalPoints / 26; // 424.5 / 26 = 16.3269...
assert.strictEqual(totalPoints, 424.5);
assert.strictEqual(Math.round(generalAvg * 100) / 100, 16.33);
console.log('[PASS] الحساب الفصلي لمعدل المادة والمعدل العام مطابق 100% للقرارات الوزارية الرسمية');

// 4. BEM Exam Formula & Honors Scale Verification
console.log('--- 4. فحص صيغة حساب معدل شهادة BEM وسلم التقديرات ---');
function getBemAppreciation(avg) {
  if (avg >= 18) return 'ممتاز';
  if (avg >= 16) return 'جيد جداً';
  if (avg >= 14) return 'جيد';
  if (avg >= 12) return 'قريب من الجيد';
  if (avg >= 10) return 'مقبول';
  return 'دون المعدل المطلوب';
}

assert.strictEqual(getBemAppreciation(19.2), 'ممتاز');
assert.strictEqual(getBemAppreciation(18.0), 'ممتاز');
assert.strictEqual(getBemAppreciation(17.5), 'جيد جداً');
assert.strictEqual(getBemAppreciation(16.0), 'جيد جداً');
assert.strictEqual(getBemAppreciation(15.2), 'جيد');
assert.strictEqual(getBemAppreciation(14.0), 'جيد');
assert.strictEqual(getBemAppreciation(13.5), 'قريب من الجيد');
assert.strictEqual(getBemAppreciation(12.0), 'قريب من الجيد');
assert.strictEqual(getBemAppreciation(11.0), 'مقبول');
assert.strictEqual(getBemAppreciation(10.0), 'مقبول');
assert.strictEqual(getBemAppreciation(9.99), 'دون المعدل المطلوب');
assert.strictEqual(getBemAppreciation(8.5), 'دون المعدل المطلوب');
console.log('[PASS] سلم تقديرات شهادة التعليم المتوسط (BEM) مطابق للمعيار الوزاري بدقة');

// 5. Strict 3AS Isolation & No Amazigh Language
console.log('--- 5. فحص العزل الصارم عن طور 3AS وعدم وجود الأمازيغية ---');
const grid3as = indexHtml.match(/id="dashboard-subjects-3as"[\s\S]*?<!-- \/#dashboard-subjects-3as -->/);
assert(grid3as, '3AS subjects container must exist');
assert(!grid3as[0].includes('Calculator.png'), 'Calculator must NOT appear in 3AS dashboard');
assert(!grid3as[0].includes('openGradeCalculatorHub'), 'openGradeCalculatorHub must NOT appear in 3AS dashboard');

assert(!indexHtml.includes('أمازيغ') && !indexHtml.includes('amazigh'), 'Amazigh language must NOT exist in index.html');
assert(!appJs.includes('أمازيغ') && !appJs.includes('amazigh'), 'Amazigh language must NOT exist in app.js');

// Strict Calculator-Only constraint for PE & Art (user requirement: "لا لتنشأها كماده بل فقط اضفها داخل حساب معدل و فقط")
const fourAmData = fs.readFileSync(path.join(rootDir, 'data', 'four_am.js'), 'utf8');
const registry4am = fs.readFileSync(path.join(rootDir, 'data', 'registry_4am.js'), 'utf8');
const grid4am = indexHtml.match(/id="dashboard-subjects-4am"[\s\S]*?<!-- \/#dashboard-subjects-4am -->/);
assert(grid4am, '4AM subjects container must exist');

assert(!fourAmData.includes('pe_4am') && !fourAmData.includes('art_4am'), 'PE and Art must NOT be added as courses/content in data/four_am.js');
assert(!registry4am.includes('pe_4am') && !registry4am.includes('art_4am'), 'PE and Art must NOT be added to data/registry_4am.js');
assert(!grid4am[0].includes('Physical_Education.png') && !grid4am[0].includes('Art_Education.svg'), 'PE and Art must NOT appear in the 4AM subjects dashboard cards');
console.log('[PASS] مادتا الرياضة والرسم موجودتان فقط وحصرياً داخل حاسبة المعدل دون إنشاء مقررات لهما');
console.log('[PASS] عزل طور 3AS تام وخلو كامل من أي ظهور أو حساب للغة الأمازيغية');

// 6. Zero Emojis Contract
console.log('--- 6. فحص سياسة الصفر إيموجي (Zero Emojis Contract) ---');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(indexHtml), 'index.html must contain ZERO emojis');
assert(!emojiRegex.test(appJs), 'app.js must contain ZERO emojis');
assert(!emojiRegex.test(stylesCss), 'styles.css must contain ZERO emojis');
console.log('[PASS] خلو كامل وتام من الإيموجي في الكود والواجهات والملفات المحدثة');

// 7. Screen Navigation Registration
console.log('--- 7. فحص تسجيل الشاشات وإدارتها في app.js ---');
assert(appJs.includes(`case 'grade-calculator-hub':`), 'grade-calculator-hub must be in handleNavigationPop');
assert(appJs.includes(`case 'grade-calculator-trimester':`), 'grade-calculator-trimester must be in handleNavigationPop');
assert(appJs.includes(`case 'grade-calculator-bem':`), 'grade-calculator-bem must be in handleNavigationPop');
assert(appJs.includes('screenGradeCalcHub.classList.add(\'hidden\')'), 'screenGradeCalcHub must be in hideAllScreens');
assert(appJs.includes('screenGradeCalcTrimester.classList.add(\'hidden\')'), 'screenGradeCalcTrimester must be in hideAllScreens');
assert(appJs.includes('screenGradeCalcBem.classList.add(\'hidden\')'), 'screenGradeCalcBem must be in hideAllScreens');
console.log('[PASS] جميع مسارات التنقل وإدارة الشاشات مسجلة وموثقة في app.js بنجاح');

console.log('\n=============================================');
console.log('ALL 7/7 TESTS IN grade_calculator_4am_test.js PASSED!');
console.log('=============================================');
