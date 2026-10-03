const fs = require('fs');
let code = fs.readFileSync('src/components/OrderModal.jsx', 'utf8');

const oldAutocomplete = `
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
`;

const newAutocomplete = `
  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
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
          style={{ paddingLeft: '32px' }}
        />
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          ▼
        </div>
      </div>
`;

code = code.replace(oldAutocomplete, newAutocomplete);

fs.writeFileSync('src/components/OrderModal.jsx', code);
console.log('Added dropdown arrow to CustomAutocomplete');
