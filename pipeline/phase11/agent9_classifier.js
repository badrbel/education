/**
 * mordix_ai — PHASE 11: Agent 9 (Resource Classifier)
 * 
 * Classifies all candidates into the unified standard 10-category taxonomy.
 * Assigns uniform badges, standardized problem/solution capabilities, and metadata.
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const verifiedDir = path.join(baseDir, 'data/pipeline/verified');

function stripEmojis(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyResource(item) {
  let primaryType = item.type;
  let subtype = item.subtype || 'general';
  let badge = item.badge || '';
  const title = (item.title || '').toLowerCase();

  if (item.videoId) {
    if (primaryType === 'EXERCISE_VIDEO' || /حل\s+تمرين|حلول|مسألة/i.test(title)) {
      primaryType = 'EXERCISE_VIDEO';
      subtype = 'video_solution';
      badge = badge || 'حل تمرين بالفيديو';
    } else if (primaryType === 'REVISION_VIDEO' || /مراجعة|ملخص\s+شامل/i.test(title)) {
      primaryType = 'REVISION_VIDEO';
      subtype = item.revisionScope || 'video_revision';
      badge = badge || 'مراجعة بالفيديو';
    } else {
      primaryType = 'LESSON_VIDEO';
      subtype = 'video_explanation';
      badge = badge || 'شرح الدرس بالفيديو';
    }
  } else if (item.category === 'bem_past_paper' || primaryType === 'BEM_EXAM') {
    primaryType = 'BEM_EXAM';
    subtype = 'official_bem';
    badge = badge || 'شهادة التعليم المتوسط';
  } else if (item.category === 'exam_test' || primaryType === 'EXAM' || primaryType === 'TEST') {
    if (/فرض/i.test(title) || primaryType === 'TEST') {
      primaryType = 'TEST';
      subtype = 'term_test';
      badge = badge || 'فرض فصلي';
    } else {
      primaryType = 'EXAM';
      subtype = 'term_exam';
      badge = badge || 'اختبار فصلي';
    }
  } else if (item.category === 'exercise_series' || primaryType === 'EXERCISE') {
    if (item.hasSolution || /مع\s+الحل|محلول|بالحل/i.test(title)) {
      primaryType = 'EXERCISE_SOLUTION';
      subtype = 'solved_exercise';
      badge = badge || 'تمرين محلول مع الإجابة';
    } else {
      primaryType = 'EXERCISE';
      subtype = item.subtype || 'practice_series';
      badge = badge || 'سلسلة تمارين';
    }
  } else if (item.category === 'course_summary' || primaryType === 'SUMMARY') {
    primaryType = 'SUMMARY';
    subtype = 'summary_fiche';
    badge = badge || 'ملخص شامل للدرس';
  } else if (item.category === 'revision_guide' || primaryType === 'REVISION') {
    primaryType = 'REVISION';
    subtype = 'revision_booklet';
    badge = badge || 'كراس المراجعة المركزة';
  }

  const targetUrl = item.directPdfUrl || item.landingUrl || item.sourceUrl || item.url;
  const isVideo = Boolean(item.videoId);
  const isPdf = Boolean(item.directPdfUrl || (targetUrl && targetUrl.includes('.pdf')));

  const problem = {
    available: true,
    format: isVideo ? 'video' : (isPdf ? 'pdf' : 'document'),
    url: targetUrl,
    text: stripEmojis(item.title)
  };

  const solution = {
    available: Boolean(item.hasSolution || item.videoId),
    format: isVideo ? 'video' : (isPdf ? 'pdf' : 'document'),
    url: targetUrl,
    text: item.hasSolution ? 'الحل النموذجي المعتمد متوفر مع الموضوع' : null
  };

  return {
    ...item,
    standardType: primaryType,
    standardSubtype: subtype,
    badge: stripEmojis(badge),
    problem,
    solution
  };
}

function runClassifier() {
  console.log('==================================================');
  console.log('[AGENT 9] 4AM Standard Taxonomy Classifier Starting...');
  console.log('==================================================');

  const inFile = path.join(verifiedDir, 'phase11_agent8_source_validated.json');
  if (!fs.existsSync(inFile)) {
    throw new Error('Validated input file not found: ' + inFile);
  }

  const items = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  console.log(`Loaded ${items.length} items to classify.`);

  const classified = items.map(classifyResource);

  const typeCounts = {};
  for (const c of classified) {
    typeCounts[c.standardType] = (typeCounts[c.standardType] || 0) + 1;
  }

  console.log('Classification Breakdown across 10 Educational Types:');
  for (const [t, cnt] of Object.entries(typeCounts)) {
    console.log(`  ${t.padEnd(20)}: ${cnt}`);
  }

  const outFile = path.join(verifiedDir, 'phase11_agent9_classified.json');
  fs.writeFileSync(outFile, JSON.stringify(classified, null, 2), 'utf8');
  console.log(`Saved classified candidates to: ${outFile}`);

  return classified;
}

if (require.main === module) {
  runClassifier();
}

module.exports = { runClassifier };
