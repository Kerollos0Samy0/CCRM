const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// Strip out ALL previous merges
code = code.replace(/\/\/ Merge imported clients[\s\S]*?if \(changedC\) \{[\s\S]*?console.warn\('Imported CLIENTS from Google Sheets'\);\s*\}\s*/g, '');
code = code.replace(/\/\/ Merge imported products[\s\S]*?if \(changedP\) \{[\s\S]*?console.warn\('Imported PRODUCTS from Google Sheets'\);\s*\}\s*/g, '');

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Cleaned duplicates');
