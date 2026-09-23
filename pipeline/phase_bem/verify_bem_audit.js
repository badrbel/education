const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../../data/pipeline/reports/PHASE_BEM_SOLUTIONS_AUDIT.md');
const jsonPath = path.join(__dirname, '../../data/pipeline/reports/PHASE_BEM_SOLUTIONS_AUDIT.json');

const mdText = fs.readFileSync(mdPath, 'utf8');
const jsonText = fs.readFileSync(jsonPath, 'utf8');

const emojiRegex = /[\p{Extended_Pictographic}\uFE0F\u200D\u2600-\u26FF\u2700-\u27BF]/gu;

const mdEmojis = mdText.match(emojiRegex);
const jsonEmojis = jsonText.match(emojiRegex);

console.log('Emojis in Markdown report:', mdEmojis ? mdEmojis.length : 0);
if (mdEmojis) console.log('Sample:', mdEmojis.slice(0, 10));

console.log('Emojis in JSON report:', jsonEmojis ? jsonEmojis.length : 0);
if (jsonEmojis) console.log('Sample:', jsonEmojis.slice(0, 10));

// Check YouTube ID validity
const jsonData = JSON.parse(jsonText);
let invalidIds = 0;
let searchUrls = 0;

for (const item of jsonData.curatedSelection) {
  if (!item.videoId || !/^[a-zA-Z0-9_-]{11}$/.test(item.videoId)) {
    invalidIds++;
    console.error('Invalid ID:', item.videoId);
  }
  if (item.url && item.url.includes('results?search_query')) {
    searchUrls++;
    console.error('Search URL found:', item.url);
  }
}

console.log('Invalid YouTube IDs in curated:', invalidIds);
console.log('Search URLs in curated:', searchUrls);
console.log('Total curated solutions:', jsonData.curatedSelection.length);

jsonData.subjectsAudit.forEach(s => {
  console.log(`- ${s.subjectName} (${s.subjectId}): BEM 2024 = ${s.bem2024SolutionsCount}, BEM 2023 = ${s.bem2023SolutionsCount}, Total = ${s.totalCuratedSolutions}`);
});
