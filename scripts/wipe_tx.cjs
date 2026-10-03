const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// 1. Remove the historical injection block completely
const blockRegex = /const doneTx = localStorage\.getItem\('migrated_historical_tx_3'\);[\s\S]*?localStorage\.setItem\('migrated_historical_tx_3', 'true'\);\s*\}/;
code = code.replace(blockRegex, '');

// 2. Add a wipe migration (V30)
code = code.replace(
   'let migratedV29 = rawData.migratedV29 || false;',
   'let migratedV29 = rawData.migratedV29 || false;\n  let migratedV30 = rawData.migratedV30 || false;'
);

const migrationV30 = `
  // v30 - Wipe all transactions to start fresh as requested by user
  if (!migratedV30) {
     migratedV30 = true;
  }
`;

code = code.replace(
   'migratedV29 = true;\n  }',
   'migratedV29 = true;\n  }\n' + migrationV30
);

code = code.replace(
   'migratedV29, migratedV2,',
   'migratedV29, migratedV30, migratedV2,'
);
code = code.replace(
   'migratedV29, \nmigratedV2,',
   'migratedV29, migratedV30, \nmigratedV2,'
);
code = code.replace(
   'migratedV29, \r\nmigratedV2,',
   'migratedV29, migratedV30, \r\nmigratedV2,'
);

code = code.replace(
   'migratedV29: true }',
   'migratedV29: true, migratedV30: true }'
);


// To wipe transactions, we should do it where ledgerSnap is read
const wipeTxCode = `
          if (ledgerSnap.exists()) {
            let txData = ledgerSnap.data().transactions || [];
            
            // Wipe transactions if not done yet
            const wiped = localStorage.getItem('wiped_tx_v30');
            if (!wiped) {
               txData = [];
               try {
                 setDoc(ledgerRef, { transactions: [] }).catch(console.error);
               } catch(e) {}
               localStorage.setItem('wiped_tx_v30', 'true');
            }
            
            setTransactions(txData);
          }
`;

code = code.replace(
   /if \(ledgerSnap\.exists\(\)\) \{[\s\S]*?setTransactions\(txData\);\s*\}/,
   wipeTxCode
);

fs.writeFileSync('src/context/DataContext.jsx', code);
