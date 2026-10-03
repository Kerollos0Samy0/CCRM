import React, { useState } from 'react';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Wallet, Send } from 'lucide-react';
import OrderDetailsModal from '../components/OrderDetailsModal';

const OrderTransactions = () => {
  const {     } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getOrderStatus = (orderId) => {
    if (!columns) return 'غير معروف';
    for (const colId of Object.keys(columns)) {
      if (columns[colId].orderIds?.includes(orderId)) {
        return columns[colId].title;
      }
    }
    return 'غير معروف';
  };

  // Filter orders: >= 2026-08-01
  const targetDate = new Date('2026-08-01T00:00:00Z');

  const filteredOrders = Object.values(orders).filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    if (orderDate < targetDate) return false;
    if (searchQuery && !order.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let totalValue = 0;
  let totalDeposit = 0;
  let totalRemaining = 0;
  let totalMarinaCustody = 0;
  let totalTransferredToKirolos = 0;

  filteredOrders.forEach(order => {
    totalValue += (Number(order.totalAmount) || 0);
    if (order.isDepositPaid) {
      totalDeposit += (Number(order.paidAmount) || 0);
    }
    if (order.isRestPaid) {
      totalRemaining += (Number(order.remainingAmount) || 0);
    }

    if (order.isDepositPaid && !order.isDepositTransferred) {
      totalMarinaCustody += (Number(order.paidAmount) || 0);
    }
    if (order.isRestPaid && !order.isRestTransferred) {
      totalMarinaCustody += (Number(order.remainingAmount) || 0);
    }

    if (order.isDepositTransferred) {
      totalTransferredToKirolos += (Number(order.paidAmount) || 0);
    }
    if (order.isRestTransferred) {
      totalTransferredToKirolos += (Number(order.remainingAmount) || 0);
    }
  });

  return (
    <div className="fade-in" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Custody Dashboard */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 250px', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', border: 'none', color: '#880e4f', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.3)', padding: '12px', borderRadius: '50%' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>عهدة مارينا (مُحصّل ولم يُحول)</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{totalMarinaCustody.toLocaleString()} ج.م</h2>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 250px', background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)', border: 'none', color: '#004d40', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.3)', padding: '12px', borderRadius: '50%' }}>
            <Send size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>تم تحويله إلى كيرلس</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{totalTransferredToKirolos.toLocaleString()} ج.م</h2>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-lg" style={{ color: 'var(--text-primary)' }}>المعاملات</h1>
          <p className="text-secondary" style={{ marginTop: '8px' }}>التفاصيل المالية للأوردرات بداية من شهر 8 / 2026</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="بحث باسم العميل..." 
            className="input-field" 
            style={{ paddingRight: '40px', width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>التاريخ</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>العميل / الأوردر</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الموبايل</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المحافظة</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الكنيسة</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المنتجات</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المرحلة</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الإجمالي</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الديبوزت</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>دفع الديبوزت؟</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>تحويل كيرلس</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المتبقي</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>دفع الباقي؟</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>تحويل كيرلس</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredOrders.map(order => {
                const itemsString = order.items?.map(i => `${i.workshop} (${i.quantity})`).join('، ') || '-';
                const orderDate = new Date(order.createdAt).toLocaleDateString('ar-EG');
                const status = getOrderStatus(order.id);
                const remAmount = Number(order.remainingAmount) || 0;
                
                return (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{orderDate}</td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-mira)', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>{order.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'right' }}>{order.mobile}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{order.governorate}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{order.church}</td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{itemsString}</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>
                      <span className="tag" style={{ backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{(Number(order.totalAmount) || 0).toLocaleString()}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--color-marina)' }}>{(Number(order.paidAmount) || 0).toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!order.isDepositPaid} 
                        onChange={(e) => updateOrder(order.id, { isDepositPaid: e.target.checked })} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!order.isDepositTransferred} 
                        onChange={(e) => updateOrder(order.id, { isDepositTransferred: e.target.checked })} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', backgroundColor: remAmount > 0 ? '#fee2e2' : '#dcfce7', color: remAmount > 0 ? '#ef4444' : '#22c55e', textAlign: 'center' }}>
                      {remAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!order.isRestPaid} 
                        onChange={(e) => updateOrder(order.id, { isRestPaid: e.target.checked })} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!order.isRestTransferred} 
                        onChange={(e) => updateOrder(order.id, { isRestTransferred: e.target.checked })} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="14" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد أوردرات مطابقة للبحث أو في هذه الفترة</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }}>
              <td colSpan="7" style={{ padding: '16px', fontWeight: 800, textAlign: 'left' }}>الإجماليات الكلية:</td>
              <td style={{ padding: '16px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{totalValue.toLocaleString()} ج.م</td>
              <td style={{ padding: '16px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-marina)' }}>{totalDeposit.toLocaleString()} ج.م</td>
              <td colSpan="2"></td>
              <td style={{ padding: '16px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-marina)', textAlign: 'center' }}>{totalRemaining.toLocaleString()} ج.م</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          isDelivered={selectedOrder.status === 'arrived'} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default OrderTransactions;
