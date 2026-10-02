import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, Plus, MapPin, Phone, User, ShoppingBag, DollarSign, Edit, Trash2, X, Filter, ArrowDownAZ } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, orders, archivedOrders } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  const [filterGov, setFilterGov] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    governorate: '',
    address: '',
    church: ''
  });

  // Calculate client stats from all orders (active + archived)
  const clientStats = useMemo(() => {
    const stats = {};
    const allOrders = [...Object.values(orders), ...(archivedOrders || [])];
    
    allOrders.forEach(order => {
      if (!order.clientName && !order.name) return; // Skip if no name
      const name = (order.name || order.clientName || '').trim();
      if (!name) return;
      
      if (!stats[name]) {
        stats[name] = { orderCount: 0, totalSpent: 0 };
      }
      stats[name].orderCount += 1;
      stats[name].totalSpent += (Number(order.totalAmount) || 0);
    });
    return stats;
  }, [orders, archivedOrders]);

  const uniqueGovs = useMemo(() => {
    const govs = clients.map(c => c.governorate).filter(Boolean);
    return [...new Set(govs)].sort();
  }, [clients]);

  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(client => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = client.name?.toLowerCase().includes(search) ||
                            client.phone?.includes(search) ||
                            client.governorate?.toLowerCase().includes(search) ||
                            client.church?.toLowerCase().includes(search);
      
      const matchesGov = filterGov === 'all' || client.governorate === filterGov;
      
      return matchesSearch && matchesGov;
    });

    result.sort((a, b) => {
      const statsA = clientStats[a.name?.trim()] || { orderCount: 0, totalSpent: 0 };
      const statsB = clientStats[b.name?.trim()] || { orderCount: 0, totalSpent: 0 };

      if (sortBy === 'orders') return statsB.orderCount - statsA.orderCount;
      if (sortBy === 'spent') return statsB.totalSpent - statsA.totalSpent;
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
    
    if (sortBy === 'newest') {
      return [...result].reverse();
    }
    return result;
  }, [clients, searchTerm, filterGov, sortBy, clientStats]);

  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const ws = workbook.getWorksheet('Clients') || workbook.getWorksheet(1);
      const newClients = [];
      let idCounter = 1;
      
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip headers
        let name = row.getCell(1).text; // A
        if (!name) return;
        if (typeof name === 'object' && name.richText) {
           name = name.richText.map(rt => rt.text).join('');
        }
        
        let phone = row.getCell(2).text || ''; // B
        let gov = row.getCell(3).text || ''; // C
        let region = row.getCell(4).text || ''; // D
        let addr = row.getCell(5).text || ''; // E
        let church = row.getCell(6).text || ''; // F
        
        const fullAddress = [region, addr].filter(Boolean).join(' - ');

        newClients.push({
          id: 'client_imp_' + Date.now() + '_' + idCounter++,
          name: name.toString().trim(),
          phone: phone.toString().trim(),
          governorate: gov.toString().trim(),
          address: fullAddress.trim(),
          church: church.toString().trim()
        });
      });

      if (newClients.length > 0) {
        if (window.confirm(`تم العثور على ${newClients.length} عميل في الشيت. هل تريد استبدال قاعدة العملاء الحالية بهم؟`)) {
          await replaceClients(newClients);
          alert("تم رفع الشيت وتحديث العملاء بنجاح!");
        }
      } else {
        alert("لم يتم العثور على عملاء في الشيت.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء قراءة الملف.");
    }
    e.target.value = null; // reset input
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        governorate: client.governorate || '',
        address: client.address || '',
        church: client.church || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', phone: '', governorate: '', address: '', church: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteClient(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="heading-lg">قاعدة العملاء</h2>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الرقم، المحافظة أو الكنيسة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field" 
              style={{ paddingRight: '40px' }}
            />
          </div>
          
            <label className="btn btn-secondary" style={{ cursor: 'pointer', background: 'var(--color-kirolos)', color: 'white', borderColor: 'var(--color-kirolos)' }}>
              رفع شيت العملاء
              <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>

            <Plus size={18} />
            إضافة عميل
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--text-secondary)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المحافظة:</span>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '6px 12px' }}
            value={filterGov} 
            onChange={e => setFilterGov(e.target.value)}
          >
            <option value="all">كل المحافظات</option>
            {uniqueGovs.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowDownAZ size={18} color="var(--text-secondary)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ترتيب حسب:</span>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '6px 12px' }}
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">أحدث إضافة</option>
            <option value="orders">الأكثر طلباً (عدد الأوردرات)</option>
            <option value="spent">الأكثر شراءً (إجمالي المبالغ)</option>
            <option value="name">أبجدياً</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            background: 'var(--color-kirolos)', 
            color: 'white', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '0.95rem', 
            fontWeight: 'bold',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
          }}>
            العدد: {filteredAndSortedClients.length} عميل
          </span>
        </div>
      </div>

      <div className="responsive-grid">
        <AnimatePresence>
          {filteredAndSortedClients.map(client => {
            const stats = clientStats[client.name?.trim()] || { orderCount: 0, totalSpent: 0 };
            return (
              <motion.div 
                key={client.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-glass-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-primary)'
                    }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{client.name}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{client.church || 'بدون كنيسة'}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleOpenModal(client)}
                      className="btn" 
                      style={{ padding: '6px', color: 'var(--text-secondary)' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="btn" 
                      style={{ padding: '6px', color: 'var(--state-design)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span dir="ltr">{client.phone || 'غير متوفر'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>{client.governorate} {client.address ? `- ${client.address}` : ''}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingBag size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{stats.orderCount} أوردر</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="var(--state-delivered)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{stats.totalSpent.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredAndSortedClients.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <User size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>لا يوجد عملاء يطابقون بحثك</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <motion.div 
              className="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}
            >
              <button 
                onClick={handleCloseModal}
                style={{ 
                  position: 'absolute', top: '24px', left: '24px', 
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>

              <h2 className="heading-md" style={{ marginBottom: '24px' }}>
                {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الاسم</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="اسم العميل" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>رقم الموبايل</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="01..." dir="ltr" style={{ textAlign: 'right' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الكنيسة</label>
                    <input type="text" name="church" value={formData.church} onChange={handleChange} className="input-field" placeholder="اسم الكنيسة" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>المحافظة</label>
                    <input type="text" name="governorate" value={formData.governorate} onChange={handleChange} className="input-field" placeholder="مثال: القاهرة" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>العنوان</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder="العنوان بالتفصيل" />
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">{editingClient ? 'حفظ التعديلات' : 'إضافة العميل'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Clients;
