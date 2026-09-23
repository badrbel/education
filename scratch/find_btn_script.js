const fs = require('fs');
const html = fs.readFileSync('scratch/bem_math_raw.html', 'utf8');

const regex = /<script[\s\S]*?<\/script>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  if (match[0].includes('btn-item-annale') || match[0].includes('data-id')) {
    console.log('--- Matching script: ---');
    console.log(match[0].slice(0, 1000));
  }
}
