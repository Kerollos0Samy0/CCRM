const orders = require('./src/data/imported_orders.json');
console.log('Total orders:', orders.length);
if (orders.length > 0) {
    console.log(orders[0]);
}
