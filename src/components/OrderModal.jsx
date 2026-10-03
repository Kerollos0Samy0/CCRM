import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { useClients } from '../context/ClientsContext';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';


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

const OrderModal = ({ onClose, orderToEdit }) => {
  const {     } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const { clients, addClient } = useClients();
  const defaultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => {
    if (orderToEdit) {
      return { ...orderToEdit };
    }
    return {
      name: '',
      church: '',
      mobile: '',
      governorate: '',
      address: '',
      items: [{ workshop: '', quantity: 1, unitPrice: 0, status: 'new' }],
      deadline: defaultDeadline,
      orderNotes: '',
      discount: 0,
      paidAmount: 0
    };
  });

  const calculateTotal = () => {
    let total = 0;
    formData.items.forEach(item => {
      total += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
    });
    return total;
  };

  const totalAmount = calculateTotal();
  const remainingAmount = totalAmount - (Number(formData.discount) || 0) - (Number(formData.paidAmount) || 0);

  const handleSmartPaste = (e) => {
    const text = e.target.value;
    if (!text) return;

    const newFormData = { ...formData };
    
    const nameMatch = text.match(/(?:الاسم|اسم العميل)\s*[:\-]?\s*([^\n]+)/);
    if (nameMatch) newFormData.name = nameMatch[1].trim();
    
    const mobileMatch = text.match(/(?:الرقم|تليفون|موبايل|الموبايل|فون|رقم)\s*[:\-]?\s*([\d\s]+)/);
    if (mobileMatch) newFormData.mobile = mobileMatch[1].trim();

    const govMatch = text.match(/المحافظة\s*[:\-]?\s*([^\n]+)/);
    if (govMatch) newFormData.governorate = govMatch[1].trim();

    const addressMatch = text.match(/العنوان\s*[:\-]?\s*([^\n]+)/);
    if (addressMatch) newFormData.address = addressMatch[1].trim();

    const churchMatch = text.match(/الكنيسة\s*[:\-]?\s*([^\n]+)/);
    if (churchMatch) newFormData.church = churchMatch[1].trim();

    const orderSectionMatch = text.match(/(?:الاوردر|الطلب|المطلوب|التفاصيل)\s*[:\-]?\s*([\s\S]*?)(?:المدفوع|الخصم|$)/);
    let searchTarget = text;
    if (orderSectionMatch) {
      newFormData.orderNotes = orderSectionMatch[1].trim();
      searchTarget = orderSectionMatch[1].trim();
    }

    // Auto-detect products
    let detectedItems = [];
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
    let textRemaining = searchTarget;

    sortedProducts.forEach(product => {
      if (textRemaining.includes(product.name)) {
        let quantity = 1;
        const escapedName = product.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Match numbers before or after
        const beforeRegex = new RegExp(`(\\d+)\\s*(?:x|X|\\*|\\s)\\s*${escapedName}`, 'i');
        const afterRegex = new RegExp(`${escapedName}\\s*(?:عدد)?\\s*(\\d+)`, 'i');
        
        const beforeMatch = textRemaining.match(beforeRegex);
        const afterMatch = textRemaining.match(afterRegex);
        
        if (beforeMatch) {
            quantity = parseInt(beforeMatch[1], 10);
            textRemaining = textRemaining.replace(beforeMatch[0], '');
        } else if (afterMatch) {
            quantity = parseInt(afterMatch[1], 10);
            textRemaining = textRemaining.replace(afterMatch[0], '');
        } else {
            textRemaining = textRemaining.replace(product.name, '');
        }
        
        detectedItems.push({
          workshop: product.name,
          quantity: quantity,
          unitPrice: product.sellPrice || 0,
          status: 'new'
        });
      }
    });

    if (detectedItems.length > 0) {
      newFormData.items = detectedItems;
    }

    const paidMatch = text.match(/(?:المدفوع|عربون|تم دفع|تم الدفع)\s*[:\-]?\s*(\d+)/);
    if (paidMatch) newFormData.paidAmount = parseInt(paidMatch[1], 10);

    const discountMatch = text.match(/(?:الخصم)\s*[:\-]?\s*(\d+)/);
    if (discountMatch) newFormData.discount = parseInt(discountMatch[1], 10);

    const deadlineMatch = text.match(/(?:الديد لاين|تاريخ التسليم|الديدلاين)\s*[:\-]?\s*(\d{4}-\d{1,2}-\d{1,2})/);
    if (deadlineMatch) {
      const parts = deadlineMatch[1].split('-');
      const yyyy = parts[0];
      const mm = parts[1].padStart(2, '0');
      const dd = parts[2].padStart(2, '0');
      newFormData.deadline = `${yyyy}-${mm}-${dd}`;
    }

    setFormData(newFormData);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fetch price if workshop changed
    if (field === 'workshop') {
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].unitPrice = product.sellPrice;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { workshop: '', quantity: 1, unitPrice: 0, status: 'new' }] });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const matchedClient = clients.find(c => c.name === val);
    if (matchedClient) {
      setFormData(prev => ({
        ...prev,
        name: val,
        church: matchedClient.church || prev.church,
        mobile: matchedClient.phone || prev.mobile,
        governorate: matchedClient.governorate || prev.governorate,
        address: matchedClient.address || prev.address
      }));
    } else {
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const handleSubmit = (e) => {
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
    }

    if (orderToEdit) {
      updateOrder(orderToEdit.id, {
        ...formData,
        totalAmount,
        remainingAmount
      });
    } else {
      addOrder({
        ...formData,
        totalAmount,
        remainingAmount
      });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <motion.div 
        className="card modal-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '24px', left: '24px', 
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <h2 className="heading-md" style={{ marginBottom: '24px' }}>{orderToEdit ? 'تعديل الأوردر' : 'أوردر جديد'}</h2>

        <div style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-marina)', fontWeight: 600 }}>✨ لصق ذكي (Smart Paste)</label>
          <textarea 
            onChange={handleSmartPaste} 
            className="input-field" 
            rows="3" 
            placeholder="انسخ رسالة الواتساب هنا، وسيقوم النظام بتعبئة البيانات تلقائياً..."
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الاسم</label>
            <CustomAutocomplete 
              value={formData.name} 
              onChange={(val) => handleNameChange({ target: { value: val } })} 
              onSelect={(val) => handleNameChange({ target: { value: val } })}
              options={clients.map(c => c.name)} 
              placeholder="اختر العميل أو اكتب عميل جديد..." 
            />
            
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الكنيسة</label>
            <input required type="text" name="church" value={formData.church} onChange={handleChange} className="input-field" placeholder="اسم الكنيسة" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>رقم الموبايل</label>
            <input required type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field" placeholder="01..." dir="ltr" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>المحافظة</label>
            <input required type="text" name="governorate" value={formData.governorate} onChange={handleChange} className="input-field" placeholder="مثال: القاهرة" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>العنوان</label>
            <input required type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder="العنوان بالتفصيل" />
          </div>

          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>المنتجات / الأصناف</label>
              <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                + صنف آخر
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <CustomAutocomplete 
                    value={item.workshop} 
                    onChange={(val) => handleItemChange(index, 'workshop', val)}
                    options={products.map(p => p.name)}
                    placeholder="اختر المنتج أو اكتب منتج آخر..."
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input required type="number" min="0" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="input-field" placeholder="سعر الوحدة" />
                </div>
                <div style={{ flex: 1 }}>
                  <input required type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="input-field" placeholder="العدد" />
                </div>
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="btn btn-secondary" style={{ padding: '10px', color: 'var(--color-marina)', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الديد لاين (تاريخ التسليم)</label>
            <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="input-field" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>ملاحظات الأوردر (تفاصيل الواتساب)</label>
            <textarea name="orderNotes" value={formData.orderNotes} onChange={handleChange} className="input-field" rows="4" placeholder="تفاصيل الأوردرات المتعددة والمبالغ هنا..." />
          </div>

          <div className="form-grid" style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
              <label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>الحسابيات</label>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الخصم (ج.م)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleChange} className="input-field" placeholder="0" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>تم دفع / عربون (ج.م)</label>
              <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} className="input-field" placeholder="0" />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="text-small">إجمالي الأوردر</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{totalAmount} ج.م</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className="text-small">باقي الحساب</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: remainingAmount > 0 ? 'var(--color-marina)' : 'var(--state-delivered)' }}>
                  {remainingAmount} ج.م
                </span>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ الأوردر</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OrderModal;
