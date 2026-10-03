const fs = require('fs');

let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const v17Block = `
  // v17 - Load exactly the active orders and archived orders from fullOrdersV11
  if (!migratedV17) {
    if (fullOrdersV11 && fullOrdersV11.active) {
      // Clear orders and columns entirely to match exact Vercel state
      orders = {};
      Object.keys(columns).forEach(colId => {
        columns[colId].orderIds = [];
      });

      // Load active orders
      Object.values(fullOrdersV11.active).forEach(newOrder => {
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

      // Load archived orders
      if (fullOrdersV11.archived) {
          archivedOrders = fullOrdersV11.archived.map(o => normalizeOrder(o));
      }
    }
    migratedV17 = true;
  }
`;

code = code.replace('// return', v17Block + '\n  // return'); // Just before the return statement

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('v17 added');
