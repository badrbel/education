const fs = require('fs');
global.window = {};
require('../data/four_am.js');
require('../data/registry_4am.js');

const fourAmData = global.window.PlatformData4AM;
const registry4am = global.window.PlatformRegistry4AM;

const auditData = JSON.parse(fs.readFileSync('scratch/final_classified_audit.json', 'utf8'));
const needsVerif = auditData.NEEDS_VERIFICATION;

console.log(`Total NEEDS_VERIFICATION to analyze: ${needsVerif.length}`);

// Group them by the 3 subcategories we identified:
// 1. General Reviews (المراجعات النهائية)
// 2. Multi-level titles
// 3. Subtopic titles

const generalReviews = needsVerif.filter(v => v.lessonTitle === 'المراجعات النهائية');
const multiLevel = needsVerif.filter(v => v.lessonTitle !== 'المراجعات النهائية' && /(?:1|2|3)\s*am|الثانية\s*متوسط|الثالثة\s*متوسط/i.test(v.title));
const subtopics = needsVerif.filter(v => v.lessonTitle !== 'المراجعات النهائية' && !multiLevel.includes(v));

console.log(`General Reviews count: ${generalReviews.length}`);
console.log(`Multi-level count: ${multiLevel.length}`);
console.log(`Subtopics count: ${subtopics.length}`);
console.log(`Sum: ${generalReviews.length + multiLevel.length + subtopics.length}`);

fs.writeFileSync('scratch/reconciliation_candidates.json', JSON.stringify({
  generalReviews,
  multiLevel,
  subtopics
}, null, 2), 'utf8');
