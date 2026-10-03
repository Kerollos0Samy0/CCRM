const fs = require('fs');
const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c/export?format=csv&gid=651795177';
const productsPath = './src/data/products.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n').map(l => l.trim()).filter(l => l);
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    // Header is row 9, so data starts at row 10 (index 9 in array if 0-based, wait, the CSV lines:
    // lines[0] is "ProductName,..." if we skip the first 8 lines. Actually looking at the CSV above:
    // Line 9: ProductName,Type...
    // So data starts at Line 10 (index 9)
    for (let i = 9; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 9) continue;
      
      const name = parts[0].trim();
      let stock = parseInt(parts[8].trim(), 10);
      if (isNaN(stock)) stock = 0;
      
      if (!name || name === 'ProductName') continue;

      const prod = products.find(p => p.name === name);
      if (prod) {
        prod.stock = stock;
        console.log(`Updated ${name} stock to ${stock}`);
      } else {
        console.log(`Product not found in JSON: ${name}`);
      }
    }

    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    console.log('Done updating products.json');
  });
});
