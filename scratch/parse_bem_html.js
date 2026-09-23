const fs = require('fs');

const html = fs.readFileSync('scratch/bem_math_raw.html', 'utf8');

// Find all occurrences of years from 2007 to 2026
for (let y = 2026; y >= 2007; y--) {
  const str = String(y);
  const idx = html.indexOf(str);
  if (idx !== -1) {
    // Extract snippet around it
    const snippet = html.substring(Math.max(0, idx - 250), Math.min(html.length, idx + 400));
    console.log(`\n================ YEAR ${y} ================`);
    console.log(snippet.replace(/\s+/g, ' ').trim());
  } else {
    console.log(`\n================ YEAR ${y} NOT FOUND ================`);
  }
}
