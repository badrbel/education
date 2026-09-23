const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/reconciliation_candidates.json', 'utf8'));

console.log('=== 23 GENERAL REVIEWS INSPECTION ===');
data.generalReviews.forEach((v, i) => {
  console.log(`[${i+1}] ID: ${v.videoId}`);
  console.log(`    Title: ${v.title}`);
  console.log(`    Teacher: ${v.teacher}`);
  console.log(`    Subject: ${v.subjectName}`);
  console.log(`    Lesson: ${v.lessonTitle}\n`);
});
