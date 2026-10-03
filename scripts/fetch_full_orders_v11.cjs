const fs = require('fs');

async function run() {
  const SHEET_ID = '1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c';
  const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=&gid=0`;
  const res = await fetch(GVIZ_URL);
  let text = await res.text();
  text = text.substring(47, text.length - 2); 
  const json = JSON.parse(text);
  
  let orders = {};
  
  // To generate random short IDs
  const makeId = () => Math.random().toString(36).substr(2, 7);

  json.table.rows.forEach(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
          const val = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
          obj['col_' + i] = val;
      });
      
      const clientName = String(obj['col_0'] || '').trim();
      if (!clientName) return;
      
      const church = String(obj['col_4'] || '').trim();
      const governorate = String(obj['col_3'] || '').trim();
      const date = String(obj['col_1'] || '').trim();
      
      const key = clientName + '_' + church;
      
      if (!orders[key]) {
          orders[key] = {
              id: makeId(),
              name: clientName,
              mobile: "",
              governorate: governorate,
              church: church,
              deadline: date,
              items: [],
              notes: [{ id: makeId(), text: "Imported fully via v11 from Sheet", date: new Date().toISOString() }],
              hasMissingItems: false,
              createdBy: "system"
          };
      }
      
      const workshop = String(obj['col_6'] || '').trim();
      const quantity = obj['col_7'] ? Number(obj['col_7']) : 1;
      if (workshop) {
          orders[key].items.push({
              id: makeId(),
              workshop: workshop,
              quantity: quantity,
              status: "new"
          });
      }
      
      // Determine status from the row's flags
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
      
      // Since it groups, the last row's status dictates the order's status.
      // This perfectly matches the old app's grouping behavior!
      orders[key].status = status;
      orders[key].totalAmount = obj['col_10'] ? Number(obj['col_10']) : 0;
      orders[key].paidAmount = obj['col_11'] ? Number(obj['col_11']) : 0;
      orders[key].remainingAmount = obj['col_18'] ? Number(obj['col_18']) : 0;
  });
  
  // Convert orders object map into an array or object keyed by ID
  let finalOrders = {};
  Object.values(orders).forEach(o => {
      finalOrders[o.id] = o;
  });
  
  fs.writeFileSync('src/data/full_orders_v11.json', JSON.stringify(finalOrders, null, 2));
  console.log('Saved full_orders_v11.json, count:', Object.keys(finalOrders).length);
}
run().catch(console.error);
