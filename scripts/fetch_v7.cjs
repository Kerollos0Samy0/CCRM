const fs = require('fs');

async function run() {
  const SHEET_ID = '1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c';
  const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=&gid=0`;
  
  const res = await fetch(GVIZ_URL);
  let text = await res.text();
  text = text.substring(47, text.length - 2); // strip JSONP wrapper
  const json = JSON.parse(text);
  
  const cols = json.table.cols.map(c => c ? c.label : '');
  let updates = {};
  
  json.table.rows.forEach(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
          const val = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
          obj['col_' + i] = val;
      });
      
      const clientName = String(obj['col_1'] || '').trim();
      if (!clientName) return;
      
      const isDone = String(obj['col_14']).trim().toUpperCase() === 'TRUE';
      const isProcessed = String(obj['col_15']).trim().toUpperCase() === 'TRUE';
      const isDelivery = String(obj['col_19']).trim().toUpperCase() === 'TRUE';
      const isDesigning = String(obj['col_21']).trim().toUpperCase() === 'TRUE';
      const isPrinting = String(obj['col_22']).trim().toUpperCase() === 'TRUE';
      const isReceived = String(obj['col_23']).trim().toUpperCase() === 'TRUE';
      
      let status = 'pending';
      if (isDone) status = 'arrived';
      else if (isDelivery) status = 'shipped';
      else if (isProcessed) status = 'ready';
      else if (isReceived) status = 'received';
      else if (isPrinting) status = 'printing';
      else if (isDesigning) status = 'designing';
      
      const church = obj['col_4'] || '';
      const key = clientName + '_' + church;
      
      updates[key] = { status };
  });
  
  fs.writeFileSync('src/data/orders_status_update_v7.json', JSON.stringify(updates, null, 2));
  console.log('Saved to orders_status_update_v7.json, count:', Object.keys(updates).length);
}
run().catch(console.error);
