const data = JSON.parse(require('fs').readFileSync('scratch/final_classified_audit.json', 'utf8'));

console.log('--- REJECT RECOMMENDED (6) ---');
data.REJECT_RECOMMENDED.forEach((v, i) => {
  console.log(`[${i+1}] [${v.subjectName}] [${v.lessonTitle}]`);
  console.log(`    ${v.title} (${v.teacher})`);
  console.log(`    ID: ${v.videoId} | URL: ${v.url}`);
  console.log(`    السبب: ${v.auditReason}\n`);
});

console.log('--- NEEDS VERIFICATION BREAKDOWN ---');
const macroRev = data.NEEDS_VERIFICATION.filter(v => v.auditReason.includes('145'));
const multiLvl = data.NEEDS_VERIFICATION.filter(v => v.auditReason.includes('مشتركة'));
const generic = data.NEEDS_VERIFICATION.filter(v => !v.auditReason.includes('145') && !v.auditReason.includes('مشتركة'));

console.log(`Macro reviews unlinked to official lesson: ${macroRev.length}`);
console.log(`Multi-level including 4AM: ${multiLvl.length}`);
console.log(`Generic/subtopic titles: ${generic.length}`);
console.log(`Total: ${data.NEEDS_VERIFICATION.length}`);

console.log('\nSample Generic/Subtopic titles (first 10):');
generic.slice(0, 10).forEach((v, i) => {
  console.log(`[${i+1}] [${v.subjectName}] [${v.lessonTitle}]`);
  console.log(`    ${v.title} (${v.teacher})`);
  console.log(`    ID: ${v.videoId} | URL: ${v.url}\n`);
});
