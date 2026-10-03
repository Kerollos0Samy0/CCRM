const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

if (!code.includes('import missingDataMap')) {
    code = code.replace(
        "import importedOrders from '../data/imported_orders.json';",
        "import importedOrders from '../data/imported_orders.json';\nimport missingDataMap from '../data/missing_data_map.json';"
    );
}

const v18Block = '      migratedV18 = true;\r\n    }';
const v18BlockFallback = '      migratedV18 = true;\n    }';

const v19Logic = `
    // v19 - Enrich missing data
    if (!rawData.migratedV19) {
      const enrichOrder = (o) => {
        if (!o.governorate && o.gov) o.governorate = o.gov;
        if (!o.church && o.region) o.church = o.region;
        const enrich = missingDataMap[o.name];
        if (enrich) {
           if (!o.mobile && enrich.mobile) o.mobile = String(enrich.mobile);
           if (!o.church && enrich.church) o.church = enrich.church;
           if (!o.governorate && enrich.governorate) o.governorate = enrich.governorate;
        }
      };
      
      Object.values(orders).forEach(o => { if (o) enrichOrder(o); });
      archivedOrders.forEach(o => { if (o) enrichOrder(o); });
      
      migratedV19 = true;
    }
`;

if (!code.includes('migratedV19')) {
    if (code.includes(v18Block)) {
        code = code.replace(v18Block, v18Block + '\n' + v19Logic);
    } else {
        code = code.replace(v18BlockFallback, v18BlockFallback + '\n' + v19Logic);
    }
}

code = code.replace('migratedV17, migratedV18, migratedV2', 'migratedV17, migratedV18, migratedV19, migratedV2');
code = code.replace('migratedV18: true }', 'migratedV18: true, migratedV19: true }');
code = code.replace('let migratedV18 = rawData.migratedV18 || false;', 'let migratedV18 = rawData.migratedV18 || false;\n  let migratedV19 = rawData.migratedV19 || false;');

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Done!');
