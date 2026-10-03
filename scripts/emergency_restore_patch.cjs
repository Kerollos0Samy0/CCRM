const fs = require('fs');
let code = fs.readFileSync('src/context/DataContext.jsx', 'utf8');

const v13Clients = `          if (lsClientsRaw && cData.length === 0) {
              const parsedLsClients = JSON.parse(lsClientsRaw);
              if (parsedLsClients.length > 0) {
                  cData = parsedLsClients;
                  setDoc(clientsRef, { clients: cData, chatMergedV1: true }).catch(console.error);
                  console.warn('Restored CLIENTS from localStorage');
              }
          }
          if (cData.length === 0) {
              cData = initialClients;
              setDoc(clientsRef, { clients: cData, chatMergedV1: true }).catch(console.error);
              console.warn('EMERGENCY: Restored CLIENTS from JSON backup');
          }`;

code = code.replace(
  /          if \(lsClientsRaw && cData\.length === 0\) \{\s*const parsedLsClients = JSON\.parse\(lsClientsRaw\);\s*if \(parsedLsClients\.length > 0\) \{\s*cData = parsedLsClients;\s*setDoc\(clientsRef, \{ clients: cData, chatMergedV1: true \}\)\.catch\(console\.error\);\s*console\.warn\('Restored CLIENTS from localStorage'\);\s*\}\s*\}/,
  v13Clients
);

const v13Products = `          if (lsProductsRaw && pData.length === 0) {
              const parsedLsProducts = JSON.parse(lsProductsRaw);
              if (parsedLsProducts.length > 0) {
                  pData = parsedLsProducts;
                  setDoc(productsRef, { products: pData }).catch(console.error);
                  console.warn('Restored PRODUCTS from localStorage');
              }
          }
          if (pData.length === 0) {
              pData = initialProducts;
              setDoc(productsRef, { products: pData }).catch(console.error);
              console.warn('EMERGENCY: Restored PRODUCTS from JSON backup');
          }`;

code = code.replace(
  /          if \(lsProductsRaw && pData\.length === 0\) \{\s*const parsedLsProducts = JSON\.parse\(lsProductsRaw\);\s*if \(parsedLsProducts\.length > 0\) \{\s*pData = parsedLsProducts;\s*setDoc\(productsRef, \{ products: pData \}\)\.catch\(console\.error\);\s*console\.warn\('Restored PRODUCTS from localStorage'\);\s*\}\s*\}/,
  v13Products
);

fs.writeFileSync('src/context/DataContext.jsx', code);
console.log('Patched DataContext to emergency restore clients and products!');
