const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const clientsMergeBlock = `
          // Force merge new initialClients (imported from importData.js)
          initialClients.forEach(ic => {
              if (!cData.find(c => c.name === ic.name)) {
                  cData.push(ic);
                  changedC = true;
              } else {
                 // Update missing fields
                 let existing = cData.find(c => c.name === ic.name);
                 if (ic.phone && !existing.phone) { existing.phone = ic.phone; changedC = true; }
                 if (ic.church && !existing.church) { existing.church = ic.church; changedC = true; }
                 if (ic.address && !existing.address) { existing.address = ic.address; changedC = true; }
              }
          });
`;

const productsMergeBlock = `
          // Force merge new initialProducts (imported from importData.js)
          initialProducts.forEach(ip => {
              let existing = pData.find(p => p.name === ip.name);
              if (!existing) {
                  pData.push(ip);
                  changedP = true;
              } else if (existing.sellPrice === 0 && ip.sellPrice > 0) {
                  existing.sellPrice = ip.sellPrice;
                  changedP = true;
              }
          });
`;

code = code.replace("if (cData.length === 0) {", clientsMergeBlock + "\n          if (cData.length === 0) {");
code = code.replace("if (pData.length === 0) {", productsMergeBlock + "\n          if (pData.length === 0) {");

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Patched DataContext.jsx to merge initialClients and initialProducts');
