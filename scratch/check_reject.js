const data = JSON.parse(require('fs').readFileSync('scratch/audit_classified.json', 'utf8'));
console.log('REJECT_RECOMMENDED count:', data.REJECT_RECOMMENDED.length);
console.log(JSON.stringify(data.REJECT_RECOMMENDED, null, 2));
