const fs = require('fs');
let content = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// 1. Add updateDoc to import
content = content.replace(
  "doc, onSnapshot, setDoc, getDoc",
  "doc, onSnapshot, setDoc, getDoc, updateDoc"
);

// 2. Add migratedV12 flag
content = content.replace(
  "let migratedV11 = rawData.migratedV11 || false;",
  "let migratedV11 = rawData.migratedV11 || false;\n  let migratedV12 = rawData.migratedV12 || false;"
);

// 3. Add v12 migration block before returning columns
const v11EndString = "migratedV11 = true;\n  }";
const v12Block = `
  // v12 - EMERGENCY RESTORE: Forcefully restore FULL orders from Google Sheets again because they were wiped
  if (!migratedV12) {
    Object.values(fullOrdersV11).forEach(newOrder => {
      let existingOrder = Object.values(orders).find(o => o && o.name === newOrder.name && o.church === newOrder.church);
      let targetId = newOrder.id;

      if (existingOrder) {
        targetId = existingOrder.id;
        orders[targetId] = {
          ...existingOrder,
          items: newOrder.items,
          status: newOrder.status,
          totalAmount: newOrder.totalAmount,
          paidAmount: newOrder.paidAmount,
          remainingAmount: newOrder.remainingAmount,
          createdBy: 'system'
        };
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
    migratedV12 = true;
  }`;

content = content.replace(v11EndString, v11EndString + '\n\n' + v12Block);

// 4. Return migratedV12
content = content.replace(
  "migratedV11 };",
  "migratedV11, migratedV12 };"
);

// 5. Update mainSnap.exists() branch
content = content.replace(
  "if (!data.migratedV2 || !data.migratedV3 || !data.migratedV4 || !data.migratedV5 || !data.migratedV6 || !data.migratedV7 || !data.migratedV8 || !data.migratedV9 || !data.migratedV10 || !data.migratedV11 || Object.keys(data.orders || {}).length === 0)",
  "if (!data.migratedV2 || !data.migratedV11 || !data.migratedV12 || Object.keys(data.orders || {}).length === 0)"
);

// 6. Update useEffect saveTimer
const oldEffect = `  // ── SAVE TO FIRESTORE (debounced, only after first load) ─────────────────
  useEffect(() => {
    if (!initialised.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(mainRef, { orders, columns, archivedOrders }, { merge: false }).catch(console.error);
    }, 800);
  }, [orders, columns, archivedOrders]); // eslint-disable-line`;

const newEffect = `  // ── SAVE TO FIRESTORE (debounced, only after first load) ─────────────────
  useEffect(() => {
    if (!initialised.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDoc(mainRef, { orders, columns, archivedOrders }).catch(err => {
        setDoc(mainRef, { orders, columns, archivedOrders }, { merge: true }).catch(console.error);
      });
    }, 800);
  }, [orders, columns, archivedOrders]); // eslint-disable-line`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/context/DataContext.jsx', content);
console.log('Patched correctly!');
