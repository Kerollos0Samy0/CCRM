const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const modalCSS = `
/* Order Details Modal Mobile */
.order-details-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: row;
}

.order-details-sidebar {
  width: 35%;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.order-details-main {
  width: 65%;
  overflow-y: auto;
  padding: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 800px) {
  .order-details-layout {
    flex-direction: column-reverse;
    overflow-y: auto;
  }
  .order-details-sidebar {
    width: 100% !important;
    border-left: none !important;
    border-top: 1px solid var(--border-color);
    flex: none;
    min-height: 400px;
  }
  .order-details-main {
    width: 100% !important;
    padding: 16px !important;
    flex: none;
  }
  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .header-actions .btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}
`;

if (!css.includes('.order-details-layout')) {
  css += '\n' + modalCSS;
  fs.writeFileSync('src/index.css', css);
  console.log('Appended modal CSS');
}

let jsx = fs.readFileSync('src/components/OrderDetailsModal.jsx', 'utf8');

jsx = jsx.replace(
  "        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>",
  "        <div className=\"order-details-layout\">"
);

jsx = jsx.replace(
  "          <div style={{ width: '35%', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>",
  "          <div className=\"order-details-sidebar\">"
);

jsx = jsx.replace(
  "          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>",
  "          <div className=\"order-details-main\">"
);

jsx = jsx.replace(
  "          <div style={{ display: 'flex', gap: '12px' }}>",
  "          <div className=\"header-actions\">"
);

fs.writeFileSync('src/components/OrderDetailsModal.jsx', jsx);
console.log('Patched OrderDetailsModal.jsx');
