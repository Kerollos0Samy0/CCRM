const fs = require('fs');

fetch('https://docs.google.com/spreadsheets/d/1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c/gviz/tq?tqx=out:json&tq=&gid=0')
  .then(r => r.text())
  .then(t => {
    // The google sheets response is wrapped in: /*O_o*/\ngoogle.visualization.Query.setResponse({ ... });
    const jsonStr = t.substring(t.indexOf('{'), t.lastIndexOf('}') + 1);
    const json = JSON.parse(jsonStr);
    
    fs.writeFileSync('src/data/old_crm_data.json', JSON.stringify(json, null, 2));
    console.log('Downloaded data with ' + json.table.rows.length + ' rows');
  })
  .catch(console.error);
