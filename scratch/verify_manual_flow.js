const assert = require('assert');
const path = require('path');
const fs = require('fs');

global.window = {
  appState: { level: '4am', currentSubject: 'math_4am' }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Mock DOM
global.document = {
  getElementById: () => ({ innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {} } }),
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load dependencies
eval(fs.readFileSync(path.join(__dirname, '../data/four_am.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../data/registry_4am.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../data/store.js'), 'utf8'));

const PlatformStore = global.window.PlatformStore;
global.PlatformStore = PlatformStore;
const appState = global.window.appState;
global.appState = appState;

// Extract functions
const appJsCode = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const fnMatches = appJsCode.match(/function resolveVideoUrls[\s\S]*?^}/m);
assert(fnMatches, 'resolveVideoUrls found');

eval(`
${appJsCode.match(/function extractYouTubeId[\s\S]*?^}/m)[0]}
${appJsCode.match(/function buildYouTubeEmbedUrl[\s\S]*?^}/m)[0]}
${appJsCode.match(/function getYouTubeSearchUrl[\s\S]*?^}/m)[0]}
${fnMatches[0]}
`);

const store = PlatformStore;
const subjects = store.getAllSubjects('4am');
console.log(`Auditing runtime video playback resolution across all ${subjects.length} subjects...`);

let totalResolved = 0;
let searchCount = 0;

for (const subj of subjects) {
  const lessons = store.getLessons(subj.name, '4am');
  for (const lesson of lessons) {
    const channels = store.getLessonVideos(subj.name, lesson.title, '4am');
    for (const ch of channels) {
      for (const vid of ch.videos || []) {
        totalResolved++;
        const resolved = resolveVideoUrls(vid, ch.channel);

        // Verification checks
        assert(!resolved.watchUrl.includes('results?search_query='), `Forbidden search query found: ${resolved.watchUrl}`);
        assert(resolved.watchUrl.startsWith('https://www.youtube.com/watch?v='), `Invalid watchUrl format: ${resolved.watchUrl}`);
        assert(resolved.embedUrl.startsWith('https://www.youtube.com/embed/'), `Invalid embedUrl format: ${resolved.embedUrl}`);
        assert(resolved.source === 'direct-id' || resolved.source === 'direct-url', `Invalid source: ${resolved.source}`);

        if (resolved.source === 'search') searchCount++;
      }
    }
  }
}

console.log(`Verified ${totalResolved} video playback resolutions across 4AM!`);
console.log(`Search fallback count: ${searchCount} (Target: 0)`);
console.log('ALL PLAYBACK URLS ARE DIRECT, PLAYABLE, AND 100% SEARCH-FREE!');
