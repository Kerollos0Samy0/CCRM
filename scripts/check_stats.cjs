const fs = require('fs');

async function run() {
  const SHEET_ID = '1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c';
  const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=&gid=0`;
  
  const res = await fetch(GVIZ_URL);
  let text = await res.text();
  text = text.substring(47, text.length - 2); 
  const json = JSON.parse(text);
  
  let categories = { pending: [], designing: [], printing: [], received: [], ready: [], shipped: [], arrived: [] };

  json.table.rows.forEach(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
          const val = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
          obj['col_' + i] = val;
      });
      obj['Client Name'] = obj['col_1'];
      obj['Order Details'] = obj['col_7'];
      obj['Delivery By'] = obj['col_21'];
      
      if (obj['Delivery By'] && String(obj['Delivery By']).trim().toUpperCase() === 'REJECT') {
          return;
      }
      
      const isDone = String(obj['col_14']).trim().toUpperCase() === 'TRUE';
      const isProcessed = String(obj['col_15']).trim().toUpperCase() === 'TRUE';
      const isDelivery = String(obj['col_19']).trim().toUpperCase() === 'TRUE';
      const isDesigning = String(obj['col_21']).trim().toUpperCase() === 'TRUE';
      const isPrinting = String(obj['col_22']).trim().toUpperCase() === 'TRUE';
      const isReceived = String(obj['col_23']).trim().toUpperCase() === 'TRUE';
      
      if (isDone) categories.arrived.push(obj);
      else if (isDelivery) categories.shipped.push(obj);
      else if (isProcessed) categories.ready.push(obj);
      else if (isReceived) categories.received.push(obj);
      else if (isPrinting) categories.printing.push(obj);
      else if (isDesigning) categories.designing.push(obj);
      else if (obj['Client Name'] || obj['Order Details']) categories.pending.push(obj);
  });
  
  console.log('Arrived:', categories.arrived.length);
  console.log('Shipped:', categories.shipped.length);
  console.log('Ready:', categories.ready.length);
  console.log('Received:', categories.received.length);
  console.log('Printing:', categories.printing.length);
  console.log('Designing:', categories.designing.length);
  console.log('Pending:', categories.pending.length);
}
run().catch(console.error);
