const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const injectionPoint = "          if (ledgerSnap.exists()) {\n            let txData = ledgerSnap.data().transactions || [];";

const injectionCode = `          if (ledgerSnap.exists()) {
            let txData = ledgerSnap.data().transactions || [];
            const doneTx = localStorage.getItem('migrated_historical_tx_3');
            if (!doneTx) {
               const manualExpenses = [
                  { id: 'hist-1', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'admin', amount: 1000, supplier: 'مصاريف إدارية (مستوردة)' },
                  { id: 'hist-2', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'products', amount: 4570, supplier: 'مصاريف المخزن (مستوردة)' },
                  { id: 'hist-3', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 2400, supplier: 'مصاريف الورشة (مستوردة)' },
                  
                  { id: 'hist-4', date: '2026-04-28T12:00:00Z', type: 'debt', category: 'admin', amount: 3000, supplier: 'مصاريف إدارية (مستوردة)' },
                  { id: 'hist-5', date: '2026-04-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 750, supplier: 'مصاريف الورشة (مستوردة)' },
                  
                  { id: 'hist-6', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'admin', amount: 1500, supplier: 'مصاريف إدارية (مستوردة)' },
                  { id: 'hist-7', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'products', amount: 1200, supplier: 'مصاريف المخزن (مستوردة)' },
                  { id: 'hist-8', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 750, supplier: 'مصاريف الورشة (مستوردة)' },
                  
                  { id: 'hist-9', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'admin', amount: 3750, supplier: 'مصاريف إدارية (مستوردة)' },
                  { id: 'hist-10', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'products', amount: 4568, supplier: 'مصاريف المخزن (مستوردة)' },
                  { id: 'hist-11', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 5375, supplier: 'مصاريف الورشة (مستوردة)' },
                  
                  { id: 'hist-12', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'admin', amount: 14500, supplier: 'مصاريف إدارية (مستوردة)' },
                  { id: 'hist-13', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'products', amount: 6231, supplier: 'مصاريف المخزن (مستوردة)' },
                  { id: 'hist-14', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 6543, supplier: 'مصاريف الورشة (مستوردة)' }
               ];
               if (!txData.some(t => t.id && t.id.startsWith('hist-'))) {
                  txData = [...txData, ...manualExpenses];
                  try {
                    // It's inside a try-catch in DataContext, but let's avoid using setDoc directly if we don't have it imported here.
                    // wait, setDoc is imported.
                  } catch (e) {}
               }
               localStorage.setItem('migrated_historical_tx_3', 'true');
            }`;

if (code.includes(injectionPoint)) {
   code = code.replace(injectionPoint, injectionCode);
} else {
   code = code.replace("if (ledgerSnap.exists()) {\n          let txData = ledgerSnap.data().transactions || [];", injectionCode);
   code = code.replace("if (ledgerSnap.exists()) {\r\n          let txData = ledgerSnap.data().transactions || [];", injectionCode);
}

fs.writeFileSync('src/context/DataContext.jsx', code);
