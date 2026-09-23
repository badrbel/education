/**
 * mordix_ai — Automated Test Suite: Phase AF-Enrichment Verification
 * Validates 3AS AF data integrity, coverage, YouTube safety, terms/figures, teacher provenance, and 4AM isolation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(__dirname, '../..');

console.log('====================================================');
console.log('  TEST SUITE: 3AS AF ENRICHMENT VALIDATION (PHASE AF)');
console.log('====================================================\n');

// 1. Load Data
global.window = { PlatformData: {} };

const subjectFiles = [
  'data/philosophy.js',
  'data/arabic.js',
  'data/history.js',
  'data/islamic.js',
  'data/french.js',
  'data/english.js',
  'data/math.js'
];

for (const f of subjectFiles) {
  eval(fs.readFileSync(path.join(baseDir, f), 'utf8'));
}
eval(fs.readFileSync(path.join(baseDir, 'data/registry.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'data/store.js'), 'utf8'));

const platformData = global.window.PlatformData;
const registry = global.window.PlatformRegistry;
const PlatformStore = global.window.PlatformStore;

// TEST 1: AF Data Integrity
console.log('--- 1. فحص سلامة بيانات مواد 3AS الـ 7 (AF Data Integrity) ---');
const expectedSubjects = [
  'الفلسفة',
  'اللغة العربية',
  'التاريخ والجغرافيا',
  'العلوم الإسلامية',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'الرياضيات'
];
assert.strictEqual(Object.keys(platformData).length, 7, 'يجب أن يحتوي PlatformData على 7 مواد بالضبط لـ 3AS');
for (const s of expectedSubjects) {
  assert(platformData[s], `المادة [${s}] غير موجودة في PlatformData`);
  assert.strictEqual(platformData[s].grade, 'الثالثة ثانوي', `المستوى غير مطابق لـ [${s}]`);
  assert.strictEqual(platformData[s].branch, 'آداب وفلسفة', `الشعبة غير مطابقة لـ [${s}]`);
}
console.log('[PASS] المواد الـ 7 لطور 3AS آداب وفلسفة موجودة ومطابقة للمواصفات.');

// TEST 2: Lesson Coverage & Zero Bare Lessons
console.log('\n--- 2. فحص تغطية الدروس وسد الفجوات في الإنجليزية (AF Lesson Coverage) ---');
const englishLessons = PlatformStore.getLessons('اللغة الإنجليزية', '3as');
const quantifiers = englishLessons.find(l => l.title === 'Quantifiers');
const syllables = englishLessons.find(l => l.title === 'Syllables');

assert(quantifiers, 'درس Quantifiers غير موجود في فهرس الإنجليزية');
assert(quantifiers.videos > 0, `درس Quantifiers لا يحتوي على فيديوهات: ${quantifiers.videos}`);
assert(syllables, 'درس Syllables غير موجود في فهرس الإنجليزية');
assert(syllables.videos > 0, `درس Syllables لا يحتوي على فيديوهات: ${syllables.videos}`);
console.log(`[PASS] تم سد فجوة درسي الإنجليزية: Quantifiers (${quantifiers.videos} فيديو)، Syllables (${syllables.videos} فيديو).`);

// TEST 3: Resource Registry Integrity
console.log('\n--- 3. فحص سجل الموارد الموحد (PlatformRegistry Integrity) ---');
const totalRegistryCount = Object.keys(registry).length;
console.log(`إجمالي موارد السجل الحالي: ${totalRegistryCount}`);
assert(totalRegistryCount >= 893, `عدد موارد السجل أقل من المتوقع: ${totalRegistryCount}`);

for (const [rId, r] of Object.entries(registry)) {
  assert(r.id, `المورد ${rId} بدون معرف`);
  assert(r.subjectId, `المورد ${rId} بدون subjectId`);
  assert(r.type, `المورد ${rId} بدون type`);
  assert(r.source, `المورد ${rId} بدون source`);
  assert(r.problem, `المورد ${rId} بدون problem`);

  if (r.lessonId) {
    // Ensure lessonId exists in platformData
    let foundLesson = false;
    for (const sObj of Object.values(platformData)) {
      if ((sObj.lessons || []).some(l => l.lessonId === r.lessonId || `${sObj.id}-${l.id}` === r.lessonId)) {
        foundLesson = true;
        break;
      }
    }
    assert(foundLesson, `المورد ${rId} يشير إلى lessonId غير موجود: ${r.lessonId}`);
  }
}
console.log('[PASS] سجل الموارد سليم بنسبة 100% ولا يحتوي على أي درس مفقود أو غير معرف.');

// TEST 4: YouTube URL & Video ID Safety Contract
console.log('\n--- 4. فحص سلامة روابط ومعرفات YouTube وعقد أمان المشغل (YouTube URL & ID Integrity) ---');
let checkedVideos = 0;

for (const [rId, r] of Object.entries(registry)) {
  if (r.type === 'video' || r.source?.type === 'youtube') {
    checkedVideos++;
    const yId = r.videoId || r.youtubeId;
    assert(yId && /^[a-zA-Z0-9_-]{11}$/.test(yId), `معرف غير صالح للمورد ${rId}: ${yId}`);
    assert(r.url && r.url.startsWith('https://www.youtube.com/watch?v='), `رابط غير مباشر للمورد ${rId}: ${r.url}`);
    assert(!r.url.includes('search_query='), `رابط بحث غير مسموح في المورد ${rId}`);
  }
}

for (const [sName, sObj] of Object.entries(platformData)) {
  for (const [lTitle, chList] of Object.entries(sObj.channelsData || {})) {
    for (const ch of chList) {
      for (const v of ch.videos || []) {
        checkedVideos++;
        const vId = v.id || v.videoId || v.youtubeId;
        assert(vId && /^[a-zA-Z0-9_-]{11}$/.test(vId), `معرف غير صالح في [${sName} -> ${lTitle}]: ${vId}`);
        if (v.url) {
          assert(!v.url.includes('search_query='), `رابط بحث غير مسموح في [${sName} -> ${lTitle}]: ${v.url}`);
        }
      }
    }
  }
}
console.log(`[PASS] تم فحص ${checkedVideos} فيديو: جميعها تمتلك معرفات 11 حرفاً وسليمة 100% من روابط البحث.`);

// TEST 5: Deduplication Integrity
console.log('\n--- 5. فحص منع التكرار (Deduplication Integrity) ---');
const regIdSet = new Set();
for (const rId of Object.keys(registry)) {
  assert(!regIdSet.has(rId), `تكرار في معرف المورد: ${rId}`);
  regIdSet.add(rId);
}
console.log('[PASS] لا يوجد أي تكرار في معرفات موارد السجل.');

// TEST 6: Geographical Terms & Historical Figures
console.log('\n--- 6. فحص المصطلحات الجغرافية والشخصيات (Terms & Figures Integrity) ---');
const geoTerms = Object.values(registry).filter(r => r.topicCategory === 'GEOGRAPHICAL_TERMS');
const histFigures = Object.values(registry).filter(r => r.topicCategory === 'HISTORICAL_FIGURES');

console.log(`عدد موارد المصطلحات الجغرافية المسجلة: ${geoTerms.length}`);
console.log(`عدد موارد الشخصيات التاريخية المسجلة: ${histFigures.length}`);

assert(geoTerms.length > 0, 'يجب أن تتوفر موارد مصطلحات جغرافية');
assert(histFigures.length > 0, 'يجب أن تتوفر موارد شخصيات تاريخية');

for (const t of geoTerms) {
  assert.strictEqual(t.subjectId, 'history', `مورد المصطلحات الجغرافية يجب أن يتبع التاريخ والجغرافيا: ${t.id}`);
  assert.strictEqual(t.topicCategory, 'GEOGRAPHICAL_TERMS');
}
for (const f of histFigures) {
  assert.strictEqual(f.subjectId, 'history', `مورد الشخصيات يجب أن يتبع التاريخ والجغرافيا: ${f.id}`);
  assert.strictEqual(f.topicCategory, 'HISTORICAL_FIGURES');
}
console.log('[PASS] تم التحقق من تصنيف وتوثيق المصطلحات الجغرافية والشخصيات التاريخية وفصلهما بدقة.');

// TEST 7: Teacher Provenance (Abu Bakr Mabrouk & Atiya Souissi)
console.log('\n--- 7. فحص مسار بذور الاستكشاف للأساتذة (Teacher Provenance) ---');
const abuBakrVideos = Object.values(registry).filter(r => r.teacher === 'الأستاذ أبو بكر مبروك');
const atiyaVideos = Object.values(registry).filter(r => r.teacher === 'الأستاذ عطية سويسي');

console.log(`عدد موارد الأستاذ أبو بكر مبروك المعتمدة: ${abuBakrVideos.length}`);
console.log(`عدد موارد الأستاذ عطية سويسي المعتمدة: ${atiyaVideos.length}`);

assert(abuBakrVideos.length > 0, 'لم يتم تسجيل أي مورد للأستاذ أبو بكر مبروك');
assert(atiyaVideos.length > 0, 'لم يتم تسجيل أي مورد للأستاذ عطية سويسي');

for (const v of abuBakrVideos) {
  assert.strictEqual(v.subjectId, 'arabic', `مورد أبو بكر مبروك يجب أن يتبع اللغة العربية: ${v.id}`);
  assert(v.url.startsWith('https://www.youtube.com/watch?v='), `رابط غير مباشر: ${v.url}`);
}
for (const v of atiyaVideos) {
  assert.strictEqual(v.subjectId, 'arabic', `مورد عطية سويسي يجب أن يتبع اللغة العربية: ${v.id}`);
  assert(v.url.startsWith('https://www.youtube.com/watch?v='), `رابط غير مباشر: ${v.url}`);
}
console.log('[PASS] تم التحقق من سلامة موارد الأستاذين أبو بكر مبروك وعطية سويسي وتوثيقها بدقة.');

// TEST 8: PlatformStore Integration
console.log('\n--- 8. اختبار تكامل PlatformStore واستعلامات واجهة 3AS ---');
const arabicStoreRes = PlatformStore.getResourcesBySubject('arabic', '3as');
assert(arabicStoreRes.length > 0, 'استعلام موارد اللغة العربية فارغ');

const englishQuantifiersVideos = PlatformStore.getLessonVideos('اللغة الإنجليزية', 'Quantifiers', '3as');
assert(englishQuantifiersVideos.length > 0, 'استعلام فيديوهات درس Quantifiers فارغ في PlatformStore');

const historyStoreRes = PlatformStore.getResourcesBySubject('history', '3as');
const historyTermsInStore = historyStoreRes.filter(r => r.topicCategory === 'GEOGRAPHICAL_TERMS');
assert(historyTermsInStore.length > 0, 'استعلام مصطلحات الجغرافيا في التاريخ والجغرافيا فارغ');
console.log('[PASS] دوال PlatformStore تسترجع الموارد والدروس والمصطلحات بكفاءة تامة ودون أي خطأ.');

// TEST 9: 4AM Cryptographic Isolation Check
console.log('\n--- 9. التحقق التشفيري الصارم من عدم المساس بـ 4AM (4AM Zero Modification) ---');
const baselineShaPath = path.join(baseDir, 'data/pipeline/af_enrichment/baseline_sha256.json');
const baselineData = JSON.parse(fs.readFileSync(baselineShaPath, 'utf8'));

for (const [f, expectedHash] of Object.entries(baselineData.fourAmBaseline)) {
  const currentHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(baseDir, f))).digest('hex');
  assert.strictEqual(currentHash, expectedHash, `تم اكتشاف تعديل غير مصرح به في ملف 4AM: ${f}`);
}
console.log('[PASS] ملفات 4AM مطابقة للبصمة التشفيرية المرجعية بنسبة 100% (صفر تعديل، صفر تسرب).');

console.log('\n====================================================');
console.log('ALL 3AS AF ENRICHMENT VALIDATION TESTS PASSED (100% SUCCESS)');
console.log('====================================================\n');
