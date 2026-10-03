const fs = require('fs');
let code = fs.readFileSync('src/pages/Ledger.jsx', 'utf8');

// 1. Remove the Workshop Expenses Card (blue one)
const cardMatch = code.match(/<div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>[\s\S]*?<\/div>\s*<\/div>/);
if (cardMatch) {
    code = code.replace(cardMatch[0], '');
}

// 2. Remove data.workshop from profit calculation
code = code.replace(
   'const netProfit = data.sales - (data.cogs + data.admin + data.workshop + data.other);',
   'const netProfit = data.sales - (data.cogs + data.admin + data.other);'
);

// 3. Remove 'workshop' option from Add Transaction Dropdown
code = code.replace(
   /<option value="workshop">مصاريف ورشة.*?<\/option>/,
   ''
);

// 4. Transaction list tag logic
code = code.replace(
   "t.category === 'workshop' ? 'مصاريف ورشة' :",
   ""
);

fs.writeFileSync('src/pages/Ledger.jsx', code);
