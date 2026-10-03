const fs = require('fs');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function parseFormulaObj(val) {
  if (val && typeof val === 'object' && val.result !== undefined) {
    return Number(val.result) || 0;
  }
  return Number(val) || 0;
}

const data = require('./orders_dump.json');

const ordersMap = new Map();

data.forEach(r => {
  if (!r.name) return; // Skip empty names
  const key = `${r.name}_${new Date(r.date).getTime()}_${r.gov || ''}_${r.address || ''}`;
  
  if (!ordersMap.has(key)) {
    // Map colors to status
    let status = 'new_order';
    if (r.color.includes('FF0000')) status = 'design';
    else if (r.color.includes('FFFF00') || r.color.includes('FF9900') || r.color.includes('BF9000')) status = 'church';
    else if (r.color.includes('FF00FF')) status = 'shipping';
    else if (r.color.includes('93C47D')) status = 'delivered';
    
    // Create new order
    ordersMap.set(key, {
      id: uuidv4(),
      clientName: r.name,
      phone: r.number || '',
      government: r.gov || '',
      address: r.address || '',
      notes: r.social || '', // social link or note
      deadline: '',
      items: [],
      discount: 0,
      paidAmount: 0,
      totalRemaining: 0,
      status: status
    });
  }
  
  const order = ordersMap.get(key);
  
  // Create item
  const item = {
    id: uuidv4(),
    name: r.product,
    quantity: Number(r.quantity) || 1,
    type: 'printing', // default
    isCustomDesign: false,
    notes: '',
    status: order.status,
    sellPrice: parseFormulaObj(r.price)
  };
  
  order.items.push(item);
  order.discount += parseFormulaObj(r.discount);
  order.paidAmount += parseFormulaObj(r.deposit);
  // Also add any post-payment to paidAmount if present, but usually 'payed' is total paid
  const payedVal = parseFormulaObj(r.payed);
  if (payedVal > 0) {
    // if 'payed' is greater than deposit, use payed as the total paid amount
    if (payedVal > order.paidAmount) {
        order.paidAmount = payedVal;
    }
  }
});

const ordersList = Array.from(ordersMap.values());
const activeOrders = {};
const archivedOrders = [];
const initialColumns = {
  new_order: { id: 'new_order', title: 'اوردر جديد', orderIds: [], color: 'var(--state-new)' },
  design: { id: 'design', title: 'في التصميم', orderIds: [], color: 'var(--state-design)' },
  printing: { id: 'printing', title: 'في الطباعة', orderIds: [], color: 'var(--state-printing)' },
  church: { id: 'church', title: 'في الكنيسة', orderIds: [], color: 'var(--state-church)' },
  shipping: { id: 'shipping', title: 'في الشحن', orderIds: [], color: 'var(--state-shipping)' },
  delivered: { id: 'delivered', title: 'وصول إلى العميل', orderIds: [], color: 'var(--state-delivered)' },
};

ordersList.forEach(order => {
  if (order.status === 'delivered') {
    // Archived
    const archived = {
      ...order,
      archiveDate: new Date().toISOString(),
      originalStatus: 'delivered'
    };
    archivedOrders.push(archived);
  } else {
    // Active
    activeOrders[order.id] = order;
    if (initialColumns[order.status]) {
      initialColumns[order.status].orderIds.push(order.id);
    } else {
      initialColumns['new_order'].orderIds.push(order.id);
    }
  }
});

const output = {
  orders: activeOrders,
  columns: initialColumns,
  archivedOrders: archivedOrders
};

fs.writeFileSync('../src/data/migrated_orders.json', JSON.stringify(output, null, 2));
console.log(`Migrated ${ordersList.length} orders (${Object.keys(activeOrders).length} active, ${archivedOrders.length} archived).`);
