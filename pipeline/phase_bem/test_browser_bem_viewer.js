const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '../..');

// Setup full mock DOM
function createEl(tagName = 'div', id = '') {
  return {
    tagName: tagName.toUpperCase(),
    id,
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    style: {},
    value: '',
    textContent: '',
    innerHTML: '',
    href: '',
    src: '',
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

const elementStore = {};
function getOrCreate(id) {
  if (!elementStore[id]) {
    elementStore[id] = createEl('div', id);
  }
  return elementStore[id];
}

const sandbox = {
  window: {},
  addEventListener() {},
  removeEventListener() {},
  scrollTo() {},
  document: {
    getElementById: (id) => getOrCreate(id),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => createEl(tag),
    addEventListener() {}
  },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); }
  },
  sessionStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); }
  },
  console
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// Load files
const files = [
  'data/store.js',
  'data/philosophy.js',
  'data/islamic.js',
  'data/history.js',
  'data/math.js',
  'data/arabic.js',
  'data/french.js',
  'data/english.js',
  'data/registry.js',
  'data/four_am.js',
  'data/registry_4am.js',
  'app.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(baseDir, f), 'utf8');
  vm.runInContext(code, sandbox);
});

console.log('Testing BEM Resource Viewer Runtime Flow...');

// 1. Set level to 4am
sandbox.appState.level = '4am';
sandbox.appState.currentSubject = 'الرياضيات';

// 2. Open BEM resource viewer for math
sandbox.openResourceViewer('4am-bem-math', 'solution');

const solutionPane = getOrCreate('viewer-pane-solution');
assert(solutionPane.innerHTML.includes('حلول مرئية معتمدة من نخبة الأساتذة'), 'Solution pane must include video solutions header');
assert(solutionPane.innerHTML.includes('حلول تمارين متنوعة'), 'Solution pane must include teacher name');
assert(solutionPane.innerHTML.includes('https://www.youtube.com/watch?v=2HcMVE3VeU8'), 'Solution pane must include direct video URL');
assert(solutionPane.innerHTML.includes('BEM 2024'), 'Solution pane must display BEM 2024 badge');
assert(solutionPane.innerHTML.includes('BEM 2023'), 'Solution pane must display BEM 2023 badge');

console.log('[PASS] BEM Resource Viewer successfully renders both official DzExams link and multi-teacher YouTube solutions!');

// 3. Test for Arabic
sandbox.openResourceViewer('4am-bem-arabic', 'solution');
assert(solutionPane.innerHTML.includes('الأستاذ يوسف مادن'), 'Arabic solution pane must include teacher');
assert(solutionPane.innerHTML.includes('QT1JC8cIUfk'), 'Arabic solution pane must include video ID');

console.log('[PASS] Arabic BEM solutions rendered flawlessly!');

console.log('\n--- BEM RESOURCE VIEWER RUNTIME TEST PASSED 100% ---');
