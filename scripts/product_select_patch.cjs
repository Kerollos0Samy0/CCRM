const fs = require('fs');
let code = fs.readFileSync('src/components/OrderModal.jsx', 'utf8');

const productSelectCode = `
const ProductSelect = ({ value, onChange, products }) => {
  const [isCustom, setIsCustom] = React.useState(false);
  
  // If the product exists in the predefined list, use it. Otherwise, if it has a value, it must be custom.
  React.useEffect(() => {
    if (value && !products.some(p => p.name === value)) {
      setIsCustom(true);
    }
  }, []);

  if (isCustom) {
    return (
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <input 
          autoFocus
          required 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="input-field" 
          placeholder="اكتب اسم المنتج..." 
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => { setIsCustom(false); onChange(''); }} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
          إلغاء
        </button>
      </div>
    );
  }

  return (
    <select 
      required 
      value={value} 
      onChange={e => {
        if (e.target.value === '__CUSTOM__') {
          setIsCustom(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }} 
      className="input-field"
    >
      <option value="" disabled>اختر المنتج...</option>
      {products.map(p => (
        <option key={p.id} value={p.name}>{p.name}</option>
      ))}
      <option value="__CUSTOM__">+ منتج آخر (كتابة يدوي)</option>
    </select>
  );
};
`;

if (!code.includes('ProductSelect')) {
  code = code.replace("const OrderModal = ({ onClose }) => {", productSelectCode + "\nconst OrderModal = ({ onClose }) => {");
}

const oldInput = `<input required list="products-list" type="text" value={item.workshop} onChange={(e) => handleItemChange(index, 'workshop', e.target.value)} className="input-field" placeholder="اسم الورشة / المنتج" />`;
const newSelect = `<ProductSelect value={item.workshop} onChange={(val) => handleItemChange(index, 'workshop', val)} products={products} />`;

code = code.replace(oldInput, newSelect);

const oldDatalist = `<datalist id="products-list">
              {products.map(p => <option key={p.id} value={p.name} />)}
            </datalist>`;
code = code.replace(oldDatalist, "");

fs.writeFileSync('src/components/OrderModal.jsx', code);
console.log('Patched OrderModal.jsx for ProductSelect');
