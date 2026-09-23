/**
 * PIPELINE VALIDATOR: BROWSER RUNTIME 4AM GRADE CALCULATOR TEST
 * Validates DOM interaction, input events, comma handling,
 * live recalculation, sample fill, and reset flows.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=============================================');
console.log('RUNNING: pipeline/validators/browser_runtime_grade_calculator_test.js');
console.log('=============================================');

const rootDir = path.resolve(__dirname, '..', '..');

// Create realistic DOM mock
const domElements = {};

function getOrCreateElement(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._classes.has(c)) this._classes.delete(c);
            else this._classes.add(c);
          } else if (force) {
            this._classes.add(c);
          } else {
            this._classes.delete(c);
          }
        },
        contains(c) { return this._classes.has(c); }
      },
      textContent: '',
      innerHTML: '',
      value: '',
      className: '',
      style: {},
      addEventListener: () => {}
    };
  }
  return domElements[id];
}

const mockWindow = {
  scrollTo: () => {},
  addEventListener: () => {},
  history: {
    pushState: () => {},
    replaceState: () => {}
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; }
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; }
  },
  document: {
    getElementById(id) { return getOrCreateElement(id); },
    querySelectorAll() { return []; },
    addEventListener() { }
  },
  console
};
mockWindow.window = mockWindow;
vm.createContext(mockWindow);

// Load required scripts in VM
const filesToLoad = [
  'data/store.js',
  'data/philosophy.js',
  'data/islamic.js',
  'data/history.js',
  'data/math.js',
  'data/arabic.js',
  'data/french.js',
  'data/english.js',
  'data/four_am.js',
  'data/registry_4am.js',
  'app.js'
];

for (const f of filesToLoad) {
  const code = fs.readFileSync(path.join(rootDir, f), 'utf8');
  vm.runInContext(code, mockWindow, { filename: f });
}

console.log('--- 1. التحقق من دوال الحاسبة المصدرة على window ---');
assert.strictEqual(typeof mockWindow.openGradeCalculatorHub, 'function');
assert.strictEqual(typeof mockWindow.openTrimesterCalculator, 'function');
assert.strictEqual(typeof mockWindow.openBemCalculator, 'function');
assert.strictEqual(typeof mockWindow.onTrimesterInputChange, 'function');
assert.strictEqual(typeof mockWindow.resetTrimesterCalculator, 'function');
assert.strictEqual(typeof mockWindow.fillSampleTrimesterGrades, 'function');
assert.strictEqual(typeof mockWindow.onBemInputChange, 'function');
assert.strictEqual(typeof mockWindow.resetBemCalculator, 'function');
assert.strictEqual(typeof mockWindow.fillSampleBemGrades, 'function');
console.log('[PASS] جميع دوال الحاسبة مسجلة ومتاحة بنجاح على كائن window');

console.log('--- 2. اختبار فتح شاشات الحاسبة (Navigation Flow) ---');
mockWindow.openGradeCalculatorHub();
const hubEl = getOrCreateElement('screen-grade-calculator-hub');
assert(!hubEl.classList.contains('hidden'), 'Hub screen must be visible');

mockWindow.openTrimesterCalculator();
const trimEl = getOrCreateElement('screen-grade-calculator-trimester');
assert(!trimEl.classList.contains('hidden'), 'Trimester screen must be visible');
assert(hubEl.classList.contains('hidden'), 'Hub screen must be hidden when trimester screen opens');

mockWindow.openBemCalculator();
const bemEl = getOrCreateElement('screen-grade-calculator-bem');
assert(!bemEl.classList.contains('hidden'), 'BEM screen must be visible');
assert(trimEl.classList.contains('hidden'), 'Trimester screen must be hidden when BEM screen opens');
console.log('[PASS] مسار فتح وتوجيه شاشات الحاسبة يعمل بسلاسة');

console.log('--- 3. اختبار حساب علامة مادة فردية (اللغة العربية والرياضيات) ---');
// اللغة العربية: تقويم 16، فرض 14، اختبار 15
getOrCreateElement('trim-eval-arabic_4am').value = '16';
getOrCreateElement('trim-quiz1-arabic_4am').value = '14';
getOrCreateElement('trim-quiz2-arabic_4am').value = '';
getOrCreateElement('trim-exam-arabic_4am').value = '15';
mockWindow.onTrimesterInputChange('arabic_4am');

const arabicSubavg = getOrCreateElement('trim-subavg-arabic_4am').textContent;
const arabicSubpts = getOrCreateElement('trim-subpts-arabic_4am').textContent;
assert.strictEqual(arabicSubavg, '15.00', 'Arabic subject average should be 15.00');
assert.strictEqual(arabicSubpts, '75.00', 'Arabic points should be 15 * 5 = 75.00');

// الرياضيات مع فاصلة عشرية وفرض ثانٍ: تقويم 17,5، فرض 1: 18، فرض 2: 16، اختبار: 17,5
getOrCreateElement('trim-eval-math_4am').value = '17,5';
getOrCreateElement('trim-quiz1-math_4am').value = '18';
getOrCreateElement('trim-quiz2-math_4am').value = '16';
getOrCreateElement('trim-exam-math_4am').value = '17,5';
mockWindow.onTrimesterInputChange('math_4am');

const mathSubavg = getOrCreateElement('trim-subavg-math_4am').textContent;
const mathSubpts = getOrCreateElement('trim-subpts-math_4am').textContent;
// quizAvg = (18 + 16)/2 = 17. monitoring = (17.5 + 17)/2 = 17.25. subjectAvg = (17.25 + 35) / 3 = 17.4166... => 17.42
assert.strictEqual(mathSubavg, '17.42', 'Math subject average with comma and quiz2 should be 17.42');
assert.strictEqual(mathSubpts, '69.67', 'Math points should be 17.4166... * 4 = 69.67');
console.log('[PASS] الحساب الآني الفردي للمواد يدعم الفاصلة العشرية والفرض الثاني بدقة متناهية');

console.log('--- 4. اختبار الملء التجريبي للمعدل الفصلي (Sample Fill Flow) ---');
mockWindow.fillSampleTrimesterGrades();
const totalAvgTrim = getOrCreateElement('trim-total-average').textContent;
const totalPtsTrim = getOrCreateElement('trim-total-points').textContent;
const appTrim = getOrCreateElement('trim-appreciation').textContent;
assert.notStrictEqual(totalAvgTrim, '—');
const parsedTrimAvg = parseFloat(totalAvgTrim);
assert(parsedTrimAvg >= 16.0 && parsedTrimAvg <= 18.0, `Trimester sample average (${parsedTrimAvg}) should be between 16 and 18`);
assert(totalPtsTrim.includes('/ 520'), 'Trimester points must be out of 520');
assert(appTrim.includes('لوحة شرف'), 'High grade should include honor roll notice');
console.log(`[PASS] الملء التجريبي للفصل أنتج معدلاً ممتازاً: ${totalAvgTrim} / 20`);

console.log('--- 5. اختبار إعادة ضبط الحاسبة الفصلية (Reset Flow) ---');
mockWindow.resetTrimesterCalculator();
assert.strictEqual(getOrCreateElement('trim-eval-arabic_4am').value, '');
assert.strictEqual(getOrCreateElement('trim-subavg-arabic_4am').textContent, '—');
assert.strictEqual(getOrCreateElement('trim-total-average').textContent, '—');
console.log('[PASS] إعادة الضبط الفصلية أفرغت كافة الخانات والنتائج بنظافة تامة');

console.log('--- 6. اختبار حاسبة شهادة BEM والملء التجريبي وقرار النجاح ---');
mockWindow.fillSampleBemGrades();
const bemTotalAvg = getOrCreateElement('bem-total-average').textContent;
const bemDecision = getOrCreateElement('bem-decision-banner').textContent;
const bemApprec = getOrCreateElement('bem-appreciation').textContent;
const parsedBemAvg = parseFloat(bemTotalAvg);
assert(parsedBemAvg >= 16.0, `BEM sample average should be >= 16, got ${bemTotalAvg}`);
assert(bemDecision.includes('ناجح في شهادة التعليم المتوسط'), 'Student must have pass decision banner');
assert(bemApprec.includes('جيد جداً'), 'Honors must reflect Very Good');
console.log(`[PASS] حاسبة BEM التجريبية أنتجت معدل: ${bemTotalAvg} / 20 مع قرار نجاح وتقدير رسمي`);

console.log('--- 7. اختبار قرار عدم النجاح في شهادة BEM عند معدل أقل من 10 ---');
mockWindow.resetBemCalculator();
// أدخل علامات راسبة (8 من 20 لجميع المواد)
mockWindow.SUBJECTS_4AM_SPECS.forEach(spec => {
  getOrCreateElement('bem-mark-' + spec.id).value = '8';
  mockWindow.onBemInputChange(spec.id);
});
const failAvg = getOrCreateElement('bem-total-average').textContent;
const failDecision = getOrCreateElement('bem-decision-banner').textContent;
assert.strictEqual(failAvg, '8.00');
assert(failDecision.includes('غير ناجح'), 'Must display fail banner when average is < 10');
console.log('[PASS] التحقق من قرار عدم النجاح عند معدل أقل من 10 يعمل بنجاح تام');

console.log('\n=============================================');
console.log('ALL BROWSER RUNTIME GRADE CALCULATOR TESTS PASSED (100%)');
console.log('=============================================');
