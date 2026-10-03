const fs = require('fs');
let code = fs.readFileSync('src/pages/Ledger.jsx', 'utf8');

// 1. Remove the Products Expenses Card
const cardMatch = code.match(/<div style={{ background: '#fdf4ff', padding: '12px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>[\s\S]*?<\/div>\s*<\/div>/);
if (cardMatch) {
    code = code.replace(cardMatch[0], '');
}

// 2. Remove data.products from profit calculation
code = code.replace(
   'const netProfit = data.sales - (data.cogs + data.products + data.admin + data.workshop + data.other);',
   'const netProfit = data.sales - (data.cogs + data.admin + data.workshop + data.other);'
);

// 3. Remove 'products' option from Add Transaction Dropdown
code = code.replace(
   '<option value="products">مصاريف المنتجات (مواد خام، كراتين، بكر، الخ)</option>',
   ''
);

// 4. Default category to 'admin' instead of 'products'
code = code.replace(
   /category: 'products'/g,
   "category: 'admin'"
);

// 5. Transaction list tag logic
code = code.replace(
   "(!t.category || t.category === 'products') ? 'مصاريف المنتجات' :",
   "(!t.category || t.category === 'products') ? 'مصاريف أخرى' :"
);

fs.writeFileSync('src/pages/Ledger.jsx', code);
