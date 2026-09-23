const fs = require('fs');
const path = require('path');

const baseDir = path.resolve('c:/Users/mad/Desktop/موقع تعلمي');
const html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf-8');

const replacement3AS = `        <!-- Subjects Grid 3AS (7 Modern Horizontal Cards with 3D Emblems) -->
        <div id="dashboard-subjects-3as" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6 pt-5">

          <!-- 1. الفلسفة -->
          <div onclick="openSubjectDetail('الفلسفة')" data-subject="الفلسفة" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Philosophy.png" alt="الفلسفة" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">الفلسفة</h3>
                <p class="mordix-subject-meta" data-subject-meta="الفلسفة">
                  معامل 6 • 13 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 2. العلوم الإسلامية -->
          <div onclick="openSubjectDetail('العلوم الإسلامية')" data-subject="العلوم الإسلامية" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Islamic_Sciences.png" alt="العلوم الإسلامية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">العلوم الإسلامية</h3>
                <p class="mordix-subject-meta" data-subject-meta="العلوم الإسلامية">
                  معامل 2 • 15 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 3. التاريخ والجغرافيا -->
          <div onclick="openSubjectDetail('التاريخ والجغرافيا')" data-subject="التاريخ والجغرافيا" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/History_Geography.png" alt="التاريخ والجغرافيا" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">التاريخ والجغرافيا</h3>
                <p class="mordix-subject-meta" data-subject-meta="التاريخ والجغرافيا">
                  معامل 4 • 19 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 4. اللغة الإنجليزية -->
          <div onclick="openSubjectDetail('اللغة الإنجليزية')" data-subject="اللغة الإنجليزية" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/English.png" alt="اللغة الإنجليزية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة الإنجليزية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة الإنجليزية">
                  معامل 3 • 27 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 5. اللغة الفرنسية -->
          <div onclick="openSubjectDetail('اللغة الفرنسية')" data-subject="اللغة الفرنسية" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/French.png" alt="اللغة الفرنسية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة الفرنسية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة الفرنسية">
                  معامل 3 • 17 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 6. اللغة العربية -->
          <div onclick="openSubjectDetail('اللغة العربية')" data-subject="اللغة العربية" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Arabic.png" alt="اللغة العربية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة العربية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة العربية">
                  معامل 6 • 42 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 7. الرياضيات -->
          <div onclick="openSubjectDetail('الرياضيات')" data-subject="الرياضيات" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Mathematics.png" alt="الرياضيات" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">الرياضيات</h3>
                <p class="mordix-subject-meta" data-subject-meta="الرياضيات">
                  معامل 2 • 4 دروس
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

        </div>
        <!-- /#dashboard-subjects-3as -->`;

const replacement4AM = `        <!-- Subjects Grid 4AM (9 Modern Horizontal Cards with 3D Emblems) -->
        <div id="dashboard-subjects-4am" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6 pt-5">

          <!-- 1. الرياضيات 4AM -->
          <div onclick="openSubjectDetail('math_4am')" data-subject="الرياضيات" data-subject-id="math_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Mathematics.png" alt="الرياضيات" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">الرياضيات</h3>
                <p class="mordix-subject-meta" data-subject-meta="الرياضيات">
                  معامل 4 • 14 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 2. اللغة العربية 4AM -->
          <div onclick="openSubjectDetail('arabic_4am')" data-subject="اللغة العربية" data-subject-id="arabic_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Arabic.png" alt="اللغة العربية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة العربية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة العربية">
                  معامل 5 • 28 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 3. العلوم الفيزيائية والتكنولوجيا 4AM -->
          <div onclick="openSubjectDetail('physics_4am')" data-subject="العلوم الفيزيائية والتكنولوجيا" data-subject-id="physics_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Physics.png" alt="العلوم الفيزيائية والتكنولوجيا" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">العلوم الفيزيائية والتكنولوجيا</h3>
                <p class="mordix-subject-meta" data-subject-meta="العلوم الفيزيائية والتكنولوجيا">
                  معامل 2 • 16 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 4. علوم الطبيعة والحياة 4AM -->
          <div onclick="openSubjectDetail('science_4am')" data-subject="علوم الطبيعة والحياة" data-subject-id="science_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Natural_Sciences.png" alt="علوم الطبيعة والحياة" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">علوم الطبيعة والحياة</h3>
                <p class="mordix-subject-meta" data-subject-meta="علوم الطبيعة والحياة">
                  معامل 2 • 13 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 5. اللغة الفرنسية 4AM -->
          <div onclick="openSubjectDetail('french_4am')" data-subject="اللغة الفرنسية" data-subject-id="french_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/French.png" alt="اللغة الفرنسية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة الفرنسية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة الفرنسية">
                  معامل 3 • 9 دروس
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 6. اللغة الإنجليزية 4AM -->
          <div onclick="openSubjectDetail('english_4am')" data-subject="اللغة الإنجليزية" data-subject-id="english_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/English.png" alt="اللغة الإنجليزية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">اللغة الإنجليزية</h3>
                <p class="mordix-subject-meta" data-subject-meta="اللغة الإنجليزية">
                  معامل 2 • 23 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 7. التاريخ والجغرافيا 4AM -->
          <div onclick="openSubjectDetail('history_geography_4am')" data-subject="التاريخ والجغرافيا" data-subject-id="history_geography_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/History_Geography.png" alt="التاريخ والجغرافيا" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">التاريخ والجغرافيا</h3>
                <p class="mordix-subject-meta" data-subject-meta="التاريخ والجغرافيا">
                  معامل 3 • 17 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 8. التربية الإسلامية 4AM -->
          <div onclick="openSubjectDetail('islamic_4am')" data-subject="التربية الإسلامية" data-subject-id="islamic_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Islamic_Education.png" alt="التربية الإسلامية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">التربية الإسلامية</h3>
                <p class="mordix-subject-meta" data-subject-meta="التربية الإسلامية">
                  معامل 2 • 15 درساً
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

          <!-- 9. التربية المدنية 4AM -->
          <div onclick="openSubjectDetail('civics_4am')" data-subject="التربية المدنية" data-subject-id="civics_4am" role="button" tabindex="0" class="mordix-subject-card subject-card group">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="mordix-subject-emblem-wrap">
                <img src="assets/subjects/Civic_Education.png" alt="التربية المدنية" class="mordix-subject-emblem" loading="lazy" width="96" height="96">
              </div>
              <div class="mordix-subject-info">
                <h3 class="mordix-subject-title font-heading">التربية المدنية</h3>
                <p class="mordix-subject-meta" data-subject-meta="التربية المدنية">
                  معامل 1 • 10 دروس
                </p>
              </div>
            </div>
            <div class="mordix-subject-action">
              <span class="mordix-subject-btn">
                <span>دخول المادة</span>
                <svg class="w-4 h-4 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </span>
            </div>
          </div>

        </div>
        <!-- /#dashboard-subjects-4am -->`;

const marker3asStart = '<!-- Subjects Grid 3AS (7 Simplified Cards: Icon -> Name -> Coeff & Lessons -> Button) -->';
const marker3asEnd = '<!-- /#dashboard-subjects-3as -->';
const idx3asStart = html.indexOf(marker3asStart);
const idx3asEnd = html.indexOf(marker3asEnd) + marker3asEnd.length;

if (idx3asStart === -1 || idx3asEnd === -1) {
  console.error('Cannot find 3AS markers!');
  process.exit(1);
}

const marker4amStart = '<!-- Subjects Grid 4AM (9 Core Subjects: Icon -> Name -> Coeff & Lessons -> Button) -->';
const marker4amEnd = '<!-- /#dashboard-subjects-4am -->';
const idx4amStart = html.indexOf(marker4amStart);
const idx4amEnd = html.indexOf(marker4amEnd) + marker4amEnd.length;

if (idx4amStart === -1 || idx4amEnd === -1) {
  console.error('Cannot find 4AM markers!');
  process.exit(1);
}

let newHtml = html.slice(0, idx3asStart) + replacement3AS + html.slice(idx3asEnd);
// recalc 4am markers in newHtml
const newIdx4amStart = newHtml.indexOf(marker4amStart);
const newIdx4amEnd = newHtml.indexOf(marker4amEnd) + marker4amEnd.length;
newHtml = newHtml.slice(0, newIdx4amStart) + replacement4AM + newHtml.slice(newIdx4amEnd);

// Test 1: 3AS validation
console.log('Testing 3AS rules...');
const gridStart = newHtml.indexOf('id="screen-dashboard"');
const gridEnd = newHtml.indexOf('id="screen-subject-detail"');
const dashboardSection = newHtml.slice(gridStart, gridEnd);
const subjects = ['الفلسفة', 'العلوم الإسلامية', 'التاريخ والجغرافيا', 'اللغة الإنجليزية', 'اللغة الفرنسية', 'اللغة العربية', 'الرياضيات'];

let all3asPass = true;
subjects.forEach(subName => {
  const cardRegex = new RegExp(`data-subject="${subName}"[\\s\\S]*?دخول المادة[\\s\\S]*?<\\/svg>\\s*<\\/span>\\s*<\\/div>\\s*<\\/div>`, 'u');
  const match = dashboardSection.match(cardRegex);
  if (!match) {
    console.error('Failed regex match for:', subName);
    all3asPass = false;
    return;
  }
  const cardHtml = match[0];
  if (!cardHtml.includes('<svg')) { console.error('Missing svg for:', subName); all3asPass = false; }
  if (!cardHtml.includes(subName)) { console.error('Missing name for:', subName); all3asPass = false; }
  if (!cardHtml.includes(`data-subject-meta="${subName}"`)) { console.error('Missing meta for:', subName); all3asPass = false; }
  if (!cardHtml.includes('دخول المادة')) { console.error('Missing enter button for:', subName); all3asPass = false; }
  const forbidden = ['فيديو', 'فيديوهات', 'تمرين', 'تمارين', 'تمريناً', 'مراجعة', 'مراجعات', 'ملخص', 'ملخصات', 'ملخصاً', 'بكالوريا'];
  forbidden.forEach(w => {
    if (cardHtml.includes(w)) { console.error('Contains forbidden word:', w, 'in', subName); all3asPass = false; }
  });
});
console.log('3AS validation passed?', all3asPass);

// Test 2: 4AM validation
console.log('Testing 4AM rules...');
const expected4amSubjects = [
  { id: 'math_4am', name: 'الرياضيات', coef: 4 },
  { id: 'arabic_4am', name: 'اللغة العربية', coef: 5 },
  { id: 'french_4am', name: 'اللغة الفرنسية', coef: 3 },
  { id: 'english_4am', name: 'اللغة الإنجليزية', coef: 2 },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', coef: 2 },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', coef: 2 },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', coef: 3 },
  { id: 'islamic_4am', name: 'التربية الإسلامية', coef: 2 },
  { id: 'civics_4am', name: 'التربية المدنية', coef: 1 }
];

let all4amPass = true;
expected4amSubjects.forEach(exp => {
  if (!newHtml.includes(`data-subject-id="${exp.id}"`)) { console.error('Missing data-subject-id for:', exp.id); all4amPass = false; }
  if (!newHtml.includes(`openSubjectDetail('${exp.id}')`)) { console.error('Missing openSubjectDetail for:', exp.id); all4amPass = false; }
  if (!newHtml.includes(`معامل ${exp.coef}`)) { console.error('Missing coef for:', exp.id); all4amPass = false; }
});
console.log('4AM validation passed?', all4amPass);

// Test 3: Zero Emoji
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
console.log('Zero emoji in 3AS replacement?', !emojiRegex.test(replacement3AS));
console.log('Zero emoji in 4AM replacement?', !emojiRegex.test(replacement4AM));
