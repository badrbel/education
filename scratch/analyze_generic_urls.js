const fs = require('fs');

const allUrls = JSON.parse(fs.readFileSync('scratch/all_external_urls.json', 'utf8'));

// Categorize URLs
const categorized = {
  direct_sujet: [],       // /sujets/...
  direct_document: [],    // /documents/...
  bem_subject_portal: [], // /bem/<subject>
  bac_subject_portal: [], // /bac/<subject>
  specific_category: [],  // /<level>/<subject>/<type> (e.g. /4am/mathematiques/cours or /d1, /d2, etc.)
  general_subject: [],    // /<level>/<subject> (e.g. /4am/mathematiques)
  homepage_or_root: [],   // / or /4am or /3as
  other: []
};

for (const item of allUrls) {
  const u = item.url;
  if (u.includes('/sujets/')) {
    categorized.direct_sujet.push(item);
  } else if (u.includes('/documents/')) {
    categorized.direct_document.push(item);
  } else if (u.includes('/bem/')) {
    categorized.bem_subject_portal.push(item);
  } else if (u.includes('/bac/')) {
    categorized.bac_subject_portal.push(item);
  } else if (u.match(/\/ar\/(4am|3as|1as|2as)\/[^/]+\/[^/]+/)) {
    categorized.specific_category.push(item);
  } else if (u.match(/\/ar\/(4am|3as|1as|2as)\/[^/]+$/)) {
    categorized.general_subject.push(item);
  } else if (u === 'https://www.dzexams.com' || u === 'https://www.dzexams.com/' || u.match(/\/ar\/(4am|3as)$/)) {
    categorized.homepage_or_root.push(item);
  } else {
    categorized.other.push(item);
  }
}

console.log('--- Summary of URL Categories:');
console.log(`  direct_sujet (/sujets/...): ${categorized.direct_sujet.length}`);
console.log(`  direct_document (/documents/...): ${categorized.direct_document.length}`);
console.log(`  bem_subject_portal (/bem/...): ${categorized.bem_subject_portal.length}`);
console.log(`  bac_subject_portal (/bac/...): ${categorized.bac_subject_portal.length}`);
console.log(`  specific_category (/<level>/<subject>/<type>): ${categorized.specific_category.length}`);
console.log(`  general_subject (/<level>/<subject>): ${categorized.general_subject.length}`);
console.log(`  homepage_or_root: ${categorized.homepage_or_root.length}`);
console.log(`  other: ${categorized.other.length}`);

console.log('\n--- Details of homepage_or_root:');
console.log(categorized.homepage_or_root);

console.log('\n--- Details of general_subject:');
console.log(categorized.general_subject);

if (categorized.other.length > 0) {
  console.log('\n--- Details of other:');
  console.log(categorized.other);
}
