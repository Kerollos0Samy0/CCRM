const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// Remove all existing safeguards at the bottom
code = code.replace(/Object\.values\(columns\)\.forEach\(c => \{ if \(!c \|\| !c\.orderIds \|\| !Array\.isArray\(c\.orderIds\)\) c\.orderIds = \[\]; \}\);\s*/g, '');

// Inject it at the very top of applyMigrations
const search = 'let columns = rawData.columns || { ...initialColumns };';
const replace = search + '\n  // SAFEGUARD: Ensure all columns have an orderIds array\n  Object.values(columns).forEach(c => { if (!c || !c.orderIds || !Array.isArray(c.orderIds)) c.orderIds = []; });';

code = code.replace(search, replace);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Safeguard moved to top!');
