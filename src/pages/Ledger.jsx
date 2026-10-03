import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useData } from '../context/DataContext';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, BarChart3, TrendingUp, ShoppingCart, Wrench, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Ledger = () => {
  const {  transactions, addTransaction, deleteTransaction, orders, archivedOrders } = useData();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [formData, setFormData] = useState({
    supplier: '',
    type: 'debt', // 'debt' (مديونية علينا), 'payment' (دفعة مسددة)
    category: 'admin',
    amount: '',
    description: ''
  });

  const handleAdd = (e) => {
    e.preventDefault();
    addTransaction(formData);
    setIsAddModalOpen(false);
    setFormData({ supplier: '', type: 'debt', category: 'admin', amount: '', description: '' });
  };

  // Filter starting from August 2026
  const targetDate = new Date('2026-08-01T00:00:00Z');

  const filteredTransactions = (transactions || []).filter(t => {
    if (!t.date) return false;
    return new Date(t.date) >= targetDate;
  });

  // Calculate balances per supplier
  const balances = useMemo(() => {
    const acc = {};
    filteredTransactions.forEach(t => {
      if (!acc[t.supplier]) acc[t.supplier] = { debt: 0, payment: 0, total: 0 };
      if (t.type === 'debt') acc[t.supplier].debt += t.amount;
      if (t.type === 'payment') acc[t.supplier].payment += t.amount;
      acc[t.supplier].total = acc[t.supplier].debt - acc[t.supplier].payment;
    });
    return acc;
  }, [filteredTransactions]);

  const totalDebt = Object.values(balances).reduce((sum, b) => sum + b.total, 0);

  let totalTransferredToKirolos = 0;
  let totalMarinaCustody = 0;

  const filteredOrders = Object.values(orders || {}).filter(order => {
    if (!order.createdAt) return false;
    return new Date(order.createdAt) >= targetDate;
  });

  filteredOrders.forEach(order => {
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

  const totalPaymentsMade = filteredTransactions.reduce((sum, t) => t.type === 'payment' ? sum + Number(t.amount) : sum, 0);
  const kirolosBalance = totalTransferredToKirolos - totalPaymentsMade;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="heading-lg">الحسابات والمديونيات</h2>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          إضافة معاملة
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        


        {/* Total Debt Summary Card */}
        <div className="card" style={{ borderTop: '4px solid #ef4444', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '50%' }}>
            <Wallet size={32} color="#ef4444" />
          </div>
          <div>
            <h3 className="text-secondary">إجمالي الديون المستحقة</h3>
            <div className="heading-lg" style={{ color: '#ef4444' }}>{totalDebt.toLocaleString()} ج.م</div>
          </div>
        </div>

        {/* Marina Custody Summary Card */}
        <div className="card" style={{ borderTop: '4px solid var(--color-marina)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '50%' }}>
            <Wallet size={32} color="var(--color-marina)" />
          </div>
          <div>
            <h3 className="text-secondary">رصيد مع مارينا (مُحصّل)</h3>
            <div className="heading-lg" style={{ color: 'var(--color-marina)' }}>
              {totalMarinaCustody.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ينتظر التحويل إلى كيرلس
            </div>
          </div>
        </div>

        {/* Kirolos Balance Summary Card */}
        <div className="card" style={{ borderTop: '4px solid var(--state-delivered)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '50%' }}>
            <BarChart3 size={32} color="var(--state-delivered)" />
          </div>
          <div>
            <h3 className="text-secondary">رصيد الخزنة الفعلي (مع كيرلس)</h3>
            <div className="heading-lg" style={{ color: kirolosBalance >= 0 ? 'var(--state-delivered)' : 'var(--color-marina)' }}>
              {kirolosBalance.toLocaleString()} ج.م
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              إجمالي المحول: {totalTransferredToKirolos.toLocaleString()} | المدفوعات: {totalPaymentsMade.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Suppliers Balances */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="heading-md" style={{ marginBottom: '16px' }}>أرصدة الموردين / المطابع</h3>
          {Object.keys(balances).length === 0 ? (
            <p className="text-muted">لا توجد حسابات مسجلة بعد.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(balances).map(([supplier, data]) => (
                <div key={supplier} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{supplier}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>إجمالي المديونية:</span>
                    <span>{data.debt.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>ما تم سداده:</span>
                    <span>{data.payment.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <span>الباقي عليهم:</span>
                    <span style={{ color: data.total > 0 ? 'var(--color-marina)' : 'var(--state-delivered)' }}>
                      {data.total.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="heading-md" style={{ marginBottom: '16px' }}>سجل المعاملات</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '12px' }}>التاريخ</th>
              <th style={{ padding: '12px' }}>النوع</th>
              <th style={{ padding: '12px' }}>الجهة / المطبعة</th>
              <th style={{ padding: '12px' }}>المبلغ</th>
              <th style={{ padding: '12px' }}>البيان</th>
              <th style={{ padding: '12px' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {[...filteredTransactions].reverse().map(t => (
                <motion.tr 
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(t.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {t.type === 'debt' ? (
                      <span className="tag" style={{ background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownRight size={12} /> 
                        {(!t.category || t.category === 'products') ? 'مصاريف منتجات' : 
                         t.category === 'admin' ? 'مصاريف إدارية' : 
                         t.category === 'printing' ? 'مصاريف مطبعة' : 
                         t.category === 'workshop' ? 'مصاريف ورشة' : 
                         'مصاريف أخرى'}
                      </span>
                    ) : (
                      <span className="tag" style={{ background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={12} /> دفعة مسددة
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{t.supplier}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{t.amount.toLocaleString()} ج.م</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{t.description}</td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--color-marina)' }} onClick={() => deleteTransaction(t.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد معاملات مسجلة في هذه الفترة</td>
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
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '400px' }}>
            <h2 className="heading-md" style={{ marginBottom: '24px' }}>تسجيل معاملة جديدة</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>الجهة / المطبعة</label>
                <input required type="text" className="input-field" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="اسم المطبعة أو المورد" />
              </div>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>نوع المعاملة</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="debt">مصروفات / مديونية علينا</option>
                  <option value="payment">دفعة تم تسديدها لهم</option>
                </select>
              </div>
              {formData.type === 'debt' && (
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>تصنيف المصروف</label>
                  <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="admin">مصاريف إدارية (إعلانات، رواتب، باقات، الخ)</option>
                    <option value="printing">مصاريف مطبعة (شغل خارجي)</option>
                    <option value="workshop">مصاريف ورشة (خامات، صيانة، الخ)</option>
                    <option value="products">مصاريف منتجات جاهزة (المخزن)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>المبلغ</label>
                <input required type="number" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" />
              </div>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>البيان (اختياري)</label>
                <input type="text" className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="تفاصيل..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
