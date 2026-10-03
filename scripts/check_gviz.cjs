const fs = require('fs');

async function run() {
  const SHEET_ID = '1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c';
  const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=&gid=0`;
  const res = await fetch(GVIZ_URL);
  let text = await res.text();
  text = text.substring(47, text.length - 2); 
  const json = JSON.parse(text);
  
  const cols = json.table.cols.map(c => c ? c.label : '');
  console.log('Cols:', cols);
  
  const row = json.table.rows[0];
  const obj = {};
  row.c.forEach((cell, i) => {
      obj['col_' + i] = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
  });
  console.log('First row:', obj);
}
run().catch(console.error);
