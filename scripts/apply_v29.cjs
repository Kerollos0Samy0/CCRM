const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

code = code.replace(
   'let migratedV28 = rawData.migratedV28 || false;',
   'let migratedV28 = rawData.migratedV28 || false;\n    let migratedV29 = rawData.migratedV29 || false;'
);

const migrationV29 = `
    // v29 - Force override of archive and cleanup of active (since V28 was skipped due to saveTimer)
    if (!migratedV29) {
      if (sheetsOrders && sheetsOrders.archived && sheetsOrders.archived.length > 0) {
        archivedOrders = [...sheetsOrders.archived];
        
        const augustCutoff = new Date('2026-08-01T00:00:00Z').getTime();
        const cleanedOrders = {};
        Object.entries(orders).forEach(([id, o]) => {
           const d = o.createdAt || o.archivedAt || o.date;
           let t = new Date(d).getTime();
           
           if (t >= augustCutoff) {
              cleanedOrders[id] = o;
           } else {
              Object.keys(columns).forEach(colId => {
                if (columns[colId].orderIds) {
                   columns[colId].orderIds = columns[colId].orderIds.filter(oid => oid !== id);
                }
              });
           }
        });
        orders = cleanedOrders;
      }
      migratedV29 = true;
    }
`;

code = code.replace(
   'migratedV28 = true;\n    }',
   'migratedV28 = true;\n    }\n' + migrationV29
);

code = code.replace(
   'migratedV28, migratedV2,',
   'migratedV28, migratedV29, migratedV2,'
);

code = code.replace(
   'migratedV28, \nmigratedV2,',
   'migratedV28, migratedV29, \nmigratedV2,'
);
code = code.replace(
   'migratedV28, \r\nmigratedV2,',
   'migratedV28, migratedV29, \r\nmigratedV2,'
);


code = code.replace(
   'migratedV28: true }',
   'migratedV28: true, migratedV29: true }'
);

code = code.replace(
   '}, [transactions.length]); // trigger when transactions load',
   '}, [transactions.length, initialised.current]); // trigger when transactions load'
);

code = code.replace(
   "'migrated_historical_tx'",
   "'migrated_historical_tx_2'"
);
code = code.replace(
   "'migrated_historical_tx'",
   "'migrated_historical_tx_2'"
);

fs.writeFileSync('src/context/DataContext.jsx', code);
