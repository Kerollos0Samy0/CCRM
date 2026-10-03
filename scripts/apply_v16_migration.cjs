const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const v16Block = `
  // v16 - Import latest live data from Google Sheets
  if (!rawData.migratedV16) {
    Object.values(fullOrdersV11).forEach(newOrder => {
      // Find existing order by name and church
      let existingOrder = Object.values(orders).find(o => o && o.name === newOrder.name && o.church === newOrder.church);
      let targetId = newOrder.id;

      if (existingOrder) {
        targetId = existingOrder.id;
        // Merge data, but force Google Sheet items and status
        orders[targetId] = {
          ...existingOrder,
          items: newOrder.items,
          status: newOrder.status,
          totalAmount: newOrder.totalAmount,
          paidAmount: newOrder.paidAmount,
          remainingAmount: newOrder.remainingAmount,
          createdBy: 'system' // mark as imported
        };
      } else {
        orders[targetId] = newOrder;
      }

      // Force into correct column
      const targetStatus = newOrder.status || 'pending';
      let currentCol = Object.values(columns).find(c => c && c.orderIds && Array.isArray(c.orderIds) && c.orderIds.includes(targetId));
      
      if (currentCol && currentCol.id !== targetStatus) {
         currentCol.orderIds = currentCol.orderIds.filter(id => id !== targetId);
      }
      
      if (columns[targetStatus]) {
         if (!columns[targetStatus].orderIds) columns[targetStatus].orderIds = [];
         if (!columns[targetStatus].orderIds.includes(targetId)) {
             columns[targetStatus].orderIds.unshift(targetId);
         }
      }
    });
    // Setting migratedV16 true is done outside this function (or returned)
  }
`;

// Insert the migratedV16 initialization
code = code.replace(
  "let migratedV15 = rawData.migratedV15 || false;",
  "let migratedV15 = rawData.migratedV15 || false;\n  let migratedV16 = rawData.migratedV16 || false;"
);

// Insert the v16 block right before the sync columns code
code = code.replace(
  "// always sync column titles/colors from code",
  v16Block + "\n\n  // always sync column titles/colors from code"
);

// Add migratedV16 to the returned object
code = code.replace(
  "migratedV11, migratedV12, migratedV15 };",
  "migratedV11, migratedV12, migratedV15, migratedV16 };"
);

// Update the Firebase condition to also check migratedV16
code = code.replace(
  "if (!data.migratedV2 || !data.migratedV11 || !data.migratedV12 || !data.migratedV15 || Object.keys(data.orders || {}).length === 0)",
  "if (!data.migratedV2 || !data.migratedV11 || !data.migratedV12 || !data.migratedV15 || !data.migratedV16 || Object.keys(data.orders || {}).length === 0)"
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Applied v16 migration to DataContext.jsx');
