const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('live_orders_from_sheet.json', 'utf8'));

function parseRow(row, headers) {
    let obj = {};
    row.c.forEach((cell, i) => {
        const val = cell ? (cell.f || cell.v) : '';
        const header = headers[i] ? headers[i].label || `col_${i}` : `col_${i}`;
        obj[header] = val;
        obj['col_' + i] = val;
    });
    return obj;
}

const headers = raw.table.cols;
const allData = raw.table.rows.map(row => parseRow(row, headers));

const activeOrders = {};
const archivedOrders = [];
const stats = {
    pending: 0,
    designing: 0,
    printing: 0,
    received: 0,
    ready: 0,
    shipped: 0,
    arrived: 0
};

allData.forEach((row, i) => {
    const isDesigned = String(row['col_11']).trim().toUpperCase() === 'TRUE';
    const isPrinted = String(row['col_12']).trim().toUpperCase() === 'TRUE';
    const isReceivedFromPrint = String(row['col_13']).trim().toUpperCase() === 'TRUE';
    const isDelivery = String(row['col_14']).trim().toUpperCase() === 'TRUE';
    const isProcessed = String(row['col_15']).trim().toUpperCase() === 'TRUE';
    
    if (!row['Client Name'] || String(row['Client Name']).trim() === '') return;

    let category = '';
    
    if (isDelivery && isProcessed) {
        category = 'arrived';
    } else if (isDelivery) {
        category = 'shipped';
    } else if (isProcessed) {
        category = 'ready';
    } else if (isReceivedFromPrint) {
        category = 'received';
    } else if (isPrinted) {
        category = 'printing';
    } else if (isDesigned) {
        category = 'designing';
    } else {
        category = 'pending';
    }
    
    stats[category]++;
    
    // Group by Client Name to merge items
    const orderId = String(row['Client Name']).trim() + '_' + String(row['Church']||'').trim();
    if (!orderId) return;

    const orderObj = {
        id: orderId,
        name: String(row['Client Name']).trim(),
        phone: String(row['Phone']||'').trim(),
        gov: String(row['المحافطة']||'').trim(), 
        region: String(row['المنطقة']||'').trim(), 
        church: String(row['Church']||'').trim(),
        items: [{
            name: String(row['Order Details']||'').trim(), 
            quantity: Number(row['Quantity']) || 1, 
            price: Number(row['Price']) || 0 
        }],
        discount: Number(row['Discount']) || 0, 
        total: Number(row['Total']) || 0, 
        deposit: Number(row['Deposit']) || 0, 
        depositMethod: String(row['Deposit Method']||'').trim(), 
        rest: Number(row['The Rest']) || 0, 
        status: category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (category === 'arrived') {
        archivedOrders.push(orderObj);
    } else {
        if (activeOrders[orderId]) {
            activeOrders[orderId].items.push(orderObj.items[0]);
            activeOrders[orderId].total += orderObj.total;
        } else {
            activeOrders[orderId] = orderObj;
        }
    }
});

fs.writeFileSync('src/data/full_orders_v11.json', JSON.stringify({ active: activeOrders, archived: archivedOrders }, null, 2));

console.log('Filtered Active Orders:', Object.keys(activeOrders).length);
console.log('Filtered Archived Orders:', archivedOrders.length);
console.log('Stats:', stats);
