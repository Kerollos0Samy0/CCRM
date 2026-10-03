import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';
import { Plus, MessageCircle, MapPin, Calendar, Hash, Download, List, LayoutGrid, Search } from 'lucide-react';
import OrderModal from '../components/OrderModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import PrintReportModal from '../components/PrintReportModal';
const Dashboard = () => {
  const { users } = useAuth();
  const {      } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Prevent dragging incomplete orders to shipping
    if (destination.droppableId === 'shipping') {
      const order = orders[draggableId];
      if (order && order.hasMissingItems) {
        window.alert(`لا يمكن شحن هذا الأوردر، يوجد نواقص:\n${order.missingNotes || 'غير محدد'}`);
        return;
      }
    }

    moveOrder(source.droppableId, destination.droppableId, source.index, destination.index, draggableId);
  };

  const getUserColor = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.color : 'var(--border-color)';
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "اسم العميل,رقم التليفون,الكنيسة,المحافظة,الحالة,تاريخ التسليم,المنتجات,الإجمالي,الملاحظات\n";
    
    columnOrder.forEach(colId => {
      const column = columns[colId];
      if (!column) return;
      column.orderIds.forEach(orderId => {
        const order = orders[orderId];
        if (!order) return;
        const items = order.items?.map(i => `${i.workshop} (${i.quantity})`).join(' - ') || 'لا يوجد';
        const notes = order.notes?.map(n => n.text).join(' | ') || '';
        const row = [
          `"${order.name || ''}"`,
          `"${order.mobile || ''}"`,
          `"${order.church || ''}"`,
          `"${order.governorate || ''}"`,
          `"${column.title}"`,
          `"${order.deadline || ''}"`,
          `"${items}"`,
          `"${order.totalAmount || 0}"`,
          `"${notes}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const renderColumn = (columnId) => {
    const column = columns[columnId];
    if (!column) return null;
    const columnOrders = column.orderIds
      .map(orderId => orders[orderId])
      .filter(order => {
        if (!order) return false;
        if (searchQuery && !order.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });

    return (
      <div key={column.id} className="kanban-column">
        <div className="glass-panel" style={{ 
          padding: '16px',
          borderTop: `4px solid ${column.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="heading-md" style={{ fontSize: '1.2rem' }}>{column.title}</h3>
            <div style={{ 
              background: 'var(--bg-primary)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold' }}>{columnOrders.length} أوردر</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {columnOrders.reduce((sum, o) => sum + (o.items?.length || 1), 0)} منتج
              </span>
            </div>
          </div>
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                flex: 1,
                minHeight: '200px',
                background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'background 0.2s ease'
              }}
            >
              {columnOrders.map((order, index) => (
                <Draggable key={order.id} draggableId={order.id} index={index} isDragDisabled={!!searchQuery}>
                  {(provided, snapshot) => {
                    const creatorColor = getUserColor(order.createdBy);
                    
                    const statusCounts = order.items?.reduce((acc, item) => {
                      const s = item.status || 'new';
                      acc[s] = (acc[s] || 0) + 1;
                      return acc;
                    }, {}) || {};

                    // Compute total order items string
                    const itemsString = order.items?.map(i => `${i.workshop} (${i.quantity})`).join(' - ') || '';

                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="card"
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          borderRight: `4px solid ${creatorColor}`,
                          ...provided.draggableProps.style,
                          boxShadow: snapshot.isDragging ? 'var(--shadow-glass)' : 'none',
                        }}
                      >
                        <div style={{ marginBottom: '12px' }}>
                          <select 
                            className="input-field" 
                            style={{ padding: '4px 8px', minHeight: '28px', width: '100%', fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            value={columnId}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newColId = e.target.value;
                              if (newColId === columnId) return;
                              
                              if (newColId === 'shipping' && order.hasMissingItems) {
                                window.alert(`لا يمكن نقل الطلب للجاهزية لوجود نواقص:\n${order.missingNotes || 'نواقص غير محددة'}`);
                                return;
                              }
                              
                              const destIndex = columns[newColId].orderIds.length;
                              const sourceIndex = 0;
                              moveOrder(columnId, newColId, sourceIndex, destIndex, order.id);
                            }}
                          >
                            {columnOrder.map(cId => (
                              <option key={cId} value={cId}>نقل إلى: {columns[cId].title}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{order.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {order.church}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {statusCounts['new'] > 0 && <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px' }}>🆕 {statusCounts['new']} جديد</span>}
                          {statusCounts['design'] > 0 && <span style={{ background: 'var(--color-kirolos-light)', color: 'var(--color-kirolos)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>🎨 {statusCounts['design']} تصميم</span>}
                          {statusCounts['printing'] > 0 && <span style={{ background: 'var(--state-printing)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>🖨️ {statusCounts['printing']} مطبعة</span>}
                          {statusCounts['ready'] > 0 && <span style={{ background: 'var(--state-church)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>✅ {statusCounts['ready']} جاهز</span>}
                        </div>

                        {order.hasMissingItems && (
                          <div style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--color-marina)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ⚠️ يوجد نواقص: {order.missingNotes}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <MapPin size={14} />
                            <span>{order.governorate || ''} {order.region ? `- ${order.region}` : ''}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Hash size={14} style={{ marginTop: '3px' }} />
                            <span style={{ flex: 1 }}>{itemsString || 'لا يوجد منتجات'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Calendar size={14} />
                            <span>دخول: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '-'} | تسليم: {order.deadline}</span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <MessageCircle size={14} />
                            <span>{order.notes?.length || 0}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: creatorColor }}>
                            {users.find(u => u.id === order.createdBy)?.name}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <>
      <div className="dashboard-controls">
        <div className="dashboard-controls-group">
          <button 
            className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={18} />
            عرض اللوحة
          </button>
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
            عرض القائمة
          </button>
        </div>
        <div className="dashboard-controls-group" style={{ flex: 1, position: 'relative', maxWidth: '400px', minWidth: '200px' }}>
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
        <div className="dashboard-controls-group">
          <button 
            className="btn btn-secondary" 
            onClick={exportToCSV}
            style={{ backgroundColor: 'var(--color-mira)', color: 'white', border: 'none' }}
          >
            <Download size={18} />
            تصدير شيت (Excel)
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsPrintModalOpen(true)}
            style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
          >
            🖨️ طلبات المطبعة
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            إضافة أوردر
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          <DragDropContext onDragEnd={onDragEnd}>
            
            <div style={{ display: 'flex', padding: '24px 0' }}>
              {renderColumn(columnOrder[0])}
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: 'var(--bg-secondary)', 
              padding: '24px', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color)',
              gap: '16px'
            }} className="kanban-prep-container">
              <h2 className="heading-md" style={{ textAlign: 'center', color: 'var(--text-primary)', borderBottom: '2px dashed var(--border-color)', paddingBottom: '12px', margin: '0 24px' }}>في التحضير</h2>
              <div style={{ display: 'flex', gap: '24px' }}>
                {columnOrder.slice(1, 4).map(renderColumn)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', padding: '24px 0' }}>
              {columnOrder.slice(4).map(renderColumn)}
            </div>

          </DragDropContext>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الأوردر / العميل</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الكنيسة</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المُنشئ</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>الحالة</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>تسليم</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>المنتجات</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>تغيير المرحلة</th>
              </tr>
            </thead>
            <tbody>
              {columnOrder.map(colId => {
                const column = columns[colId];
                if (!column) return null;
                return column.orderIds.map(orderId => {
                  const order = orders[orderId];
                  if (!order) return null;
                  if (searchQuery && !order.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;

                  const itemsString = order.items?.map(i => `${i.workshop} (${i.quantity})`).join('، ') || '-';
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-mira)' }} onClick={() => setSelectedOrder(order)}>
                        {order.name}
                        {order.hasMissingItems && <div style={{ fontSize: '0.8rem', color: 'var(--color-marina)', marginTop: '4px' }}>⚠️ {order.missingNotes}</div>}
                      </td>
                      <td style={{ padding: '16px' }}>{order.church}</td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{users.find(u => u.id === order.createdBy)?.name || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="tag" style={{ backgroundColor: column.color, color: 'white', fontWeight: 'bold' }}>{column.title}</span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{order.deadline}</td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{itemsString}</td>
                      <td style={{ padding: '16px' }}>
                        <select 
                          className="input-field" 
                          style={{ padding: '4px 8px', minHeight: '32px', width: 'auto' }}
                          value={colId}
                          onChange={(e) => {
                            const newColId = e.target.value;
                            if (newColId === colId) return;
                            
                            if (newColId === 'shipping' && order.hasMissingItems) {
                              window.alert(`لا يمكن شحن هذا الأوردر، يوجد نواقص:\n${order.missingNotes || 'غير محدد'}`);
                              return;
                            }
                            
                            const destIndex = columns[newColId].orderIds.length;
                            const sourceIndex = columns[colId].orderIds.indexOf(order.id);
                            moveOrder(colId, newColId, sourceIndex, destIndex, order.id);
                          }}
                        >
                          {columnOrder.map(cId => (
                            <option key={cId} value={cId}>{columns[cId].title}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}


      {isAddModalOpen && <OrderModal onClose={() => setIsAddModalOpen(false)} />}
      {isPrintModalOpen && <PrintReportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} />}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          isDelivered={selectedOrder.status === 'arrived'} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
};

export default Dashboard;
