const fs = require('fs');
let code = fs.readFileSync('src/components/OrderModal.jsx', 'utf8');

const clientSelectCode = `
const ClientSelect = ({ value, onChange, onClientSelect, clients }) => {
  const [isCustom, setIsCustom] = React.useState(false);
  
  React.useEffect(() => {
    if (value && !clients.some(c => c.name === value)) {
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
          onChange={e => onChange(e)} 
          className="input-field" 
          placeholder="اكتب اسم العميل..." 
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => { setIsCustom(false); onChange({target:{value:''}}); }} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
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
          onChange({target: {value: ''}});
        } else {
          onClientSelect(e);
        }
      }} 
      className="input-field"
    >
      <option value="" disabled>اختر العميل (أو أضف جديد)...</option>
      {clients.map(c => (
        <option key={c.id} value={c.name}>{c.name}</option>
      ))}
      <option value="__CUSTOM__">+ عميل جديد (كتابة يدوي)</option>
    </select>
  );
};
`;

if (!code.includes('ClientSelect')) {
  code = code.replace("const OrderModal = ({ onClose }) => {", clientSelectCode + "\nconst OrderModal = ({ onClose }) => {");
}

const oldInput = `<input required list="clients-list" type="text" name="name" value={formData.name} onChange={handleNameChange} className="input-field" placeholder="اسم العميل" />`;
const newSelect = `<ClientSelect value={formData.name} onChange={handleNameChange} onClientSelect={handleNameChange} clients={clients} />`;

code = code.replace(oldInput, newSelect);

const oldDatalist = `<datalist id="clients-list">
              {clients.map(c => <option key={c.id} value={c.name} />)}
            </datalist>`;
code = code.replace(oldDatalist, "");

fs.writeFileSync('src/components/OrderModal.jsx', code);
console.log('Patched OrderModal.jsx for ClientSelect');
