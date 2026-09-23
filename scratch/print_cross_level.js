const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/audit_results_details.json', 'utf8'));

const crossLevel = data.manualReviewList.filter(item => item.reason.includes('other level'));
console.log('Cross-level total:', crossLevel.length);

crossLevel.forEach((c, i) => {
  console.log(`[${i + 1}] ID: ${c.extractedId} | Subject: ${c.subjectName} | Lesson: ${c.lessonTitle}`);
  console.log(`     Title: ${c.title}`);
  console.log(`     Teacher: ${c.teacher}`);
  console.log(`     Reason: ${c.reason}\n`);
});
