const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/old_crm_data.json', 'utf8'));
const cols = data.table.cols.map(c => c ? c.label : '');
console.log(cols);
