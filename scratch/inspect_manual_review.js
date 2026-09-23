const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/audit_results_details.json', 'utf8'));

console.log('Manual review count:', data.manualReviewList.length);

const crossLevel = data.manualReviewList.filter(item => item.reason.includes('other level'));
console.log('\n--- Cross-level candidates (' + crossLevel.length + ') ---');
crossLevel.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.subjectName}] [${item.lessonTitle}]`);
  console.log(`   Title: ${item.title}`);
  console.log(`   Teacher: ${item.teacher}`);
  console.log(`   Video ID: ${item.extractedId}`);
  console.log(`   URL: ${item.url}`);
  console.log(`   Reason: ${item.reason}\n`);
});

const others = data.manualReviewList.filter(item => !item.reason.includes('other level'));
console.log('\n--- Other Needs-Verification candidates (' + others.length + ') ---');
// Let's print unique titles for others
const uniqueOtherTitles = new Map();
others.forEach(item => {
  if (!uniqueOtherTitles.has(item.title)) {
    uniqueOtherTitles.set(item.title, item);
  }
});
console.log(`Total unique titles in others: ${uniqueOtherTitles.size}`);
let idx = 1;
for (const [title, item] of uniqueOtherTitles) {
  console.log(`${idx++}. [${item.subjectName}] [${item.lessonTitle}]`);
  console.log(`   Title: ${item.title}`);
  console.log(`   Teacher: ${item.teacher}`);
  console.log(`   Video ID: ${item.extractedId}`);
  console.log(`   URL: ${item.url}`);
  console.log(`   Reason: ${item.reason}\n`);
}
