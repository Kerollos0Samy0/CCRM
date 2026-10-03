import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { X, MessageCircle, Send, Phone, MapPin, Hash, Calendar, Trash2, Printer, Package, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderModal from './OrderModal';

const OrderDetailsModal = ({ order, isDelivered, onClose }) => {
  const {       } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const { users } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <OrderModal orderToEdit={order} onClose={() => { setIsEditing(false); onClose(); }} />;
  }

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote(order.id, noteText);
    setNoteText('');
  };

  const handleToggleMissing = () => {
    updateOrder(order.id, { 
      hasMissingItems: !order.hasMissingItems, 
      missingNotes: !order.hasMissingItems ? order.missingNotes : '' 
    });
  };

  const handleMissingNotesChange = (e) => {
    updateOrder(order.id, { missingNotes: e.target.value });
  };

  const handleItemStatusChange = (index, newStatus) => {
    const newItems = [...(order.items || [])];
    newItems[index] = { ...newItems[index], status: newStatus };
    
    // Check if all items are ready. If not, auto-flag hasMissingItems. If yes, unflag it.
    const allReady = newItems.every(i => i.status === 'ready');
    
    updateOrder(order.id, { 
      items: newItems,
      hasMissingItems: !allReady,
      missingNotes: !allReady ? (order.missingNotes || 'يوجد منتجات لم تجهز بعد') : ''
    });
  };

  const creatorColor = users.find(u => u.id === order.createdBy)?.color || 'var(--border-color)';
  const creatorName = users.find(u => u.id === order.createdBy)?.name || 'مجهول';

  // Formatting for whatsapp link
  const cleanMobile = (order.mobile || order.phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanMobile.startsWith('0') ? `2${cleanMobile}` : cleanMobile;
  const waLink = `https://wa.me/${waNumber}?text=مرحباً، بخصوص أوردر الحكاية (كنيسة ${order.church || ''})...`;

  const handleDelete = () => {
    if(window.confirm('هل أنت متأكد من حذف هذا الأوردر؟')) {
      deleteOrder(order.id);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <motion.div 
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          width: '100%', maxWidth: '800px', height: '80vh',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Invoice Print Layout */}
        <div className="print-only" style={{ padding: '40px', direction: 'rtl', color: 'black' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>بوليصة شحن</h1>
          <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>الحكاية - Al Hkaya</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem', marginBottom: '24px' }}>
            <tbody>
              <tr>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', width: '30%' }}>اسم العميل:</td>
                <td style={{ border: '2px solid black', padding: '12px' }}>{order.name}</td>
              </tr>
              <tr>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>رقم الموبايل:</td>
                <td style={{ border: '2px solid black', padding: '12px' }}>{order.mobile}</td>
              </tr>
              <tr>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>المحافظة / العنوان:</td>
                <td style={{ border: '2px solid black', padding: '12px' }}>{order.governorate} - {order.address}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginBottom: '10px' }}>تفاصيل الطلب:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '2px solid black', padding: '12px', textAlign: 'right' }}>الصنف</th>
                <th style={{ border: '2px solid black', padding: '12px', textAlign: 'right', width: '20%' }}>سعر الوحدة</th>
                <th style={{ border: '2px solid black', padding: '12px', textAlign: 'right', width: '20%' }}>العدد</th>
                <th style={{ border: '2px solid black', padding: '12px', textAlign: 'right', width: '20%' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>{item.workshop}</td>
                  <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>{item.unitPrice || 0}</td>
                  <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>{item.quantity}</td>
                  <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>{(item.unitPrice || 0) * (item.quantity || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem', marginBottom: '40px' }}>
            <tbody>
              <tr>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', width: '25%' }}>الإجمالي:</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', width: '25%' }}>{order.totalAmount || 0} ج.م</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', width: '25%' }}>الخصم:</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', width: '25%' }}>{order.discount || 0} ج.م</td>
              </tr>
              <tr>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>المدفوع (عربون):</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold' }}>{order.paidAmount || 0} ج.م</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', color: order.remainingAmount > 0 ? 'red' : 'green' }}>الباقي عند الاستلام:</td>
                <td style={{ border: '2px solid black', padding: '12px', fontWeight: 'bold', color: order.remainingAmount > 0 ? 'red' : 'green' }}>{order.remainingAmount || 0} ج.م</td>
              </tr>
            </tbody>
          </table>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '40px' }}>
            شكراً لتعاملكم معنا!
          </p>
        </div>

        {/* Screen Layout */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ 
            padding: '24px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            borderTop: `4px solid ${creatorColor}`
          }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 className="heading-lg">{order.name}</h2>
              <span className="tag" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                {creatorName}
              </span>
            </div>
            <p className="text-body" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>{order.church}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {new Date(order.createdAt).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
              </span>
            </p>
          </div>
          <div className="header-actions">
            <a 
              href={waLink} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary"
              style={{ backgroundColor: '#25D366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)' }}
            >
              <Phone size={18} />
              واتساب
            </a>
            <button 
              onClick={() => window.print()}
              className="btn btn-secondary"
            >
              <Printer size={18} />
              طباعة
            </button>
            {isDelivered && (
              <button 
                onClick={() => {
                  if(window.confirm('هل أنت متأكد من أرشفة هذا الأوردر؟')) {
                    archiveOrder(order.id);
                    onClose();
                  }
                }}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-mira)', color: 'white' }}
              >
                <Package size={18} />
                أرشفة الأوردر
              </button>
            )}
            <button 
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
              style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-color)' }}
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{ color: 'var(--color-marina)', borderColor: 'rgba(248, 113, 113, 0.3)' }}
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '12px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="order-details-layout">
          
          {/* Notes Sidebar (Now 35%) */}
          <div className="order-details-sidebar">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={20} color="var(--text-secondary)" />
              <h3 className="heading-md" style={{ fontSize: '1.1rem' }}>الملاحظات</h3>
            </div>
            
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {order.orderNotes && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  padding: '16px', borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-color)',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>تفاصيل الأوردر (من الواتساب)</span>
                  </div>
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {order.orderNotes}
                  </div>
                </div>
              )}

              {order.notes?.length === 0 && !order.orderNotes ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  لا توجد ملاحظات بعد.
                </div>
              ) : (
                order.notes?.map(note => (
                  <div key={note.id} style={{ 
                    background: 'white', 
                    padding: '16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{note.createdBy}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(note.timestamp).toLocaleString('ar-EG')}</span>
                    </div>
                    <p style={{ lineHeight: 1.5 }}>{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="input-field" 
                  placeholder="اكتب ملاحظة..." 
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!noteText.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Details Main Area */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc' }}>
            
            {/* Missing Items Banner */}
            <div style={{ 
              background: order.hasMissingItems ? '#fef2f2' : 'white', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              border: `2px dashed ${order.hasMissingItems ? '#ef4444' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={order.hasMissingItems || false} 
                  onChange={handleToggleMissing} 
                  id="missingItems" 
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#ef4444' }} 
                />
                <label htmlFor="missingItems" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: order.hasMissingItems ? '#ef4444' : 'var(--text-primary)', cursor: 'pointer' }}>
                  يوجد نواقص في الأوردر ⚠️
                </label>
              </div>
              {order.hasMissingItems && (
                <div style={{ flex: 1, marginRight: '24px' }}>
                  <input 
                    type="text" 
                    value={order.missingNotes || ''} 
                    onChange={handleMissingNotesChange} 
                    className="input-field" 
                    placeholder="ما هي النواقص؟ (مثال: كارت حضور في التصميم)" 
                    style={{ borderColor: '#fca5a5', backgroundColor: 'white', width: '100%', padding: '10px 16px' }} 
                  />
                </div>
              )}
            </div>

            {/* Products Section (Full Width, Prominent) */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Package size={22} color="var(--color-marina)" />
                   المنتجات المطلوبة
                 </h3>
                 <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-marina)', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                   {order.items?.length || 0} منتجات
                 </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {order.items?.map((item, index) => (
                  <div key={index} style={{ 
                    background: '#f8fafc', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b', flex: 1, paddingLeft: '12px' }}>{item.workshop}</span>
                      <select 
                        value={item.status || 'new'}
                        onChange={(e) => handleItemStatusChange(index, e.target.value)}
                        style={{ 
                          padding: '6px 12px', fontSize: '0.9rem', borderRadius: '8px', 
                          border: '1px solid #cbd5e1', background: 'white', fontWeight: 600,
                          cursor: 'pointer', outline: 'none'
                        }}
                      >
                        <option value="new">🆕 جديد</option>
                        <option value="design">🎨 في التصميم</option>
                        <option value="printing">🖨️ في المطبعة</option>
                        <option value="ready">✅ جاهز (كنيسة)</option>
                      </select>
                    </div>
                    
                    <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '6px' }}>{item.quantity} قطع</span>
                        <span>×</span>
                        <span>{item.unitPrice || item.price || 0} ج.م</span>
                      </div>
                      <span style={{ color: 'var(--color-marina)', fontWeight: 800, fontSize: '1.1rem' }}>
                        {(item.unitPrice || item.price || 0) * (item.quantity || 0)} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials & Delivery Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Delivery Info */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin size={20} color="#64748b" />
                  معلومات التوصيل
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '8px' }}>
                    <Phone size={18} color="#4f46e5" />
                  </div>
                  <span dir="ltr" style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{order.mobile}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px' }}>
                    <MapPin size={18} color="#16a34a" />
                  </div>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{order.governorate} {order.address ? `- ${order.address}` : ''}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '8px' }}>
                    <Calendar size={18} color="#dc2626" />
                  </div>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>الديد لاين: {order.deadline || 'غير محدد'}</span>
                </div>
              </div>

              {/* Financials */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Hash size={20} color="#64748b" />
                  الحسابيات
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>الإجمالي</span>
                  <span style={{ fontWeight: 800, color: '#1e293b' }}>{order.totalAmount || order.total || 0} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>الخصم</span>
                  <span style={{ fontWeight: 800, color: '#1e293b' }}>{order.discount || 0} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>تم دفع</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>{order.paidAmount || order.deposit || 0} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#eff6ff', borderRadius: '10px', border: '2px solid #bfdbfe', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e3a8a' }}>الباقي</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: (order.remainingAmount || order.rest || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                    {order.remainingAmount !== undefined ? order.remainingAmount : (order.rest || 0)} ج.م
                  </span>
                </div>
              </div>
              
            </div>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailsModal;
