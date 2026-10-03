const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const v14Block = `
  // v14 - Import from old Google Sheets CRM
  if (!migratedV14) {
    importedOrders.forEach(newOrder => {
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
  }
`;

code = code.replace(/migratedV11 = true;\r?\n\s*\}/, "migratedV11 = true;\n  }\n" + v14Block);

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

code = code.replace(/if \(cData\.length === 0\) \{\r?\n\s*cData = initialClients;/, clientsBlock + "\n          if (cData.length === 0) {\n              cData = initialClients;");

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

code = code.replace(/if \(pData\.length === 0\) \{\r?\n\s*pData = initialProducts;/, productsBlock + "\n          if (pData.length === 0) {\n              pData = initialProducts;");

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Fixed migration regexes');
