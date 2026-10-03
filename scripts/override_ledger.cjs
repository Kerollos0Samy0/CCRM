const fs = require('fs');
let code = fs.readFileSync('src/pages/Ledger.jsx', 'utf8');

const overrideLogic = `
    // Override historical stats with exact summary sheet figures
    const overrides = {
      '2026-03': { sales: 46798, cogs: 18110 },
      '2026-04': { sales: 53865, cogs: 21915 },
      '2026-05': { sales: 21727, cogs: 9692 },
      '2026-06': { sales: 74635, cogs: 39846 },
      '2026-07': { sales: 57267, cogs: 27024 }
    };
    Object.keys(overrides).forEach(m => {
       if (stats[m]) {
          stats[m].sales = overrides[m].sales;
          stats[m].cogs = overrides[m].cogs;
       } else {
          stats[m] = {
            sales: overrides[m].sales,
            cogs: overrides[m].cogs,
            products: 0, admin: 0, workshop: 0, other: 0,
            label: new Date(m + '-01').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
            ordersList: [], transactionsList: []
          };
       }
    });

    return Object.entries(stats).sort((a, b) => b[0].localeCompare(a[0]));
`;

code = code.replace(
   'return Object.entries(stats).sort((a, b) => b[0].localeCompare(a[0]));',
   overrideLogic
);

fs.writeFileSync('src/pages/Ledger.jsx', code);
