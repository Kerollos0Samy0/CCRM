const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const data = JSON.parse(fs.readFileSync('src/data/old_crm_data.json', 'utf8'));
const cols = data.table.cols.map(c => c ? c.label : '');

const rawRows = data.table.rows.map(row => {
    const obj = {};
    row.c.forEach((cell, i) => {
        const val = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
        obj[cols[i]] = val;
        obj['col_' + i] = val;
    });
    return obj;
});

const clientsMap = {};
const productsMap = {};
const ordersMap = {};

let orderIdCounter = 1000;

rawRows.forEach(row => {
    const clientName = String(row['Client Name'] || '').trim();
    if (!clientName) return;

    // Build client
    if (!clientsMap[clientName]) {
        clientsMap[clientName] = {
            id: uuidv4(),
            name: clientName,
            phone: row['Number'] ? String(row['Number']) : '',
            governorate: row['المحافطة'] ? String(row['المحافطة']) : '',
            address: row['المنطقة'] ? String(row['المنطقة']) : '',
            church: row['Social'] ? String(row['Social']) : ''
        };
    }

    // Build product
    const productName = String(row['Order Details'] || '').trim();
    if (productName && !productsMap[productName]) {
        productsMap[productName] = {
            id: uuidv4(),
            name: productName,
            buyPrice: 0,
            sellPrice: row['Price'] ? Number(row['Price']) : 0,
            stock: 0
        };
    } else if (productName && productsMap[productName].sellPrice === 0 && row['Price']) {
        productsMap[productName].sellPrice = Number(row['Price']);
    }

    // Determine status from columns
    let status = 'pending';
    if (row['Delivery By'] === 'TRUE' || row['Delivery By'] === true) status = 'arrived';
    else if (row['Delivery'] === 'TRUE' || row['Delivery'] === true) status = 'shipped';
    else if (row['Processed'] === 'TRUE' || row['Processed'] === true) status = 'ready';
    else if (row['Done'] === 'TRUE' || row['Done'] === true) status = 'received';
    else if (row['col_23'] === 'TRUE' || row['col_23'] === true) status = 'printing'; // using guess
    else if (row['col_22'] === 'TRUE' || row['col_22'] === true) status = 'designing';

    // The old app grouped by col_16 (which is Payed) or Client Name
    // We will just group by ClientName + Date + Status for simplicity, or just create individual orders and let them be.
    // Let's create an order for each row to be safe.
    
    const qty = Number(row['Quantity']) || 1;
    const price = Number(row['Price']) || 0;
    
    const oId = uuidv4();
    ordersMap[oId] = {
        id: oId,
        name: clientName,
        church: clientsMap[clientName].church,
        mobile: clientsMap[clientName].phone,
        governorate: clientsMap[clientName].governorate,
        address: clientsMap[clientName].address,
        createdAt: row['Date'] ? new Date(row['Date']).toISOString() : new Date().toISOString(),
        deadline: new Date(Date.now() + 3*24*60*60*1000).toISOString(),
        items: [{
            workshop: productName,
            quantity: qty,
            unitPrice: price,
            status: 'new'
        }],
        totalAmount: price * qty,
        discount: row['Discount'] ? Number(row['Discount']) : 0,
        paidAmount: row['Deposit'] ? Number(row['Deposit']) : 0,
        remainingAmount: (price * qty) - (row['Discount'] ? Number(row['Discount']) : 0) - (row['Deposit'] ? Number(row['Deposit']) : 0),
        status: status,
        orderNotes: ''
    };
});

fs.writeFileSync('src/data/imported_clients.json', JSON.stringify(Object.values(clientsMap), null, 2));
fs.writeFileSync('src/data/imported_products.json', JSON.stringify(Object.values(productsMap), null, 2));
fs.writeFileSync('src/data/imported_orders.json', JSON.stringify(Object.values(ordersMap), null, 2));

console.log('Migration complete. Generated imported_clients, imported_products, imported_orders.');
