const fs = require('fs');

const ledgerPath = 'src/pages/Ledger.jsx';
const analyticsPath = 'src/pages/Analytics.jsx';

let ledgerCode = fs.readFileSync(ledgerPath, 'utf8');
let analyticsCode = fs.readFileSync(analyticsPath, 'utf8');

// --- 1. EXTRACT FROM LEDGER ---

// Extract useMemo
const useMemoStart = ledgerCode.indexOf('const monthlyStats = useMemo(() => {');
const useMemoEnd = ledgerCode.indexOf('// Calculate balances per supplier');
if (useMemoStart === -1 || useMemoEnd === -1) {
    console.error("Could not find monthlyStats block");
    process.exit(1);
}
const useMemoBlock = ledgerCode.substring(useMemoStart, useMemoEnd).trim();

// Remove useMemo from Ledger
ledgerCode = ledgerCode.replace(ledgerCode.substring(useMemoStart, useMemoEnd), '');

// Extract UI Block
const uiSearchStr = '<h2 className="heading-md">احصائيات الشهور</h2>';
const h2Idx = ledgerCode.indexOf(uiSearchStr);
const cardStart = ledgerCode.lastIndexOf('<div className="card">', h2Idx);
// Find the closing tags for the card. The card contains `monthlyStats.map`.
// Look for `<AnimatePresence>` closing which is inside the map, then the closing tags.
// Let's use a simple approach: extract from `<div className="card">` down to `<!-- END OF MONTHLY STATS -->` if we had one.
// Since we don't, we can match until `// Calculate balances per supplier` ... wait, the UI is in the `return` statement.
// The return statement has:
// return (
//   <div className="page-container">
//     ...
//     <div className="card"> احصائيات الشهور ... </div>
//     ...
//   </div>
// )
// In Ledger, the "Supplier Balances" card comes after "احصائيات الشهور".
// Let's find "أرصدة الموردين / المطابع"
const supplierBalancesIdx = ledgerCode.indexOf('أرصدة الموردين / المطابع');
const supplierCardStart = ledgerCode.lastIndexOf('<div className="card">', supplierBalancesIdx);

const uiBlock = ledgerCode.substring(cardStart, supplierCardStart).trim();

// Remove UI block from Ledger
ledgerCode = ledgerCode.replace(ledgerCode.substring(cardStart, supplierCardStart), '');

fs.writeFileSync(ledgerPath, ledgerCode);


// --- 2. INJECT INTO ANALYTICS ---

// We need to inject `monthlyStats` `useMemo` block into `Analytics.jsx`
// And we need to make sure Analytics has the required dependencies.
// Analytics already has: `const { orders, archivedOrders, columns, products } = useData();`
// We need to add `transactions` to `useData()` in Analytics.

if (!analyticsCode.includes('transactions')) {
    analyticsCode = analyticsCode.replace(
        'const { orders, archivedOrders, columns, products } = useData();',
        'const { orders, archivedOrders, columns, products, transactions } = useData();'
    );
}

// Analytics also needs `expandedMonth` and `setExpandedMonth` state!
if (!analyticsCode.includes('expandedMonth')) {
    analyticsCode = analyticsCode.replace(
        'const Analytics = () => {',
        'const Analytics = () => {\n  const [expandedMonth, setExpandedMonth] = useState(null);'
    );
}

// It also needs `useState` if it doesn't have it.
if (!analyticsCode.includes('useState')) {
    analyticsCode = analyticsCode.replace(
        "import React, { useMemo } from 'react';",
        "import React, { useState, useMemo } from 'react';"
    );
}

// And `ChevronUp`, `ChevronDown`, `ShoppingCart`, `FileText`, `TrendingUp` from lucide-react if missing.
const iconsToAdd = ['ChevronUp', 'ChevronDown', 'ShoppingCart', 'FileText', 'TrendingUp'];
iconsToAdd.forEach(icon => {
    if (!analyticsCode.includes(icon)) {
        analyticsCode = analyticsCode.replace(
            'import {',
            `import { ${icon},`
        );
    }
});
// Need framer-motion AnimatePresence and motion
if (!analyticsCode.includes('AnimatePresence')) {
    analyticsCode = `import { motion, AnimatePresence } from 'framer-motion';\n` + analyticsCode;
}

// Inject `useMemoBlock` right before `const allOrdersList = ...`
const allOrdersListIdx = analyticsCode.indexOf('const allOrdersList =');
analyticsCode = analyticsCode.substring(0, allOrdersListIdx) + useMemoBlock + '\n\n  ' + analyticsCode.substring(allOrdersListIdx);


// Inject `uiBlock` right after `<h2 className="heading-lg">نظرة عامة وإحصائيات</h2>`
const overviewHeaderIdx = analyticsCode.indexOf('<h2 className="heading-lg">نظرة عامة وإحصائيات</h2>');
const overviewHeaderEnd = analyticsCode.indexOf('\n', overviewHeaderIdx) + 1;

analyticsCode = analyticsCode.substring(0, overviewHeaderEnd) + '\n      ' + uiBlock + '\n\n' + analyticsCode.substring(overviewHeaderEnd);


fs.writeFileSync(analyticsPath, analyticsCode);
console.log('Moved successfully!');
