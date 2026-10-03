const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

// Fix v2
code = code.replace(
    'if (!columns[colId]) columns[colId] = { ...initialColumns[colId] };',
    'if (!columns[colId]) columns[colId] = initialColumns[colId] ? { ...initialColumns[colId] } : { id: colId, title: colId, orderIds: [], color: \'#ccc\' };'
);
code = code.replace(
    'columns[colId].orderIds = [...new Set([...columns[colId].orderIds, ...migratedData.columns[colId].orderIds])];',
    'columns[colId].orderIds = [...new Set([...(columns[colId].orderIds || []), ...(migratedData.columns[colId].orderIds || [])])];'
);

// Fix v16
code = code.replace(
    '// Setting migratedV16 true is done outside this function (or returned)',
    'migratedV16 = true;\n    // Setting migratedV16 true is done outside this function (or returned)'
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Fixed DataContext.jsx bugs!');
