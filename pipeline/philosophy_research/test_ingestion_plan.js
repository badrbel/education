/**
 * test_ingestion_plan.js
 * Pre-flight verification of the 70 items to be ingested
 */

const fs = require('fs');
const path = require('path');

const { summary, auditedItems } = require('./audit_curated_82.js');

// Select items:
// 1. All VALID_FOR_INGESTION (64 items)
// 2. Both MANUAL_REVIEW_REQUIRED (items 51 and 76) approved by user
// 3. Methodology items without lesson (items 79, 80, 81, 82) directed to reviews
const toIngest = [];

auditedItems.forEach(it => {
  if (it.finalDecision === 'VALID_FOR_INGESTION') {
    toIngest.push({ ...it, targetType: 'lesson_resource' });
  } else if (it.finalDecision === 'MANUAL_REVIEW_REQUIRED' && (it.num === 51 || it.num === 76)) {
    toIngest.push({ ...it, targetType: 'lesson_resource', approvedByManualReview: true });
  } else if ([79, 80, 81, 82].includes(it.num)) {
    toIngest.push({ ...it, targetType: 'methodology_review', lesson: null, lessonId: null });
  }
});

console.log('Total items selected for ingestion:', toIngest.length);
console.log('Breakdown:');
console.log('- Lesson resources (Valid):', toIngest.filter(x => x.targetType === 'lesson_resource' && !x.approvedByManualReview).length);
console.log('- Lesson resources (Approved Manual):', toIngest.filter(x => x.approvedByManualReview).length);
console.log('- Methodology reviews:', toIngest.filter(x => x.targetType === 'methodology_review').length);

// Verify each item
const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let errors = 0;
toIngest.forEach((it, idx) => {
  if (emojiRegex.test(it.title)) {
    console.error(`Item ${it.num} has emoji in title:`, it.title);
    errors++;
  }
  if (it.source === 'YouTube') {
    const yId = it.url.split('v=')[1];
    if (!yId || !ytRegex.test(yId)) {
      console.error(`Item ${it.num} invalid YouTube ID:`, it.url);
      errors++;
    }
  }
  if (it.targetType === 'lesson_resource' && !it.lessonId) {
    console.error(`Item ${it.num} missing lessonId!`);
    errors++;
  }
});

console.log('Verification completed. Errors found:', errors);
