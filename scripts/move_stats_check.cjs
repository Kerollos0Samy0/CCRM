const fs = require('fs');
const ledgerPath = 'src/pages/Ledger.jsx';
const analyticsPath = 'src/pages/Analytics.jsx';

let ledgerCode = fs.readFileSync(ledgerPath, 'utf8');
let analyticsCode = fs.readFileSync(analyticsPath, 'utf8');

// 1. Extract `monthlyStats` block from Ledger
const useMemoStart = ledgerCode.indexOf('const monthlyStats = useMemo(() => {');
const useMemoEnd = ledgerCode.indexOf('// Calculate balances per supplier');
if (useMemoStart === -1 || useMemoEnd === -1) {
   console.error("Could not find monthlyStats useMemo block in Ledger.jsx");
   process.exit(1);
}
const useMemoBlock = ledgerCode.substring(useMemoStart, useMemoEnd).trim();

// 2. Extract UI block from Ledger
// The UI block starts with:
// <div className="card">
//   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//     <h2 className="heading-md">احصائيات الشهور</h2>
const uiSearchStr = '<h2 className="heading-md">احصائيات الشهور</h2>';
const h2Idx = ledgerCode.indexOf(uiSearchStr);
if (h2Idx === -1) {
   console.error("Could not find UI block in Ledger.jsx");
   process.exit(1);
}
// Find the preceding <div className="card">
const cardStart = ledgerCode.lastIndexOf('<div className="card">', h2Idx);
// Find the end of this card. It's a bit tricky. We can look for the next top-level sibling or just parse.
// Let's just find the end of the `monthlyStats.map` block.
const endOfMap = ledgerCode.indexOf('</div>\n        </div>\n      </div>\n    </div>\n  );\n};');
// Let's use string operations carefully
let uiEnd = ledgerCode.indexOf('<!-- END_MONTHLY_STATS -->'); // If it existed
// Let's just search for the end of the card
const endStr = "          </div>\n        </div>";
let uiBlock = '';
const searchPart = ledgerCode.substring(cardStart);
const match = searchPart.match(/<div className="card">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (match) {
    uiBlock = match[0];
    // We actually just want to remove everything from cardStart to before `return`?
    // Let's just remove the block with a regex
}

// Alternative: I will just inject it into Analytics, and manually remove it from Ledger via a precise regex.
