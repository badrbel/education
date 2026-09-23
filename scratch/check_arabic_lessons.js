global.window = {};
require('../data/four_am.js');
const arabicLessons = global.window.PlatformData4AM.arabic_4am.lessons.map(l => l.title);
console.log('Arabic lessons count:', arabicLessons.length);
console.log('Includes المراجعات النهائية?', arabicLessons.includes('المراجعات النهائية'));
console.log('Lessons:', arabicLessons);
