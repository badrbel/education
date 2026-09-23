const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/audit_classified.json', 'utf8'));

console.log('=== REJECT_RECOMMENDED (5 items) ===');
data.REJECT_RECOMMENDED.forEach((item, idx) => {
  console.log(`[${idx + 1}] ID: ${item.videoId} | Subject: ${item.subjectName} | Lesson: ${item.lessonTitle}`);
  console.log(`     Title: ${item.title}`);
  console.log(`     Teacher: ${item.teacher}`);
  console.log(`     URL: ${item.url}`);
  console.log(`     Reason: ${item.auditReason}\n`);
});

console.log('=== NEEDS_VERIFICATION (26 items) ===');
data.NEEDS_VERIFICATION.forEach((item, idx) => {
  console.log(`[${idx + 1}] ID: ${item.videoId} | Subject: ${item.subjectName} | Lesson: ${item.lessonTitle}`);
  console.log(`     Title: ${item.title}`);
  console.log(`     Teacher: ${item.teacher}`);
  console.log(`     URL: ${item.url}`);
  console.log(`     Reason: ${item.auditReason}\n`);
});
