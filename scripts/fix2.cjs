const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

if (!code.includes('import missingDataMap')) {
    code = code.replace(
        "import importedOrders from '../data/imported_orders.json';",
        "import importedOrders from '../data/imported_orders.json';\nimport missingDataMap from '../data/missing_data_map.json';"
    );
}

code = code.replace('let migratedV18 = rawData.migratedV18 || false;', 'let migratedV18 = rawData.migratedV18 || false;\n  let migratedV19 = rawData.migratedV19 || false;');
code = code.replace('migratedV18: true }', 'migratedV18: true, migratedV19: true }');

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Done!');
