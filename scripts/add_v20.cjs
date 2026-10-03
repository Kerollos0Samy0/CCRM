const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

if (!code.includes('import fixedOrdersV20')) {
    code = code.replace(
        "import missingDataMap from '../data/missing_data_map.json';",
        "import missingDataMap from '../data/missing_data_map.json';\nimport fixedOrdersV20 from '../data/fixed_orders_v20.json';"
    );
}

const v19Block = '      migratedV19 = true;\n    }';

const v20Logic = `
  // v20 - Restore original dates and group by 7 days
  if (!rawData.migratedV20) {
    if (fixedOrdersV20 && fixedOrdersV20.active) {
      orders = {};
      Object.keys(columns).forEach(colId => { columns[colId].orderIds = []; });
      Object.values(fixedOrdersV20.active).forEach(newOrder => {
        const orderId = newOrder.id; 
        orders[orderId] = normalizeOrder(newOrder); 
        const targetStatus = newOrder.status || 'pending'; 
        if (columns[targetStatus]) { 
           if (!columns[targetStatus].orderIds) columns[targetStatus].orderIds = []; 
           if (!columns[targetStatus].orderIds.includes(orderId)) { 
               columns[targetStatus].orderIds.unshift(orderId); 
           } 
        } 
      });
      if (fixedOrdersV20.archived) {
          archivedOrders = fixedOrdersV20.archived.map(o => normalizeOrder(o));
      }
    }
    migratedV20 = true;
  }
`;

if (!code.includes('migratedV20')) {
    code = code.replace(v19Block, v19Block + '\n' + v20Logic);
    
    code = code.replace('migratedV18, migratedV19, migratedV2', 'migratedV18, migratedV19, migratedV20, migratedV2');
    code = code.replace('migratedV19: true }', 'migratedV19: true, migratedV20: true }');
    code = code.replace('let migratedV19 = rawData.migratedV19 || false;', 'let migratedV19 = rawData.migratedV19 || false;\n  let migratedV20 = rawData.migratedV20 || false;');
    
    fs.writeFileSync('src/context/DataContext.jsx', code);
    console.log('Injected migratedV20 logic');
} else {
    console.log('migratedV20 already exists');
}
