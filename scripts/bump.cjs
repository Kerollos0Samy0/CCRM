const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

code = code.replace(/migratedV14/g, 'migratedV15');

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Bumped to migratedV15');
