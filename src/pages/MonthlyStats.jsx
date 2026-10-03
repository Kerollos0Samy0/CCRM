import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, ShoppingCart, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const MonthlyStats = () => {
  const {     transactions,  profitShares, updateProfitShares   } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const monthlyStats = useMonthlyStats({ orders, archivedOrders, transactions, products });
  const [expandedMonth, setExpandedMonth] = useState(null);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--color-marina)20', padding: '12px', borderRadius: '12px', color: 'var(--color-marina)' }}>
          <BarChart3 size={28} />
        </div>
        <h2 className="heading-lg">الحسابات الشهرية</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="heading-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--color-marina)" />
            إحصائيات الشهور
          </h3>
          
          {monthlyStats.length === 0 ? (
            <p className="text-muted">لا توجد بيانات متاحة بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {monthlyStats.map(([monthKey, data]) => {
                const netProfit = data.sales - (data.cogs + data.admin + data.other);
                const isExpanded = expandedMonth === monthKey;
                
                return (
                  <div key={monthKey} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.label}</h4>
                      <button 
                        onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                      >
                        {isExpanded ? <><ChevronUp size={16} /> إخفاء التفاصيل</> : <><ChevronDown size={16} /> عرض التفاصيل</>}
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      
                      <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <div style={{ color: '#059669', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14}/> إجمالي المبيعات</div>
                        <div style={{ color: '#047857', fontWeight: 'bold', fontSize: '1.1rem' }}>{data.sales.toLocaleString()} ج.م</div>
                      </div>

                      <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingCart size={14}/> تكلفة البضاعة (COGS)</div>
                        <div style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '1.1rem' }}>{data.cogs.toLocaleString()} ج.م</div>
                      </div>

                      <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <div style={{ color: '#d97706', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14}/> مصاريف إدارية</div>
                        <div style={{ color: '#b45309', fontWeight: 'bold', fontSize: '1.1rem' }}>{data.admin.toLocaleString()} ج.م</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--border-color)', paddingTop: '16px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>صافي الربح التقريبي:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                        {netProfit.toLocaleString()} ج.م
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                              
                              {/* Orders Table */}
                              <div>
                                <h5 style={{ fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>الأوردرات التي تم تسليمها ({data.ordersList.length})</h5>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'right', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                                      <tr>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>العميل</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>الإجمالي</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>المنتجات</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {data.ordersList.map(o => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                          <td style={{ padding: '8px' }}>{o.clientName}</td>
                                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.totalAmount || o.total || 0}</td>
                                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                                            {o.items?.map(i => `${i.name || i.workshop} (${i.quantity})`).join('، ')}
                                          </td>
                                        </tr>
                                      ))}
                                      {data.ordersList.length === 0 && (
                                        <tr><td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Transactions Table */}
                              <div>
                                <h5 style={{ fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>المعاملات المالية ({data.transactionsList.length})</h5>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'right', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                                      <tr>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>الجهة</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>النوع</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>المبلغ</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {data.transactionsList.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                          <td style={{ padding: '8px' }}>{t.supplier}</td>
                                          <td style={{ padding: '8px' }}>
                                            {t.type === 'payment' ? 'دفعة' : (t.category === 'admin' ? 'إدارية' : t.category === 'workshop' ? 'ورشة' : 'منتجات')}
                                          </td>
                                          <td style={{ padding: '8px', fontWeight: 'bold', color: t.type === 'debt' ? '#ef4444' : '#22c55e' }}>
                                            {t.amount}
                                          </td>
                                        </tr>
                                      ))}
                                      {data.transactionsList.length === 0 && (
                                        <tr><td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyStats;
