import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, User, ShoppingBag, DollarSign, Edit, Trash2 } from 'lucide-react';

const ClientCard = ({ client, stats, onEdit, onDelete }) => {
  return (
    <motion.div 
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
            onClick={() => onEdit(client)}
            className="btn" 
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(client.id)}
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
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{stats.orderCount} طلبات</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarSign size={16} color="var(--state-delivered)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{stats.totalSpent.toLocaleString()} ج.م</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientCard;
