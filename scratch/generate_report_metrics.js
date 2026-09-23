const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve('c:/Users/mad/Desktop/موقع تعلمي');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(baseDir, 'data/store.js'), 'utf8'), sandbox);

const reg3as = sandbox.window.PlatformRegistry;
const reg4am = sandbox.window.PlatformRegistry4AM;

console.log('3AS Total items:', Object.keys(reg3as).length);
console.log('4AM Total items:', Object.keys(reg4am).length);

// Extract all external non-YouTube URLs across both registries
const allUrls = new Set();
const urlDetails = [];

function collect(reg, level) {
  for (const [id, r] of Object.entries(reg)) {
    const urls = [
      r.url,
      r.sourceUrl,
      r.source && r.source.url,
      r.problem && r.problem.url,
      r.solution && r.solution.url
    ].filter(Boolean);

    for (const u of urls) {
      if (typeof u === 'string' && u.startsWith('http') && !u.includes('youtube.com') && !u.includes('youtu.be')) {
        allUrls.add(u);
        urlDetails.push({ url: u, id, level, type: r.type, subjectId: r.subjectId });
      }
    }
  }
}

collect(reg3as, '3as');
collect(reg4am, '4am');

console.log('Total unique non-YouTube external URLs:', allUrls.size);

// Classify URLs
const classified = {
  DIRECT_RESOURCE: 0,
  SOURCE_PAGE: 0,
  CATEGORY_PAGE: 0,
  INVALID: 0,
  DEAD: 0,
  UNKNOWN: 0
};

for (const u of allUrls) {
  if (u.includes('/sujets/') || u.includes('/documents/') || u.endsWith('.pdf')) {
    classified.DIRECT_RESOURCE++;
  } else if (u.includes('/ar/bem/') || u.includes('/ar/bac/') || (u.match(/\/ar\/[^\/]+\/[^\/]+\/[^\/]+/))) {
    classified.SOURCE_PAGE++;
  } else if (u === 'https://www.dzexams.com' || u === 'https://www.dzexams.com/') {
    classified.INVALID++;
  } else {
    classified.CATEGORY_PAGE++;
  }
}

console.log('Classification breakdown:', classified);
