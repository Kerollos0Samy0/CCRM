const fs = require('fs');
let code = fs.readFileSync('src/components/OrderModal.jsx', 'utf8');

// I will just replace the entire top section with the custom dropdown components.
const startTag = "const ClientSelect =";
const endTag = "const OrderModal = ({ onClose }) => {";
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

const newComponents = `
const CustomAutocomplete = ({ value, onChange, options, placeholder, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value || '');
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    setSearch(value || '');
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        onChange(search); // commit whatever is typed
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search, onChange]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-md)',
          marginTop: '4px'
        }}>
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: i === filteredOptions.length - 1 ? 'none' : '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                setSearch(opt);
                onChange(opt);
                setIsOpen(false);
                if (onSelect) onSelect(opt);
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

`;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newComponents + code.substring(endIndex);
}

// Now update OrderModal to get addClient
code = code.replace(
  "const { addOrder, clients, products } = useData();",
  "const { addOrder, clients, products, addClient } = useData();"
);

// Update handleSubmit to auto-add client
const handleSubmitRegex = /const handleSubmit = \(e\) => \{[\s\S]*?e\.preventDefault\(\);/;
code = code.replace(handleSubmitRegex, `const handleSubmit = (e) => {
    e.preventDefault();
    const existingClient = clients.find(c => c.name === formData.name);
    if (!existingClient && formData.name) {
      addClient({
        name: formData.name,
        phone: formData.mobile,
        governorate: formData.governorate,
        address: formData.address,
        church: formData.church
      });
    }`);

// Replace <ClientSelect ... /> with <CustomAutocomplete ... />
code = code.replace(
  /<ClientSelect value=\{formData\.name\} onChange=\{handleNameChange\} onClientSelect=\{handleNameChange\} clients=\{clients\} \/>/g,
  `<CustomAutocomplete 
              value={formData.name} 
              onChange={(val) => handleNameChange({ target: { value: val } })} 
              onSelect={(val) => handleNameChange({ target: { value: val } })}
              options={clients.map(c => c.name)} 
              placeholder="اختر العميل أو اكتب عميل جديد..." 
            />`
);

// Replace <ProductSelect ... /> with <CustomAutocomplete ... />
code = code.replace(
  /<ProductSelect value=\{item\.workshop\} onChange=\{\(val\) => handleItemChange\(index, 'workshop', val\)\} products=\{products\} \/>/g,
  `<CustomAutocomplete 
                    value={item.workshop} 
                    onChange={(val) => handleItemChange(index, 'workshop', val)}
                    options={products.map(p => p.name)}
                    placeholder="اختر المنتج أو اكتب منتج آخر..."
                  />`
);

fs.writeFileSync('src/components/OrderModal.jsx', code);
console.log('Patched OrderModal.jsx for Custom Autocomplete');
