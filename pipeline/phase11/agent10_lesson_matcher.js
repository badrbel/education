/**
 * mordix_ai — PHASE 11: Agent 10 (Lesson Matcher & Confidence Scorer)
 * 
 * Maps candidates to the 145 official curriculum lessons.
 * Implements strict confidence scoring:
 * - MATCH_CONFIRMED: Strong evidence (exact or near-exact lesson keywords match)
 * - MATCH_PROBABLE: Strong match with minor missing details
 * - NEEDS_VERIFICATION: Ambiguous match
 * - SUBJECT_LEVEL: lessonId = null (general exams, term tests, subject-wide reviews)
 * Zero Fake Data, 4AM Only, Zero Emojis.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../..');
const verifiedDir = path.join(baseDir, 'data/pipeline/verified');

// Load curriculum baseline
const fourAmPath = path.join(baseDir, 'data/four_am.js');
global.window = {};
eval(fs.readFileSync(fourAmPath, 'utf8'));
const fourAmData = global.window.PlatformData4AM;

function cleanArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '') // Tashkeel
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function calculateLessonMatch(candidateTitle, candidateContext, lessonTitle) {
  const normCand = cleanArabic(`${candidateTitle} ${candidateContext || ''}`);
  const normLesson = cleanArabic(lessonTitle);

  // Exact phrase substring match
  if (normCand.includes(normLesson)) {
    return { status: 'MATCH_CONFIRMED', score: 0.98 };
  }

  // Token overlap
  const lessonTokens = normLesson.split(' ').filter(w => w.length > 2);
  if (lessonTokens.length === 0) return { status: 'NO_MATCH', score: 0 };

  let matchedTokens = 0;
  for (const token of lessonTokens) {
    if (normCand.includes(token)) {
      matchedTokens++;
    }
  }

  const ratio = matchedTokens / lessonTokens.length;

  if (ratio >= 0.8 && lessonTokens.length >= 2) {
    return { status: 'MATCH_CONFIRMED', score: 0.90 };
  } else if (ratio >= 0.6) {
    return { status: 'MATCH_PROBABLE', score: 0.75 };
  } else if (ratio >= 0.4) {
    return { status: 'NEEDS_VERIFICATION', score: 0.50 };
  }

  return { status: 'NO_MATCH', score: ratio };
}

const SUBJECT_KEYWORDS = [
  { id: 'math_4am', name: 'الرياضيات', patterns: [/رياضيات/i, /math/i] },
  { id: 'arabic_4am', name: 'اللغة العربية', patterns: [/لغة عربية/i, /عربية/i, /قواعد/i, /اعراب/i, /إعراب/i] },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', patterns: [/فيزياء/i, /فيزيائية/i] },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', patterns: [/علوم طبيعية/i, /طبيعة وحياة/i, /علوم الطبيعة/i] },
  { id: 'french_4am', name: 'اللغة الفرنسية', patterns: [/فرنسية/i, /francais/i, /français/i] },
  { id: 'english_4am', name: 'اللغة الإنجليزية', patterns: [/إنجليزية/i, /انجليزية/i, /english/i] },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', patterns: [/تاريخ/i, /جغرافيا/i] },
  { id: 'islamic_4am', name: 'التربية الإسلامية', patterns: [/تربية إسلامية/i, /تربية اسلامية/i, /إسلامية/i, /اسلامية/i] },
  { id: 'civics_4am', name: 'التربية المدنية', patterns: [/تربية مدنية/i, /مدنية/i] }
];

function resolveSubject(candidate) {
  if (candidate.subjectId && candidate.subjectName) return candidate;

  const text = `${candidate.queryContext || ''} ${candidate.title || ''}`;
  for (const sk of SUBJECT_KEYWORDS) {
    if (sk.patterns.some(p => p.test(text))) {
      return {
        ...candidate,
        subjectId: sk.id,
        subjectName: sk.name
      };
    }
  }

  // Fallback: search across all lessons of all subjects to find strongest lesson title match
  for (const [sId, sData] of Object.entries(fourAmData)) {
    for (const l of sData.lessons || []) {
      const match = calculateLessonMatch(candidate.title, candidate.queryContext, l.title);
      if (match.status === 'MATCH_CONFIRMED') {
        return {
          ...candidate,
          subjectId: sId,
          subjectName: sData.name || sData.title
        };
      }
    }
  }

  return candidate;
}

function matchCandidate(rawCandidate) {
  const candidate = resolveSubject(rawCandidate);

  // If already designated as general exam / BEM paper / subject revision:
  if (candidate.standardType === 'EXAM' || candidate.standardType === 'TEST' || candidate.standardType === 'BEM_EXAM' || candidate.revisionScope === 'BEM_REVISION' || candidate.revisionScope === 'SUBJECT_REVISION') {
    return {
      ...candidate,
      lessonId: null,
      lessonTitle: null,
      matchStatus: 'SUBJECT_LEVEL',
      matchScore: 1.0,
      resourceScope: 'SUBJECT_LEVEL_RESOURCE'
    };
  }

  // Match against lessons of candidate's subject
  const subjData = fourAmData[candidate.subjectId];
  if (!subjData || !Array.isArray(subjData.lessons)) {
    return {
      ...candidate,
      lessonId: null,
      lessonTitle: null,
      matchStatus: 'SUBJECT_LEVEL',
      matchScore: 0.5,
      resourceScope: 'SUBJECT_LEVEL_RESOURCE'
    };
  }

  let bestMatch = null;
  let highestScore = 0;

  for (const lesson of subjData.lessons) {
    const canonicalId = lesson.canonical_id || lesson.lessonId || lesson.id;
    const res = calculateLessonMatch(candidate.title, candidate.queryContext, lesson.title);

    if (res.score > highestScore && res.status !== 'NO_MATCH') {
      highestScore = res.score;
      bestMatch = {
        lessonId: canonicalId,
        lessonTitle: lesson.title,
        status: res.status,
        score: res.score
      };
    }
  }

  if (bestMatch && (bestMatch.status === 'MATCH_CONFIRMED' || bestMatch.status === 'MATCH_PROBABLE')) {
    return {
      ...candidate,
      lessonId: bestMatch.lessonId,
      lessonTitle: bestMatch.lessonTitle,
      matchStatus: bestMatch.status,
      matchScore: bestMatch.score,
      resourceScope: 'LESSON_RESOURCE'
    };
  }

  // If no high-confidence lesson match, leave lessonId as null without forcing
  return {
    ...candidate,
    lessonId: null,
    lessonTitle: null,
    matchStatus: bestMatch ? bestMatch.status : 'NO_MATCH',
    matchScore: highestScore,
    resourceScope: 'SUBJECT_LEVEL_RESOURCE'
  };
}

function runLessonMatcher() {
  console.log('==================================================');
  console.log('[AGENT 10] 4AM Lesson Matcher Starting...');
  console.log('==================================================');

  const inFile = path.join(verifiedDir, 'phase11_agent9_classified.json');
  if (!fs.existsSync(inFile)) {
    throw new Error('Classified input file not found: ' + inFile);
  }

  const items = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  console.log(`Loaded ${items.length} items to match.`);

  const matchedList = items.map(matchCandidate);

  let confirmed = 0;
  let probable = 0;
  let needsVerif = 0;
  let subjectLevel = 0;

  for (const it of matchedList) {
    if (it.matchStatus === 'MATCH_CONFIRMED') confirmed++;
    else if (it.matchStatus === 'MATCH_PROBABLE') probable++;
    else if (it.matchStatus === 'NEEDS_VERIFICATION') needsVerif++;
    else subjectLevel++;
  }

  console.log('Lesson Matching Results:');
  console.log(`  MATCH_CONFIRMED    : ${confirmed}`);
  console.log(`  MATCH_PROBABLE     : ${probable}`);
  console.log(`  NEEDS_VERIFICATION : ${needsVerif}`);
  console.log(`  SUBJECT_LEVEL      : ${subjectLevel}`);

  const outFile = path.join(verifiedDir, 'phase11_agent10_matched.json');
  fs.writeFileSync(outFile, JSON.stringify(matchedList, null, 2), 'utf8');
  console.log(`Saved matched candidates to: ${outFile}`);

  return matchedList;
}

if (require.main === module) {
  runLessonMatcher();
}

module.exports = { runLessonMatcher };
