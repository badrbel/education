/**
 * mordix_ai — PHASE 11: Agent 11 (Duplicate Detector)
 * 
 * Eliminates duplicate URLs, video IDs, document slugs, and titles against:
 * 1. Existing 790 resources in data/registry_4am.js
 * 2. New candidates among themselves
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const verifiedDir = path.join(baseDir, 'data/pipeline/verified');

function runDuplicateDetector() {
  console.log('==================================================');
  console.log('[AGENT 11] 4AM Duplicate Detector Starting...');
  console.log('==================================================');

  // Load existing registry
  const registryPath = path.join(baseDir, 'data/registry_4am.js');
  global.window = {};
  eval(fs.readFileSync(registryPath, 'utf8'));
  const existingRegistry = global.window.PlatformRegistry4AM || {};
  const existingItems = Object.values(existingRegistry);

  console.log(`Loaded existing registry with ${existingItems.length} resources.`);

  const existingVideoIds = new Set();
  const existingUrls = new Set();
  const existingTitles = new Set();

  for (const it of existingItems) {
    if (it.videoId) existingVideoIds.add(it.videoId);
    if (it.url) existingUrls.add(it.url);
    if (it.sourceUrl) existingUrls.add(it.sourceUrl);
    if (it.directPdfUrl) existingUrls.add(it.directPdfUrl);
    if (it.documentUrl) existingUrls.add(it.documentUrl);
    if (it.title) existingTitles.add(it.title.trim().toLowerCase());
  }

  // Load matched candidates from Agent 10
  const inFile = path.join(verifiedDir, 'phase11_agent10_matched.json');
  if (!fs.existsSync(inFile)) {
    throw new Error('Matched input file not found: ' + inFile);
  }

  const candidates = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  console.log(`Loaded ${candidates.length} candidates to deduplicate.`);

  let dupWithRegistry = 0;
  let dupInternal = 0;
  const uniqueCandidates = [];

  const seenCandidateVideoIds = new Set();
  const seenCandidateUrls = new Set();
  const seenCandidateTitles = new Set();

  for (const c of candidates) {
    const targetUrl = c.directPdfUrl || c.landingUrl || c.sourceUrl || c.url;
    const cleanTitle = (c.title || '').trim().toLowerCase();

    // Check against existing registry
    if (c.videoId && existingVideoIds.has(c.videoId)) {
      dupWithRegistry++;
      continue;
    }
    if (targetUrl && existingUrls.has(targetUrl)) {
      dupWithRegistry++;
      continue;
    }
    if (cleanTitle && existingTitles.has(cleanTitle)) {
      dupWithRegistry++;
      continue;
    }

    // Check against current candidates
    if (c.videoId) {
      if (seenCandidateVideoIds.has(c.videoId)) {
        dupInternal++;
        continue;
      }
      seenCandidateVideoIds.add(c.videoId);
    }

    if (targetUrl) {
      if (seenCandidateUrls.has(targetUrl)) {
        dupInternal++;
        continue;
      }
      seenCandidateUrls.add(targetUrl);
    }

    const titleKey = `${c.subjectId}::${cleanTitle}`;
    if (seenCandidateTitles.has(titleKey)) {
      dupInternal++;
      continue;
    }
    seenCandidateTitles.add(titleKey);

    uniqueCandidates.push({
      ...c,
      dedupStatus: 'UNIQUE'
    });
  }

  console.log(`Deduplication Results:`);
  console.log(`  Duplicates with existing Registry: ${dupWithRegistry}`);
  console.log(`  Internal Duplicates removed:       ${dupInternal}`);
  console.log(`  Unique New Candidates remaining:   ${uniqueCandidates.length}`);

  const outFile = path.join(verifiedDir, 'phase11_agent11_deduped.json');
  fs.writeFileSync(outFile, JSON.stringify(uniqueCandidates, null, 2), 'utf8');
  console.log(`Saved deduplicated candidates to: ${outFile}`);

  return uniqueCandidates;
}

if (require.main === module) {
  runDuplicateDetector();
}

module.exports = { runDuplicateDetector };
