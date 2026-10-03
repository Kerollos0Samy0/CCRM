const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');
code = code.replace(
  'if (item.sellPrice !== undefined && item.unitPrice === undefined) item.unitPrice = item.sellPrice;',
  'if (item.sellPrice !== undefined && item.unitPrice === undefined) item.unitPrice = item.sellPrice;\n      if (item.price !== undefined && item.unitPrice === undefined) item.unitPrice = Number(item.price) || 0;'
);
fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Fixed unitPrice mapping in DataContext.jsx');
