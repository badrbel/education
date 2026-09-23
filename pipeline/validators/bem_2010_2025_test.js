/**
 * mordix_ai — BEM 2010–2025 EXAM INTEGRITY AND SOLUTIONS CONTRACT TEST
 * 
 * Verifies:
 * 1. All 9 subjects in 4AM have exactly 16 official BEM sessions from 2010 to 2025 (144 sessions total).
 * 2. Zero missing years across all 9 subjects.
 * 3. Strict separation of problem and solution, with verified DzExams official portal URLs.
 * 4. Video solution integrity: exactly 91 curated YouTube solutions attached to matching 2024 and 2023 sessions.
 * 5. PlatformStore query contract: getResourcesByType returns 16 sessions per subject sorted descending.
 * 6. Zero emojis contract across all 144 sessions.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const baseDir = path.resolve(__dirname, '../..');

console.log('====================================================');
console.log('  TEST SUITE: BEM 2010-2025 EXAMS & CURATED SOLUTIONS');
console.log('====================================================\n');

// Mock window and browser context
global.window = {
  PlatformData: {},
  PlatformData4AM: {},
  PlatformRegistry: {},
  PlatformRegistry4AM: {},
  appState: { level: '4am' }
};

// Load store, four_am and registry_4am
eval(fs.readFileSync(path.join(baseDir, 'data/four_am.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'data/registry_4am.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'data/store.js'), 'utf8'));

const store = global.window.PlatformStore;
const registry4am = global.window.PlatformRegistry4AM;

const expectedSubjects = [
  { id: 'math_4am', name: 'الرياضيات', v2024: 11, v2023: 9, url: 'https://www.dzexams.com/ar/bem/mathematiques' },
  { id: 'arabic_4am', name: 'اللغة العربية', v2024: 8, v2023: 6, url: 'https://www.dzexams.com/ar/bem/arabe' },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', v2024: 8, v2023: 4, url: 'https://www.dzexams.com/ar/bem/physique' },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', v2024: 3, v2023: 1, url: 'https://www.dzexams.com/ar/bem/sciences-naturelles' },
  { id: 'french_4am', name: 'اللغة الفرنسية', v2024: 6, v2023: 4, url: 'https://www.dzexams.com/ar/bem/francais' },
  { id: 'english_4am', name: 'اللغة الإنجليزية', v2024: 7, v2023: 3, url: 'https://www.dzexams.com/ar/bem/anglais' },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', v2024: 2, v2023: 4, url: 'https://www.dzexams.com/ar/bem/histoire-geographie' },
  { id: 'islamic_4am', name: 'التربية الإسلامية', v2024: 3, v2023: 6, url: 'https://www.dzexams.com/ar/bem/tarbia-islamia' },
  { id: 'civics_4am', name: 'التربية المدنية', v2024: 4, v2023: 2, url: 'https://www.dzexams.com/ar/bem/tarbia-madania' }
];

const expectedYears = [];
for (let y = 2025; y >= 2010; y--) {
  expectedYears.push(y);
}

// TEST 1: 144 BEM Sessions Coverage (9 subjects x 16 years)
console.log('--- 1. فحص اكتمال دورات شهادة BEM الـ 144 من 2010 إلى 2025 للمواد الـ 9 ---');
let totalSessions = 0;

for (const subj of expectedSubjects) {
  const sessions = Object.values(registry4am).filter(r => r.subjectId === subj.id && r.type === 'bem');
  assert.strictEqual(sessions.length, 16, `المادة [${subj.name}] يجب أن تحتوي على 16 دورة BEM بالضبط (الفعلي: ${sessions.length})`);
  totalSessions += sessions.length;

  // Check years
  const foundYears = sessions.map(s => s.year).sort((a, b) => b - a);
  assert.deepStrictEqual(foundYears, expectedYears, `المادة [${subj.name}] تحتوي على سنوات مفقودة أو غير مطابقة`);
}

assert.strictEqual(totalSessions, 144, `إجمالي دورات BEM يجب أن يكون 144 دورة (الفعلي: ${totalSessions})`);
console.log(`[PASS] تم التحقق بنجاح من وجود 144 دورة BEM تغطي السنوات 2010-2025 للمواد الـ 9 بصفر سنة مفقودة.`);

// TEST 2: URL & Structural Contract
console.log('\n--- 2. فحص سلامة الروابط الرسمية وهيكل الموضوع والحل في دورات BEM ---');
const allBemSessions = Object.values(registry4am).filter(r => r.type === 'bem');

for (const session of allBemSessions) {
  // Level & Type
  assert.strictEqual(session.levelId, '4am', `جلسة ${session.id} يجب أن تحمل levelId: '4am'`);
  assert.strictEqual(session.verificationStatus, 'verified', `جلسة ${session.id} يجب أن تكون verified`);

  // Source
  assert(session.sourceUrl && session.sourceUrl.startsWith('https://www.dzexams.com/ar/bem/'), `رابط غير سليم في ${session.id}: ${session.sourceUrl}`);
  assert.strictEqual(session.source.type, 'official', `مصدر ${session.id} يجب أن يكون official`);
  assert.strictEqual(session.source.verified, true, `مصدر ${session.id} غير موثق`);

  // Problem
  assert.strictEqual(session.problem.available, true, `الموضوع غير متوفر في ${session.id}`);
  assert(session.problem.url && session.problem.url.startsWith('https://www.dzexams.com/ar/bem/'), `رابط الموضوع غير سليم في ${session.id}`);

  // Solution
  assert.strictEqual(session.solution.available, true, `الحل غير متوفر في ${session.id}`);
  assert(session.solution.url && session.solution.url.startsWith('https://www.dzexams.com/ar/bem/'), `رابط الحل غير سليم في ${session.id}`);
}
console.log('[PASS] جميع الـ 144 جلسة BEM مطابقة للمواصفات الرسمية مع فصل سليم بين الموضوع والحل.');

// TEST 3: Curated YouTube Solutions Matching
console.log('\n--- 3. فحص ربط حلول YouTube الـ 91 بسنواتها المطابقة بدقة (2024 و 2023) ---');
let totalVerifiedVideos = 0;

for (const subj of expectedSubjects) {
  const s2024 = registry4am[`${subj.id}-bem-2024`];
  assert(s2024, `دورة 2024 مفقودة لمادة ${subj.name}`);
  const vids2024 = (s2024.solution && s2024.solution.videoSolutions) || [];
  assert.strictEqual(vids2024.length, subj.v2024, `فيديوهات 2024 لمادة [${subj.name}] يجب أن تكون ${subj.v2024} (الفعلي: ${vids2024.length})`);
  assert(vids2024.every(v => v.year === 2024), `وجود فيديو لا يخص سنة 2024 في دورة 2024 لمادة ${subj.name}`);

  const s2023 = registry4am[`${subj.id}-bem-2023`];
  assert(s2023, `دورة 2023 مفقودة لمادة ${subj.name}`);
  const vids2023 = (s2023.solution && s2023.solution.videoSolutions) || [];
  assert.strictEqual(vids2023.length, subj.v2023, `فيديوهات 2023 لمادة [${subj.name}] يجب أن تكون ${subj.v2023} (الفعلي: ${vids2023.length})`);
  assert(vids2023.every(v => v.year === 2023), `وجود فيديو لا يخص سنة 2023 في دورة 2023 لمادة ${subj.name}`);

  totalVerifiedVideos += (vids2024.length + vids2023.length);

  // Other years should have 0 videos
  for (const year of expectedYears) {
    if (year !== 2024 && year !== 2023) {
      const sOther = registry4am[`${subj.id}-bem-${year}`];
      const otherVids = (sOther.solution && sOther.solution.videoSolutions) || [];
      assert.strictEqual(otherVids.length, 0, `سنة ${year} لمادة ${subj.name} لا يجب أن تحتوي على فيديوهات عشوائية`);
    }
  }
}

assert.strictEqual(totalVerifiedVideos, 91, `إجمالي حلول YouTube المرتبطة يجب أن يكون 91 فيديو بالضبط (الفعلي: ${totalVerifiedVideos})`);
console.log(`[PASS] تم ربط جميع حلول YouTube الـ 91 بسنواتها الصحيحة 100% (2024 و 2023) دون أي خلط عشوائي.`);

// TEST 4: Video Technical Quality
console.log('\n--- 4. فحص الجودة التقنية لجميع حلول الفيديو (معرف 11 حرفاً، روابط مباشرة، صفر روابط بحث) ---');
for (const session of allBemSessions) {
  const vids = (session.solution && session.solution.videoSolutions) || [];
  for (const v of vids) {
    assert(v.id && /^[a-zA-Z0-9_-]{11}$/.test(v.id), `معرف غير صالح في فيديو: ${v.id}`);
    assert(v.url && v.url.startsWith('https://www.youtube.com/watch?v='), `رابط فيديو غير مباشر: ${v.url}`);
    assert(!v.url.includes('search_query='), `وجود رابط بحث في فيديو: ${v.url}`);
    assert.strictEqual(v.verified, true, `فيديو غير موثق: ${v.id}`);
  }
}
console.log('[PASS] كافة حلول الفيديو تمتلك معرفات سليمة وروابط مباشرة صريحة دون أي رابط بحث.');

// TEST 5: PlatformStore Query & Sorting Contract
console.log('\n--- 5. فحص استعلامات وترتيب PlatformStore لمواضيع BEM ---');
for (const subj of expectedSubjects) {
  const storeRes = store.getResourcesByType(subj.name, 'bem', '4am');
  assert.strictEqual(storeRes.length, 16, `PlatformStore يجب أن يسترجع 16 دورة لمادة ${subj.name}`);
  
  // Verify descending sort
  for (let i = 0; i < storeRes.length - 1; i++) {
    assert(storeRes[i].year >= storeRes[i + 1].year, `المواضيع لم ترتب تنازلياً في مادة ${subj.name}`);
  }
}
console.log('[PASS] دوال PlatformStore تسترجع دورات BEM الـ 16 لكل مادة مرتبة تنازلياً من 2025 إلى 2010.');

// TEST 6: Zero Emojis Contract
console.log('\n--- 6. فحص سياسة الصفر إيموجي (Zero Emojis Contract) في دورات BEM ---');
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
for (const session of allBemSessions) {
  assert(!emojiRegex.test(session.title), `وجود إيموجي في عنوان دورة: ${session.title}`);
  assert(!emojiRegex.test(session.badge || ''), `وجود إيموجي في شارة دورة: ${session.badge}`);
  const vids = (session.solution && session.solution.videoSolutions) || [];
  for (const v of vids) {
    assert(!emojiRegex.test(v.title), `وجود إيموجي في عنوان فيديو: ${v.title}`);
  }
}
console.log('[PASS] خلو تام من أي إيموجي في كافة بيانات دورات BEM وعناوين الحلول المرئية.');

console.log('\n====================================================');
console.log('ALL BEM 2010-2025 EXAM & SOLUTIONS TESTS PASSED (100% SUCCESS)');
console.log('====================================================\n');
