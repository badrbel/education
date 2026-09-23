const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve('c:/Users/mad/Desktop/موقع تعلمي');

function createElementMock(id = '') {
  return {
    id,
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { this.contains(c) ? this.remove(c) : this.add(c); }
    },
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    textContent: '',
    innerHTML: '',
    value: '',
    href: '',
    src: '',
    style: {}
  };
}

const mockDom = {
  window: {},
  addEventListener: () => {},
  scrollTo: () => {},
  history: {
    pushState: () => {},
    replaceState: () => {}
  },
  document: {
    _elements: {},
    getElementById(id) {
      if (!this._elements[id]) {
        this._elements[id] = createElementMock(id);
      }
      return this._elements[id];
    },
    querySelectorAll() {
      return [];
    },
    addEventListener: () => {}
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  console: console
};
mockDom.window = mockDom;

const sandbox = vm.createContext(mockDom);

function loadScript(file) {
  const code = fs.readFileSync(path.join(baseDir, file), 'utf8');
  vm.runInContext(code, sandbox);
}

loadScript('data/four_am.js');
loadScript('data/registry_4am.js');
loadScript('data/store.js');
loadScript('app.js');

console.log('--- 1. اختبار تهيئة ملف الطالب 4AM وفتح قسم BEM ---');
sandbox.StudentProfile.save('أحمد', null, '4am');
sandbox.bootWithStudentProfile();

const lvlEl = sandbox.document.getElementById('dashboard-level-name');
console.log('Dashboard Level Name:', lvlEl.textContent);
assert.strictEqual(lvlEl.textContent, 'السنة الرابعة متوسط', 'اسم المستوى يجب أن يكون السنة الرابعة متوسط');

const bemSec = sandbox.document.getElementById('dashboard-bem-section');
assert(!bemSec.classList.contains('hidden'), 'قسم BEM يجب أن يكون مرئياً لطور 4AM');
console.log('[PASS] تم فتح شاشة لوحة تحكم 4AM بنجاح مع ظهور قسم BEM.');

console.log('\n--- 2. اختبار فتح فهرس دورات BEM لمادة الرياضيات (openResourceIndex) ---');
sandbox.openResourceIndex('bem', 'math_4am');

const screenRes = sandbox.document.getElementById('screen-resource-index');
assert(!screenRes.classList.contains('hidden'), 'شاشة فهرس الموارد يجب أن تكون معروضة');

const titleEl = sandbox.document.getElementById('resource-index-title');
console.log('Resource Index Title:', titleEl.textContent);
assert(titleEl.textContent.includes('الرياضيات'), 'العنوان يجب أن يشمل مادة الرياضيات');

const container = sandbox.document.getElementById('resource-cards-container');
const cardMatches = (container.innerHTML.match(/class="resource-card/g) || []).length;
console.log('Rendered BEM cards count:', cardMatches);
assert.strictEqual(cardMatches, 16, 'يجب أن يتم عرض 16 بطاقة دورة BEM (2025-2010)');

console.log('\n--- 3. اختبار فتح عارض المورد لدورة 2024 مع الحلول المرئية ---');
sandbox.openResourceViewer('math_4am-bem-2024', 'solution');

const screenViewer = sandbox.document.getElementById('screen-resource-viewer');
assert(!screenViewer.classList.contains('hidden'), 'شاشة عارض المورد يجب أن تكون معروضة');

const solPane = sandbox.document.getElementById('viewer-pane-solution');
assert(solPane.innerHTML.includes('حلول مرئية معتمدة من نخبة الأساتذة (11 حل موثق)'), 'يجب أن يعرض العارض 11 حل فيديو موثق لدورة 2024');
console.log('[PASS] عارض المورد عرض بنجاح الحلول المرئية الـ 11 لدورة رياضيات 2024.');

console.log('\n--- 4. اختبار فتح عارض المورد لدورة 2023 مع الحلول المرئية ---');
sandbox.openResourceViewer('math_4am-bem-2023', 'solution');
assert(solPane.innerHTML.includes('حلول مرئية معتمدة من نخبة الأساتذة (9 حل موثق)'), 'يجب أن يعرض العارض 9 حلول فيديو موثقة لدورة 2023');
console.log('[PASS] عارض المورد عرض بنجاح الحلول المرئية الـ 9 لدورة رياضيات 2023.');

console.log('\n--- 5. اختبار فتح عارض المورد لدورة 2025 (رابط ديوان رسمي دون خلط فيديوهات) ---');
sandbox.openResourceViewer('math_4am-bem-2025', 'solution');
assert(!solPane.innerHTML.includes('حلول مرئية معتمدة'), 'دورة 2025 يجب ألا تحتوي على فيديوهات عشوائية غير مطابقة');
console.log('[PASS] دورة 2025 تعرض الحل الرسمي المعتمد دون أي خلط عشوائي للفيديوهات.');

console.log('\n=============================================');
console.log('ALL BROWSER FLOW VALIDATIONS PASSED (100%)');
console.log('=============================================');
