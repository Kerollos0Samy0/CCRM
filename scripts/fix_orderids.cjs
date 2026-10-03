const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

code = code.replace(
  'return { orders, columns, archivedOrders,',
  'Object.values(columns).forEach(c => { if (!c || !c.orderIds || !Array.isArray(c.orderIds)) c.orderIds = []; });\n  return { orders, columns, archivedOrders,'
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Added safeguard for orderIds');
