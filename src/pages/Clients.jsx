import React, { useState, useMemo } from 'react';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { useClients } from '../context/ClientsContext';
import { Search, Plus, MapPin, Phone, User, ShoppingBag, DollarSign, Edit, Trash2, X, Filter, ArrowDownAZ } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientCard from '../components/clients/ClientCard';
import ClientModal from '../components/clients/ClientModal';

const Clients = () => {
  const {    } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const { clients, addClient, updateClient, deleteClient, replaceClients } = useClients();
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
      const ExcelJSModule = await import("exceljs"); const ExcelJS = ExcelJSModule.default || ExcelJSModule;
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

        
        const nameStr = name.toString().trim();
        const existingIdx = newClients.findIndex(c => c.name === nameStr);
        
        const newClient = {
          id: 'client_imp_' + Date.now() + '_' + idCounter++,
          name: nameStr,
          phone: phone.toString().trim(),
          governorate: gov.toString().trim(),
          address: fullAddress.trim(),
          church: church.toString().trim()
        };

        if (existingIdx !== -1) {
           // Merge data to keep whichever has more info
           const ex = newClients[existingIdx];
           if (!ex.phone && newClient.phone) ex.phone = newClient.phone;
           if (!ex.church && newClient.church) ex.church = newClient.church;
           if (!ex.address && newClient.address) ex.address = newClient.address;
        } else {
           newClients.push(newClient);
        }

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
      alert("حدث خطأ أثناء قراءة الملف: " + err.message);
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
              <motion.div key={client.id}><ClientCard client={client} stats={stats} onEdit={handleOpenModal} onDelete={handleDelete} /></motion.div>
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

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editingClient={editingClient} 
        formData={formData} 
        handleChange={handleChange} 
        handleSubmit={handleSubmit} 
      />

    </div>
  );
};

export default Clients;
