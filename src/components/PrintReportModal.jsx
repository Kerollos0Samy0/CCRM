import React, { useMemo } from 'react';
import { useOrders } from '../context/OrdersContext';
import { useData } from '../context/DataContext';

const PrintReportModal = ({ isOpen, onClose }) => {
  const {    } = useData();
  const { orders, archivedOrders, columns, columnOrder, addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder } = useOrders();

  const requiredItems = useMemo(() => {
    let itemsMap = {};
    
    // We only aggregate items from the 'pending' column (مطلوبة ولسه متحضرتش)
    // Feel free to add 'designing' or 'printing' if needed later.
    const pendingCols = ['pending'];
    
    pendingCols.forEach(colId => {
      const col = columns[colId];
      if (col && col.orderIds) {
        col.orderIds.forEach(orderId => {
          const order = orders[orderId];
          if (order && order.items) {
            order.items.forEach(item => {
              const name = item.name || item.workshop || 'منتج غير معروف';
              const qty = Number(item.quantity) || 1;
              if (!itemsMap[name]) itemsMap[name] = 0;
              itemsMap[name] += qty;
            });
          }
        });
      }
    });

    return Object.entries(itemsMap).sort((a, b) => b[1] - a[1]);
  }, [orders, columns]);

  const handleSendWhatsApp = () => {
    let message = '*طلبات المطبعة / الورشة الجديدة:* 🖨️\n\n';
    if (requiredItems.length === 0) {
      message += 'لا يوجد طلبات حالياً.';
    } else {
      requiredItems.forEach(([name, qty]) => {
        message += `- ${name}: ${qty}\n`;
      });
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🖨️ تقرير المطبعة (المطلوب تحضيره)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {requiredItems.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              لا يوجد أي منتجات مطلوبة في الوقت الحالي.
            </div>
          ) : (
            <div className="space-y-3">
              {requiredItems.map(([name, qty], index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="font-semibold text-slate-700">{name}</span>
                  <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">
                    الكمية: {qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
          >
            إغلاق
          </button>
          
          <button
            onClick={handleSendWhatsApp}
            disabled={requiredItems.length === 0}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            إرسال واتساب
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReportModal;
