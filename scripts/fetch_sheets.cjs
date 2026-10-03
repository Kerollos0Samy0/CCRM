const https = require('https');
const fs = require('fs');

const fetchCSV = (sheetName) => {
  return new Promise((resolve, reject) => {
    const url = 'https://docs.google.com/spreadsheets/d/1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(sheetName);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

(async () => {
  const sheets = ['شهر 3', 'شهر 4', 'شهر 5', 'شهر 6', 'شهر 7'];
  let allOrders = [];
  
  for (const s of sheets) {
    const data = await fetchCSV(s);
    if (!data.includes('Error')) {
      const lines = data.trim().split('\n').filter(l => l.trim() !== '');
      for (let i = 1; i < lines.length; i++) { // skip header
        const row = parseCSVLine(lines[i]);
        if (row.length > 5 && row[0] && row[0].trim() !== '') {
           allOrders.push(row);
        }
      }
    }
  }
  
  // Format orders to CRM structure
  const formattedOrders = allOrders.map((row, index) => {
      const clientName = row[0]?.replace(/^"|"$/g, '').trim();
      const rawDate = row[1]?.replace(/^"|"$/g, '').trim();
      const mobile = row[2]?.replace(/^"|"$/g, '').trim();
      const gov = row[3]?.replace(/^"|"$/g, '').trim();
      const address = row[4]?.replace(/^"|"$/g, '').trim();
      const orderNotes = row[5]?.replace(/^"|"$/g, '').trim();
      
      const itemName = row[6]?.replace(/^"|"$/g, '').trim();
      const qty = parseInt(row[7]?.replace(/^"|"$/g, '').replace(/,/g, '')) || 1;
      const price = parseFloat(row[8]?.replace(/^"|"$/g, '').replace(/,/g, '')) || 0;
      const itemDiscount = parseFloat(row[9]?.replace(/^"|"$/g, '').replace(/,/g, '')) || 0; 
      
      const totalAmount = parseFloat(row[10]?.replace(/^"|"$/g, '').replace(/,/g, '')) || 0;
      const deposit = parseFloat(row[11]?.replace(/^"|"$/g, '').replace(/,/g, '')) || 0;
      
      const parsedDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

      return {
        id: 'imported-' + Math.random().toString(36).substr(2, 9),
        clientName,
        mobile,
        governorate: gov,
        address,
        orderNotes,
        createdAt: parsedDate,
        archivedAt: parsedDate,
        status: 'delivered', 
        items: [{
          id: 'item-' + Math.random().toString(36).substr(2, 9),
          workshop: itemName,
          name: itemName,
          quantity: qty,
          unitPrice: price,
          status: 'ready'
        }],
        discount: itemDiscount,
        totalAmount: totalAmount,
        deposit: deposit,
      };
  });
  
  fs.writeFileSync('src/data/sheets_orders.json', JSON.stringify({ archived: formattedOrders }, null, 2));
  console.log('Saved ' + formattedOrders.length + ' orders to src/data/sheets_orders.json');
})();
