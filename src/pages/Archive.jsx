import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { Search, Package, Calendar, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderDetailsModal from '../components/OrderDetailsModal';

const Archive = () => {
  const {    } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGov, setFilterGov] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const uniqueGovs = [...new Set((archivedOrders || []).map(o => o.governorate).filter(Boolean))].sort();
  const uniqueChurches = [...new Set((archivedOrders || []).map(o => o.church).filter(Boolean))].sort();
  const uniqueProducts = [...new Set((archivedOrders || []).flatMap(o => o.items?.map(i => i.workshop)).filter(Boolean))].sort();

  const filteredOrders = (archivedOrders || []).filter(order => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.name || '').toLowerCase().includes(search) ||
      (order.church || '').toLowerCase().includes(search) ||
      (order.mobile || '').includes(search) ||
      (order.governorate || '').includes(search) ||
      (order.items || []).some(i => (i.workshop || '').toLowerCase().includes(search));
      
    const matchesGov = filterGov ? order.governorate === filterGov : true;
    const matchesChurch = filterChurch ? order.church === filterChurch : true;
    const matchesProduct = filterProduct ? (order.items || []).some(i => i.workshop === filterProduct) : true;

    return matchesSearch && matchesGov && matchesChurch && matchesProduct;
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 className="heading-xl">الأرشيف (شيت)</h1>
          <p className="text-secondary" style={{ marginTop: '8px' }}>
            سجل بجميع الأوردرات التي تم تسليمها وأرشفتها.
          </p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="بحث شامل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingRight: '40px' }}
          />
        </div>
      </div>
      
      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filterGov} onChange={e => setFilterGov(e.target.value)} className="input-field" style={{ width: '200px' }}>
          <option value="">كل المحافظات</option>
          {uniqueGovs.map(gov => <option key={gov} value={gov}>{gov}</option>)}
        </select>
        
        <select value={filterChurch} onChange={e => setFilterChurch(e.target.value)} className="input-field" style={{ width: '200px' }}>
          <option value="">كل الكنائس</option>
          {uniqueChurches.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="input-field" style={{ width: '200px' }}>
          <option value="">كل المنتجات</option>
          {uniqueProducts.map(prod => <option key={prod} value={prod}>{prod}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>لا توجد أوردرات مؤرشفة مطابقة لبحثك.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>تاريخ الطلب</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>تاريخ الأرشفة</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>العميل / الكنيسة</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>بيانات التواصل</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المنتجات</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {new Date(order.archivedAt || order.updatedAt || order.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{order.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.church}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span dir="ltr">{order.mobile}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} />
                      {order.governorate}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.items?.map(i => `${i.workshop} (${i.quantity})`).join('، ')}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--color-marina)' }}>
                    {order.totalAmount || order.total || 0} ج.م
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          isDelivered={false} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default Archive;
