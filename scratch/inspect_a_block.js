const fs = require('fs');
const html = fs.readFileSync('scratch/bem_math_raw.html', 'utf8');

const idx = html.indexOf('2024');
// find the nearest '<a' before idx
const aStart = html.lastIndexOf('<a', idx);
const aEnd = html.indexOf('</a>', idx);

console.log('--- Full <a> block for 2024: ---');
console.log(html.substring(aStart, aEnd + 4));
