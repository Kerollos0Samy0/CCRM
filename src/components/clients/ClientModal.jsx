import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ClientModal = ({ isOpen, onClose, editingClient, formData, handleChange, handleSubmit }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            onClick={onClose}
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
              <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="input-field" placeholder="اسم العميل" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>رقم الموبايل</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" placeholder="01..." dir="ltr" style={{ textAlign: 'right' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>الكنيسة</label>
                <input type="text" name="church" value={formData.church || ''} onChange={handleChange} className="input-field" placeholder="اسم الكنيسة" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>المحافظة</label>
                <input type="text" name="governorate" value={formData.governorate || ''} onChange={handleChange} className="input-field" placeholder="مثال: القاهرة" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>العنوان</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="input-field" placeholder="العنوان بالتفصيل" />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
              <button type="submit" className="btn btn-primary">{editingClient ? 'حفظ التعديلات' : 'إضافة العميل'}</button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClientModal;
