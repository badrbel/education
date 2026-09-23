const https = require('https');
const fs = require('fs');

const subjects = [
  { id: 'math_4am', name: 'الرياضيات', url: 'https://www.dzexams.com/ar/bem/mathematiques' },
  { id: 'arabic_4am', name: 'اللغة العربية', url: 'https://www.dzexams.com/ar/bem/arabe' },
  { id: 'physics_4am', name: 'العلوم الفيزيائية والتكنولوجيا', url: 'https://www.dzexams.com/ar/bem/physique' },
  { id: 'science_4am', name: 'علوم الطبيعة والحياة', url: 'https://www.dzexams.com/ar/bem/sciences-naturelles' },
  { id: 'french_4am', name: 'اللغة الفرنسية', url: 'https://www.dzexams.com/ar/bem/francais' },
  { id: 'english_4am', name: 'اللغة الإنجليزية', url: 'https://www.dzexams.com/ar/bem/anglais' },
  { id: 'history_geography_4am', name: 'التاريخ والجغرافيا', url: 'https://www.dzexams.com/ar/bem/histoire-geographie' },
  { id: 'islamic_4am', name: 'التربية الإسلامية', url: 'https://www.dzexams.com/ar/bem/tarbia-islamia' },
  { id: 'civics_4am', name: 'التربية المدنية', url: 'https://www.dzexams.com/ar/bem/tarbia-madania' }
];

const targetYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('Auditing DzExams BEM years 2010-2025 across all 9 subjects...\n');
  const results = {};

  for (const subj of subjects) {
    try {
      const html = await fetchPage(subj.url);
      const foundYears = [];
      const missingYears = [];

      for (const y of targetYears) {
        if (html.includes(String(y))) {
          foundYears.push(y);
        } else {
          missingYears.push(y);
        }
      }

      results[subj.id] = {
        name: subj.name,
        url: subj.url,
        foundYears,
        missingYears,
        allFound: missingYears.length === 0
      };

      console.log(`[${subj.name}]: Found ${foundYears.length}/${targetYears.length} years. Missing: ${missingYears.join(',') || 'NONE'}`);
    } catch (err) {
      console.error(`Error fetching ${subj.name}:`, err.message);
    }
  }

  fs.writeFileSync('scratch/dzexams_bem_audit_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\nResults saved to scratch/dzexams_bem_audit_results.json');
}

runAudit();
