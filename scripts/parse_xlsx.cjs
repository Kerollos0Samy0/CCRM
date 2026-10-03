const fs = require('fs');
const https = require('https');
const ExcelJS = require('exceljs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => reject(err));
  });
}

async function main() {
  console.log('Downloading XLSX...');
  await download('https://docs.google.com/spreadsheets/d/1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c/export?format=xlsx&gid=0', 'orders.xlsx');
  
  console.log('Reading XLSX...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('orders.xlsx');
  
  const worksheet = workbook.getWorksheet(1); // 'اوردر'
  const rows = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    // We only need the first cell's color to determine the status
    const firstCell = row.getCell(1);
    let color = 'unknown';
    
    // In exceljs, fill.fgColor contains the color if pattern is 'solid'
    if (firstCell.fill && firstCell.fill.fgColor) {
      if (firstCell.fill.fgColor.argb) {
        color = firstCell.fill.fgColor.argb;
      }
    }
    
    const rowData = {
      color: color,
      name: row.getCell(1).text,
      date: row.getCell(2).text,
      number: row.getCell(3).text,
      gov: row.getCell(4).text,
      address: row.getCell(5).text,
      social: row.getCell(6).text,
      product: row.getCell(7).text,
      quantity: row.getCell(8).value,
      price: row.getCell(9).value,
      discount: row.getCell(10).value,
      total: row.getCell(11).value,
      deposit: row.getCell(12).value,
      depositMethod: row.getCell(13).text,
      remaining: row.getCell(14).value,
      done: row.getCell(15).value,
      processed: row.getCell(16).value,
      payed: row.getCell(17).value,
      paymentMethod: row.getCell(18).text,
      balance: row.getCell(19).value,
      delivery: row.getCell(20).value,
      deliveryBy: row.getCell(21).text,
    };
    rows.push(rowData);
  });
  
  fs.writeFileSync('orders_dump.json', JSON.stringify(rows, null, 2));
  console.log(`Saved ${rows.length} rows to orders_dump.json`);
}

main().catch(console.error);
