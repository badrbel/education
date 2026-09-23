const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

sandbox.StudentProfile.save('أحمد', null, '4am');
sandbox.bootWithStudentProfile();

sandbox.openResourceViewer('math_4am-bem-2024', 'solution');
const solPane = sandbox.document.getElementById('viewer-pane-solution');
console.log('solPane.innerHTML length:', solPane.innerHTML.length);
console.log('Contains video solutions?', solPane.innerHTML.includes('حلول مرئية معتمدة'));
if (solPane.innerHTML.includes('حلول مرئية')) {
  const match = solPane.innerHTML.match(/حلول مرئية[^\n<]*/);
  console.log('Matched text:', match ? match[0] : null);
}
