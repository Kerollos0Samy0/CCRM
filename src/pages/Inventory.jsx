import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useData } from '../context/DataContext';
import { Plus, Edit2, Check, Package, TrendingUp, Download, ClipboardList, Printer, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
  const {         } = useData();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSupplyLogModalOpen, setIsSupplyLogModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [shortageItems, setShortageItems] = useState([]);
  const [supplyForm, setSupplyForm] = useState({ productId: null, productName: '', quantity: 0, notes: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({ buyPrice: 0, sellPrice: 0, stock: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const openShortages = () => {
    const items = products.filter(p => p.stock < 10).map(p => ({
      ...p,
      selected: true,
      reqQty: 10 - p.stock
    }));
    setShortageItems(items);
    setIsShortageModalOpen(true);
  };

  const handleShareWhatsApp = () => {
    const selected = shortageItems.filter(item => item.selected);
    if (selected.length === 0) return;
    
    let text = "نواقص المطبعة:\n\n";
    selected.forEach(item => {
      text += `- ${item.name}: مطلوب ${item.reqQty} نسخة\n`;
    });
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };


  const [formData, setFormData] = useState({
    name: '', type: 'Workshop', buyPrice: 0, sellPrice: 0, stock: 0
  });

  
  const handleWipeProducts = async () => {
    if (window.confirm("هل أنت متأكد من مسح جميع المنتجات في المخزن؟ (لا يمكن التراجع)")) {
      await replaceProducts([]);
      alert("تم مسح المخزن بنجاح!");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const ExcelJSModule = await import("exceljs"); const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const ws = workbook.getWorksheet('Products') || workbook.getWorksheet(1);
      const newProducts = [];
      let idCounter = 1;
      
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip headers
        let name = row.getCell(1).text;
        if (!name) return;
        
        if (typeof name === 'object' && name.richText) {
           name = name.richText.map(rt => rt.text).join('');
        }
        
        newProducts.push({
          id: 'prod_imported_' + Date.now() + '_' + idCounter++,
          name,
          type: row.getCell(2).text || 'Other',
          buyPrice: Number(row.getCell(3).value) || 0,
          sellPrice: Number(row.getCell(4).value) || 0,
          stock: Number(row.getCell(5).value) || Number(row.getCell(10).value) || 0
        });
      });

      if (newProducts.length > 0) {
        if (window.confirm(`تم العثور على ${newProducts.length} منتج في الشيت. هل تريد استبدال المخزن الحالي بهم؟`)) {
          await replaceProducts(newProducts);
          alert("تم رفع الشيت وتحديث المخزن بنجاح!");
        }
      } else {
        alert("لم يتم العثور على منتجات في الشيت. تأكد من أن أسماء المنتجات في العمود الأول (A).");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء قراءة الملف: " + err.message);
    }
    e.target.value = null; // reset input
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProduct(formData);
    setIsAddModalOpen(false);
    setFormData({ name: '', type: 'Workshop', buyPrice: 0, sellPrice: 0, stock: 0 });
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setEditForm({ buyPrice: product.buyPrice, sellPrice: product.sellPrice, stock: product.stock });
  };

  const handleSupplyClick = (product) => {
    setSupplyForm({ productId: product.id, productName: product.name, quantity: '', notes: '' });
    setIsSupplyModalOpen(true);
  };

  const handleSaveSupply = (e) => {
    e.preventDefault();
    if (supplyForm.quantity && Number(supplyForm.quantity) > 0) {
      addSupply(supplyForm.productId, supplyForm.quantity, { productName: supplyForm.productName, notes: supplyForm.notes });
      setIsSupplyModalOpen(false);
    }
  };

  const handleSaveProduct = (id) => {
    updateProduct(id, { 
      buyPrice: Number(editForm.buyPrice), 
      sellPrice: Number(editForm.sellPrice), 
      stock: Number(editForm.stock) 
    });
    setEditingProductId(null);
  };


  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Calculate totals
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.sellPrice), 0);
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={24} color="var(--color-mira)" />
            <div>
              <div className="text-small">إجمالي القطع</div>
              <div className="heading-md">{totalItems.toLocaleString('en-US')}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={24} color="var(--color-sherry)" />
            <div>
              <div className="text-small">القيمة التقديرية (بيع)</div>
              <div className="heading-md">{totalStockValue.toLocaleString('en-US')} ج.م</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

          <button className="btn btn-secondary" onClick={handleWipeProducts} style={{ color: 'var(--color-marina)', borderColor: 'var(--color-marina)' }}>
            مسح المخزن
          </button>
          
          <label className="btn btn-secondary" style={{ cursor: 'pointer', background: 'var(--color-kirolos)', color: 'white', borderColor: 'var(--color-kirolos)' }}>
            رفع شيت جديد
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>

          <input 
            type="text" 
            className="input-field" 
            placeholder="بحث عن منتج..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          <button className="btn btn-secondary" style={{ color: 'var(--color-marina)', borderColor: 'var(--color-marina)' }} onClick={openShortages}>
            <Printer size={18} />
            نواقص المطبعة
          </button>
          <button className="btn btn-secondary" onClick={() => setIsSupplyLogModalOpen(true)}>
            <ClipboardList size={18} />
            سجل التوريدات
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            إضافة منتج
          </button>
        </div>
      </div>


      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>المنتج / الورشة</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>النوع</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>سعر الشراء</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>سعر البيع</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>الرصيد (المخزن)</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredProducts.map(product => (
                <motion.tr 
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td style={{ padding: '16px', fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: '16px' }}>
                    <span className="tag" style={{ backgroundColor: 'var(--bg-primary)' }}>{product.type}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {editingProductId === product.id ? (
                      <input 
                        type="number" 
                        className="input-field" 
                        value={editForm.buyPrice}
                        onChange={(e) => setEditForm({...editForm, buyPrice: e.target.value})}
                        style={{ width: '80px', padding: '4px 8px', minHeight: '30px' }}
                      />
                    ) : (
                      <>{product.buyPrice} ج.م</>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-sherry)' }}>
                    {editingProductId === product.id ? (
                      <input 
                        type="number" 
                        className="input-field" 
                        value={editForm.sellPrice}
                        onChange={(e) => setEditForm({...editForm, sellPrice: e.target.value})}
                        style={{ width: '80px', padding: '4px 8px', minHeight: '30px' }}
                      />
                    ) : (
                      <>{product.sellPrice} ج.م</>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {editingProductId === product.id ? (
                      <input 
                        type="number" 
                        className="input-field" 
                        value={editForm.stock}
                        onChange={(e) => setEditForm({...editForm, stock: e.target.value})}
                        style={{ width: '80px', padding: '4px 8px', minHeight: '30px' }}
                      />
                    ) : (
                      <span style={{ 
                        fontWeight: 600, 
                        color: product.stock <= 5 ? 'var(--color-marina)' : 'inherit' 
                      }}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {editingProductId === product.id ? (
                      <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleSaveProduct(product.id)}>
                        <Check size={14} /> حفظ
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', backgroundColor: 'var(--color-mira)' }} onClick={() => handleSupplyClick(product)}>
                          <Download size={14} /> توريد
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleEditClick(product)}>
                          <Edit2 size={14} /> تعديل
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد منتجات مطابقة للبحث</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <motion.div className="card modal-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="heading-md" style={{ marginBottom: '24px' }}>إضافة منتج جديد</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>اسم المنتج / الورشة</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>سعر الشراء</label>
                  <input required type="number" className="input-field" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>سعر البيع</label>
                  <input required type="number" className="input-field" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الرصيد الافتتاحي (المخزن)</label>
                  <input required type="number" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>النوع</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Workshop">Workshop</option>
                    <option value="Brand">Brand</option>
                    <option value="Digital">Digital</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المنتج</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Supply Modal */}
      {isSupplyModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <motion.div className="card modal-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="heading-md" style={{ marginBottom: '24px' }}>توريد كمية: {supplyForm.productName}</h2>
            <form onSubmit={handleSaveSupply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الكمية الموردة</label>
                <input required type="number" min="1" className="input-field" value={supplyForm.quantity} onChange={e => setSupplyForm({...supplyForm, quantity: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>ملاحظات (اختياري)</label>
                <textarea className="input-field" value={supplyForm.notes} onChange={e => setSupplyForm({...supplyForm, notes: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSupplyModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-mira)' }}>حفظ التوريد</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Supply Log Modal */}
      {isSupplyLogModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '800px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="heading-md">سجل التوريدات</h2>
              <button className="btn btn-secondary" onClick={() => setIsSupplyLogModalOpen(false)}>إغلاق</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>التاريخ</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>المنتج</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>الكمية</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>بواسطة</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {supplies.length > 0 ? (
                  supplies.map(supply => (
                    <tr key={supply.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>{new Date(supply.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{supply.productName}</td>
                      <td style={{ padding: '12px', color: 'var(--color-mira)', fontWeight: 'bold' }}>+{supply.quantity}</td>
                      <td style={{ padding: '12px' }}>{supply.supplierName}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{supply.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد عمليات توريد مسجلة حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      )}

      {/* Shortage Modal */}
      {isShortageModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
              }
            `}
          </style>
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="heading-md" style={{ color: 'var(--color-marina)' }}>جدول النواقص (المطبعة)</h2>
                <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsShortageModalOpen(false)}>إغلاق</button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#25D366' }} onClick={handleShareWhatsApp}>
                    <MessageCircle size={18} />
                    شير واتساب
                  </button>
                  <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={18} />
                    طباعة
                  </button>
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th className="no-print" style={{ padding: '12px', width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={shortageItems.length > 0 && shortageItems.every(i => i.selected)} 
                        onChange={e => {
                          const val = e.target.checked;
                          setShortageItems(shortageItems.map(item => ({ ...item, selected: val })));
                        }} 
                      />
                    </th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>المنتج</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>الكمية الحالية</th>
                    <th style={{ padding: '12px', color: 'var(--text-secondary)', width: '150px' }}>الكمية المطلوبة للطباعة</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageItems.length > 0 ? (
                    shortageItems.map((product, idx) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: product.selected ? 1 : 0.5 }}>
                        <td className="no-print" style={{ padding: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={product.selected}
                            onChange={(e) => {
                              const newItems = [...shortageItems];
                              newItems[idx].selected = e.target.checked;
                              setShortageItems(newItems);
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{product.name}</td>
                        <td style={{ padding: '12px', color: 'var(--color-marina)', fontWeight: 'bold' }}>{product.stock}</td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            className="input-field no-print" 
                            min="1"
                            value={product.reqQty}
                            onChange={(e) => {
                              const newItems = [...shortageItems];
                              newItems[idx].reqQty = e.target.value;
                              setShortageItems(newItems);
                            }}
                            style={{ padding: '6px 12px', textAlign: 'center', width: '80px' }}
                          />
                          <span className="print-only" style={{ display: 'none' }}>{product.reqQty}</span>
                          <style>
                            {`
                              @media print {
                                .print-only { display: inline !important; font-weight: bold; }
                              }
                            `}
                          </style>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد أي منتجات أقل من 10 قطع حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
