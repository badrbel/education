const data = JSON.parse(require('fs').readFileSync('scratch/final_classified_audit.json', 'utf8'));

console.log('--- DETAILED BREAKDOWN OF 42 NEEDS_VERIFICATION VIDEOS ---');
data.NEEDS_VERIFICATION.forEach((v, i) => {
  console.log(`[${i+1}] [${v.subjectName}] [${v.lessonTitle}]`);
  console.log(`    Title: ${v.title}`);
  console.log(`    Teacher: ${v.teacher}`);
  console.log(`    ID: ${v.videoId} | URL: ${v.url}`);
  console.log(`    Audit Reason: ${v.auditReason}\n`);
});
