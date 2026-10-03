const fs = require('fs');

// Fix DataContext.jsx
let dataContext = fs.readFileSync('src/context/DataContext.jsx', 'utf8');
dataContext = dataContext.replace(
  'if (o.government && !o.governorate) o.governorate = o.government;',
  'if (o.government && !o.governorate) o.governorate = o.government;\n  if (o.gov && !o.governorate) o.governorate = o.gov;'
);
fs.writeFileSync('src/context/DataContext.jsx', dataContext);
console.log('Fixed DataContext.jsx mapping');

// Fix Dashboard.jsx
let dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
dashboard = dashboard.replace(
  '<span>{order.governorate}</span>',
  '<span>{order.governorate || \'\'} {order.region ? `- ${order.region}` : \'\'}</span>'
);
fs.writeFileSync('src/pages/Dashboard.jsx', dashboard);
console.log('Fixed Dashboard.jsx display');
