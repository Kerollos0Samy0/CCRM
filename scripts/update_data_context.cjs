const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// 1. Add state variable
code = code.replace(
   'const [transactions,   setTransactions]   = useState([]);\n    const [supplies,       setSupplies]       = useState([]);',
   'const [transactions,   setTransactions]   = useState([]);\n    const [supplies,       setSupplies]       = useState([]);\n    const [profitShares,   setProfitShares]   = useState({ workshopDeductions: {}, withdrawals: {} });'
);

// 2. Read from ledgerSnap
code = code.replace(
   'setTransactions(txData);\n          }',
   'setTransactions(txData);\n            setProfitShares(ledgerSnap.data().profitShares || { workshopDeductions: {}, withdrawals: {} });\n          }'
);

code = code.replace(
   "setDoc(ledgerRef, { transactions: tx }).catch(console.error);\n            setTransactions(tx);",
   "setDoc(ledgerRef, { transactions: tx, profitShares: { workshopDeductions: {}, withdrawals: {} } }).catch(console.error);\n            setTransactions(tx);\n            setProfitShares({ workshopDeductions: {}, withdrawals: {} });"
);


// 3. updateProfitShares function
const updateCode = `
  const updateProfitShares = async (newShares) => {
    try {
      const ledgerRef = doc(db, 'crm', 'ledger');
      await updateDoc(ledgerRef, { profitShares: newShares });
      setProfitShares(newShares);
    } catch (error) {
      console.error('Error updating profit shares:', error);
    }
  };
`;

code = code.replace(
   'return Object.entries(groups)',
   updateCode + '\n  return Object.entries(groups)'
);

// 4. Export it
code = code.replace(
   'transactions, addTransaction, deleteTransaction,\n      supplies, addSupply, deleteSupply,\n      monthlyStats',
   'transactions, addTransaction, deleteTransaction,\n      supplies, addSupply, deleteSupply,\n      profitShares, updateProfitShares,\n      monthlyStats'
);

fs.writeFileSync('src/context/DataContext.jsx', code);
