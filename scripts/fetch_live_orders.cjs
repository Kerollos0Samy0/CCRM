const fs = require('fs');

async function fetchSheetData() {
    const SHEET_ID = '1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c';
    const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=&gid=0`;
    
    try {
        const response = await fetch(GVIZ_URL);
        const text = await response.text();
        // Extract JSON from response (remove google.visualization.Query.setResponse(...))
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonStr);
        
        let count = 0;
        if (data.table && data.table.rows) {
            count = data.table.rows.length;
        }
        
        fs.writeFileSync('live_orders_from_sheet.json', JSON.stringify(data, null, 2));
        console.log(`Fetched ${count} orders from Google Sheets.`);
    } catch (e) {
        console.error('Failed to fetch:', e);
    }
}

fetchSheetData();
