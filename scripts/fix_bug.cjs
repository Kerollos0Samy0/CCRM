const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// Fix the v2 migration bug where initialColumns[colId] could be undefined, causing orderIds to be undefined
code = code.replace(
  "      if (!columns[colId]) columns[colId] = { ...initialColumns[colId] };\n      columns[colId].orderIds = [...new Set([...columns[colId].orderIds, ...migratedData.columns[colId].orderIds])];",
  "      if (!columns[colId]) columns[colId] = initialColumns[colId] ? { ...initialColumns[colId] } : { id: colId, title: colId, orderIds: [], color: '#ccc' };\n      columns[colId].orderIds = [...new Set([...(columns[colId].orderIds || []), ...(migratedData.columns[colId].orderIds || [])])];"
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Fixed migration v2 crash bug');
