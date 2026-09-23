/**
 * mordix_ai — PHASE 11.7: Final Accepted Resource Ingestion & Reconciliation
 * 
 * 1. Verifies 3AS SHA-256 baseline before modifying anything.
 * 2. Reconciles data/registry_4am.js:
 *    - Removes 3 rejected foreign curriculum videos (UK A-Level, Saudi iEN).
 *    - Unmaps 9 multi-lesson general revision videos (sets lessonId: null, resourceScope: 'SUBJECT_LEVEL').
 *    - Preserves 151 high-quality verified lesson videos (>40K views).
 * 3. Reconciles data/four_am.js:
 *    - Removes the 3 rejected foreign videos from channelsData.
 *    - Removes the 9 multi-lesson general videos from single-lesson channelsData.
 * 4. Ensures 0 emojis across all modified files.
 * 5. Verifies 3AS SHA-256 baseline after modifications.
 */

const fs = require('fs');
const path = require('path');
const { verify3ASIntegrity } = require('./lock_3as');

const baseDir = path.resolve(__dirname, '../..');
const registryPath = path.join(baseDir, 'data/registry_4am.js');
const fourAmPath = path.join(baseDir, 'data/four_am.js');

function stripEmojis(text) {
  if (!text) return '';
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function runReconciliation() {
  console.log('=== PHASE 11.7: RECONCILIATION & FINAL INGESTION ===\n');

  // Step 1: Verify 3AS before
  console.log('1. Checking 3AS cryptographic baseline BEFORE...');
  verify3ASIntegrity();

  // Step 2: Load current data
  global.window = {};
  eval(fs.readFileSync(registryPath, 'utf8'));
  const registry = global.window.PlatformRegistry4AM || {};

  global.window = {};
  eval(fs.readFileSync(fourAmPath, 'utf8'));
  const fourAm = global.window.PlatformData4AM || {};

  const rejectedIds = new Set(['yt-40k-BwHUObvb_Wo', 'yt-40k-olMC10IRmz8', 'yt-40k-EUsMS6lmy8U']);
  const rejectedVideoIds = new Set(['BwHUObvb_Wo', 'olMC10IRmz8', 'EUsMS6lmy8U']);

  const multiLessonIds = new Set([
    'yt-40k-UQXvC0Ggl1w',
    'yt-40k-Yeo1wYrx138',
    'yt-40k-zW7Fz_9orRo',
    'yt-40k-JbYXX3PB2-M',
    'yt-40k-ZRIJ9k1ozhM',
    'yt-40k-uOX5YRSKYQE',
    'yt-40k-WdELWUo35yA',
    'yt-40k-gNyS6ZxMs7I',
    'yt-40k-6YDUnQm3am8'
  ]);
  const multiLessonVideoIds = new Set([
    'UQXvC0Ggl1w',
    'Yeo1wYrx138',
    'zW7Fz_9orRo',
    'JbYXX3PB2-M',
    'ZRIJ9k1ozhM',
    'uOX5YRSKYQE',
    'WdELWUo35yA',
    'gNyS6ZxMs7I',
    '6YDUnQm3am8'
  ]);

  // Step 3: Clean registry
  console.log(`Initial registry count: ${Object.keys(registry).length}`);
  
  // Remove rejected foreign resources
  for (const id of rejectedIds) {
    if (registry[id]) {
      delete registry[id];
      console.log(`- Removed rejected foreign resource from registry: ${id}`);
    }
  }

  // Update multi-lesson videos to subject-level in registry
  let unmappedCount = 0;
  for (const id of multiLessonIds) {
    const res = registry[id];
    if (res) {
      res.lessonId = null;
      res.lessonTitle = null;
      res.resourceScope = 'SUBJECT_LEVEL';
      res.subtype = 'general_revision';
      res.badge = 'مراجعة شاملة (+40 ألف)';
      unmappedCount++;
    }
  }
  console.log(`- Reconciled ${unmappedCount} multi-lesson general revision resources to subject-level (lessonId = null).`);

  // Step 4: Clean four_am.js
  let removedFromChannels = 0;
  for (const [subjKey, subj] of Object.entries(fourAm)) {
    if (!subj.channelsData) continue;
    for (const [lessonTitle, channels] of Object.entries(subj.channelsData)) {
      for (const ch of channels) {
        if (!ch.videos) continue;
        const initialLen = ch.videos.length;
        ch.videos = ch.videos.filter(v => {
          if (rejectedVideoIds.has(v.id)) return false;
          if (multiLessonVideoIds.has(v.id)) return false;
          return true;
        });
        removedFromChannels += (initialLen - ch.videos.length);
      }
      // Clean empty channels
      subj.channelsData[lessonTitle] = channels.filter(ch => ch.videos && ch.videos.length > 0);
    }
  }
  console.log(`- Removed ${removedFromChannels} videos from single-lesson channelsData (3 rejected + 9 general multi-lesson).`);

  // Step 5: Write cleaned registry_4am.js
  const registryOutput = `/**\n * mordix_ai — سجل الموارد التعليمية الموحد لطور 4AM\n * محدث ومفحوص بالكامل (PHASE 11.7)\n * خلو تام من الإيموجيات (Zero Emojis)\n */\n\nwindow.PlatformRegistry4AM = ${JSON.stringify(registry, null, 2)};\n`;
  fs.writeFileSync(registryPath, stripEmojis(registryOutput), 'utf8');
  console.log(`Updated registry written. Total entries: ${Object.keys(registry).length}`);

  // Step 6: Write cleaned four_am.js
  const fourAmOutput = `/**\n * mordix_ai — منهاج السنة الرابعة متوسط المعتمد (4AM Curriculum)\n * محدث ومفحوص بالكامل (PHASE 11.7)\n * خلو تام من الإيموجيات (Zero Emojis)\n */\n\nwindow.PlatformData4AM = ${JSON.stringify(fourAm, null, 2)};\n`;
  fs.writeFileSync(fourAmPath, stripEmojis(fourAmOutput), 'utf8');
  console.log('Updated four_am.js written.');

  // Step 7: Verify 3AS after
  console.log('\n7. Checking 3AS cryptographic baseline AFTER...');
  verify3ASIntegrity();

  console.log('\nReconciliation complete and verified!');
}

if (require.main === module) {
  runReconciliation();
}

module.exports = { runReconciliation };
