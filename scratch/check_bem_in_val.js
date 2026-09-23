const fs = require('fs');
const path = require('path');

const valDir = 'pipeline/validators';
const files = fs.readdirSync(valDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const content = fs.readFileSync(path.join(valDir, file), 'utf8');
  if (content.includes("'bem'") || content.includes('"bem"') || content.includes('4am-bem')) {
    console.log(file, 'references bem');
  }
}
