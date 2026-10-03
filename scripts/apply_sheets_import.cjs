const fs = require('fs');

let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const imports = `
import importedClients from '../data/imported_clients.json';
import importedProducts from '../data/imported_products.json';
import importedOrders from '../data/imported_orders.json';
`;

code = code.replace("import fullOrdersV11 from '../data/full_orders_v11.json';", "import fullOrdersV11 from '../data/full_orders_v11.json';" + imports);

// Add migratedV14
code = code.replace(
  "let migratedV12 = rawData.migratedV12 || false;",
  "let migratedV12 = rawData.migratedV12 || false;\n  let migratedV14 = rawData.migratedV14 || false;"
);

const v14Block = `
  // v14 - Import from old Google Sheets CRM
  if (!migratedV14) {
    importedOrders.forEach(newOrder => {
      // Find if we already have this order (by matching client and some fields)
      let existingOrder = Object.values(orders).find(o => o && o.name === newOrder.name && o.totalAmount === newOrder.totalAmount && o.createdAt === newOrder.createdAt);
      let targetId = newOrder.id;

      if (existingOrder) {
        targetId = existingOrder.id;
        orders[targetId] = { ...existingOrder, ...newOrder, id: targetId };
      } else {
        orders[targetId] = newOrder;
      }

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
    migratedV14 = true;
  }`;

code = code.replace("migratedV12 = true;\n  }", "migratedV12 = true;\n  }\n" + v14Block);

code = code.replace(
  "migratedV11, migratedV12 };",
  "migratedV11, migratedV12, migratedV14 };"
);

code = code.replace(
  "if (!data.migratedV2 || !data.migratedV11 || !data.migratedV12 || Object.keys(data.orders || {}).length === 0)",
  "if (!data.migratedV2 || !data.migratedV11 || !data.migratedV12 || !data.migratedV14 || Object.keys(data.orders || {}).length === 0)"
);

const clientsBlock = `
          // Merge imported clients
          let changedC = false;
          importedClients.forEach(ic => {
              if (!cData.find(c => c.name === ic.name)) {
                  cData.push(ic);
                  changedC = true;
              }
          });
          if (changedC) {
              setDoc(clientsRef, { clients: cData, chatMergedV1: true }).catch(console.error);
              console.warn('Imported CLIENTS from Google Sheets');
          }
`;
code = code.replace(
  "// EMERGENCY V13: Restore from JSON backup if still empty",
  clientsBlock + "\n          // EMERGENCY V13: Restore from JSON backup if still empty"
);

const productsBlock = `
          // Merge imported products
          let changedP = false;
          importedProducts.forEach(ip => {
              let existing = pData.find(p => p.name === ip.name);
              if (!existing) {
                  pData.push(ip);
                  changedP = true;
              } else if (existing.sellPrice === 0 && ip.sellPrice > 0) {
                  existing.sellPrice = ip.sellPrice;
                  changedP = true;
              }
          });
          if (changedP) {
              setDoc(productsRef, { products: pData }).catch(console.error);
              console.warn('Imported PRODUCTS from Google Sheets');
          }
`;
code = code.replace(
  "// EMERGENCY V13: Restore from JSON backup if still empty\n          if (pData.length === 0) {",
  productsBlock + "\n          // EMERGENCY V13: Restore from JSON backup if still empty\n          if (pData.length === 0) {"
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Patched DataContext to import old Google Sheets data!');
