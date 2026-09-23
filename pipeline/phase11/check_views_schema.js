const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '../../data/pipeline/cache/youtube');
const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

console.log('Total cache files:', files.length);

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
    if (Array.isArray(data) && data.length > 0) {
      console.log('File:', f);
      console.log('Keys of first item:', Object.keys(data[0]));
      console.log('First item full:', JSON.stringify(data[0], null, 2));
      break;
    }
  } catch (e) {}
}
