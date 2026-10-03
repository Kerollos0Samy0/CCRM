import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField
} from 'firebase/firestore';


import importedClients from '../data/imported_clients.json';
import importedProducts from '../data/imported_products.json';
import importedOrders from '../data/imported_orders.json';


const DataContext = createContext();

const initialColumns = {
  pending:   { id: 'pending',   title: 'مطلوبة ولسه متحضرتش', orderIds: [], color: '#48bb78' },
  designing: { id: 'designing', title: 'جاري التصميم',          orderIds: [], color: '#f6ad55' },
  printing:  { id: 'printing',  title: 'في الطباعة',            orderIds: [], color: '#f6e05e' },
  received:  { id: 'received',  title: 'في الكنيسة',            orderIds: [], color: '#38b2ac' },
  ready:     { id: 'ready',     title: 'جاهزة وعايزة تتشحن',   orderIds: [], color: '#ed8936' },
  shipped:   { id: 'shipped',   title: 'في شركة الشحن',         orderIds: [], color: '#4299e1' },
  arrived:   { id: 'arrived',   title: 'أوردرات وصلت بنجاح',   orderIds: [], color: '#9f7aea' },
};

// ── helpers ─────────────────────────────────────────────────────────────────
function normalizeOrder(o) {
  if (!o.items) {
    o.items = o.workshop ? [{ workshop: o.workshop, quantity: o.quantity }] : [];
  }
  if (o.clientName && !o.name)       o.name        = o.clientName;
  if (o.phone !== undefined && !o.mobile) o.mobile  = String(o.phone);
  if (o.government && !o.governorate) o.governorate = o.government;
  if (o.gov && !o.governorate) o.governorate = o.gov;
  if (typeof o.notes === 'string') { o.orderNotes = o.notes; o.notes = []; }
  if (!Array.isArray(o.notes)) o.notes = [];
  if (o.items) {
    let total = 0;
    o.items.forEach(item => {
      if (item.name && !item.workshop)       item.workshop  = item.name;
      if (item.sellPrice !== undefined && item.unitPrice === undefined) item.unitPrice = item.sellPrice;
      if (item.price !== undefined && item.unitPrice === undefined) item.unitPrice = Number(item.price) || 0;
      total += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
    });
    if (o.totalAmount === undefined) o.totalAmount = total;
  }
  if (o.remainingAmount === undefined)
    o.remainingAmount = Math.max(0, (o.totalAmount || 0) - (Number(o.discount) || 0) - (Number(o.paidAmount) || 0));
  return o;
}

// Run all data-migrations that were previously done against localStorage.
// Returns { orders, columns, archivedOrders } ready to save to Firestore.
function applyMigrations(rawData) {
  // Historical migrations removed to prevent data reversion!
  return {
    orders: rawData.orders || {},
    columns: rawData.columns || {},
    archivedOrders: rawData.archivedOrders || [],
    migratedV35: true
  };
}

function mergeClientsWithChat(currentClients) {
  const merged = [...currentClients];
  chatClients.forEach(chatClient => {
    const existing = merged.find(c =>
      (c.name && chatClient.name && c.name.trim() === chatClient.name.trim()) ||
      (c.phone && chatClient.phone && c.phone === chatClient.phone)
    );
    if (existing) {
      if (!existing.phone       && chatClient.phone)       existing.phone       = chatClient.phone;
      if (!existing.church      && chatClient.church)      existing.church      = chatClient.church;
      if (!existing.address     && chatClient.address)     existing.address     = chatClient.address;
      if (!existing.governorate && chatClient.governorate) existing.governorate = chatClient.governorate;
    } else {
      merged.push({ id: uuidv4(), ...chatClient });
    }
  });
  return merged;
}

// ── Provider ────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [loading,        setLoading]        = useState(true);
  

    

  
  
  const [tasks,          setTasks]          = useState({});
  
  
  
  const [transactions,   setTransactions]   = useState([]);
  
  const [profitShares,   setProfitShares]   = useState({ workshopDeductions: {}, withdrawals: {} });

  const updateProfitShares = (newProfitShares) => {
    setProfitShares(newProfitShares);
    setDoc(doc(db, 'crm', 'ledger'), { profitShares: newProfitShares }, { merge: true }).catch(console.error);
  };

  // track whether initial load from Firestore is done
  const initialised = useRef(false);
  // debounce timer refs
  const saveTimer = useRef(null);
  const lastSavedState = useRef('');

  // ── FIRESTORE DOCUMENT REFS ───────────────────────────────────────────────
  // const mainRef     = doc(db, 'crm', 'main');
  const tasksRef    = doc(db, 'crm', 'tasks');
  // const clientsRef  = doc(db, 'crm', 'clients');
  // const productsRef = doc(db, 'crm', 'products');
  const ledgerRef   = doc(db, 'crm', 'ledger');
  // const suppliesRef = doc(db, 'crm', 'supplies');

  // ── helper: load everything from localStorage ─────────────────────────────
  function loadFromLocalStorage() {
    try {
      const lsOrders   = localStorage.getItem('crm_orders');
      const lsCols     = localStorage.getItem('crm_columns');
      const lsArchived = localStorage.getItem('crm_archived_orders');
      const lsTasks    = localStorage.getItem('crm_tasks');
      
      
      const lsTx       = localStorage.getItem('crm_transactions');
      

      const raw = {
        orders:         lsOrders   ? JSON.parse(lsOrders)   : {},
        columns:        lsCols     ? JSON.parse(lsCols)      : { ...initialColumns },
        archivedOrders: lsArchived ? JSON.parse(lsArchived)  : []
      };
      
      const migrated = applyMigrations(raw);
      // setOrders(migrated.orders);
      // setColumns(migrated.columns);
      // setArchivedOrders(migrated.archivedOrders);

      setTasks(lsTasks    ? JSON.parse(lsTasks)    : {});
      
      
      setTransactions(lsTx ? JSON.parse(lsTx) : []);
      
      console.warn('⚠️ Using localStorage (Firestore unavailable) with migrations applied');
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      // Fallback to empty/initial state + migrations
      const migrated = applyMigrations({ orders: {}, columns: { ...initialColumns }, archivedOrders: [] });
      // setOrders(migrated.orders);
      // setColumns(migrated.columns);
      // setArchivedOrders(migrated.archivedOrders);
      setTasks({});
      
      
      setTransactions([]);
      
    }
  }

  // ── LOAD FROM FIRESTORE (once on mount) ──────────────────────────────────
  

  useEffect(() => { if (initialised.current) setDoc(tasksRef,    { tasks: JSON.parse(JSON.stringify(tasks)) }).catch(console.error); }, [tasks]);       // eslint-disable-line
  
  
  useEffect(() => { if (initialised.current) setDoc(ledgerRef,   { transactions }, { merge: true }).catch(console.error); }, [transactions]);// eslint-disable-line
  

  useEffect(() => { 
      if (initialised.current) {
         const done = localStorage.getItem('migrated_historical_tx_2');
         if (!done && transactions.length > 0) {
             const manualExpenses = [
                { id: 'hist-1', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'admin', amount: 1000, supplier: 'مصاريف إدارية (مستوردة)' },
                { id: 'hist-2', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'products', amount: 4570, supplier: 'مصاريف المخزن (مستوردة)' },
                { id: 'hist-3', date: '2026-03-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 2400, supplier: 'مصاريف الورشة (مستوردة)' },
                
                { id: 'hist-4', date: '2026-04-28T12:00:00Z', type: 'debt', category: 'admin', amount: 3000, supplier: 'مصاريف إدارية (مستوردة)' },
                { id: 'hist-5', date: '2026-04-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 750, supplier: 'مصاريف الورشة (مستوردة)' },
                
                { id: 'hist-6', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'admin', amount: 1500, supplier: 'مصاريف إدارية (مستوردة)' },
                { id: 'hist-7', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'products', amount: 1200, supplier: 'مصاريف المخزن (مستوردة)' },
                { id: 'hist-8', date: '2026-05-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 750, supplier: 'مصاريف الورشة (مستوردة)' },
                
                { id: 'hist-9', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'admin', amount: 3750, supplier: 'مصاريف إدارية (مستوردة)' },
                { id: 'hist-10', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'products', amount: 4568, supplier: 'مصاريف المخزن (مستوردة)' },
                { id: 'hist-11', date: '2026-06-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 5375, supplier: 'مصاريف الورشة (مستوردة)' },
                
                { id: 'hist-12', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'admin', amount: 14500, supplier: 'مصاريف إدارية (مستوردة)' },
                { id: 'hist-13', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'products', amount: 6231, supplier: 'مصاريف المخزن (مستوردة)' },
                { id: 'hist-14', date: '2026-07-28T12:00:00Z', type: 'debt', category: 'workshop', amount: 6543, supplier: 'مصاريف الورشة (مستوردة)' }
             ];
             setTransactions(prev => {
                if (prev.some(t => t.id && t.id.startsWith('hist-'))) return prev;
                return [...prev, ...manualExpenses];
             });
             localStorage.setItem('migrated_historical_tx_2', 'true');
         }
      }
    }, [transactions.length, initialised.current]); // trigger when transactions load

  // ── TASKS ────────────────────────────────────────────────────────────────
  const addTask = (taskData) => {
    const id = uuidv4();
    const newTask = { id, ...taskData, assignerId: currentUser.id, status: 'todo', createdAt: new Date().toISOString() };
    setTasks(prev => ({ ...prev, [id]: newTask }));
  };
  const updateTaskStatus = (taskId, newStatus) => setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: newStatus } }));
  const deleteTask = (taskId) => {
    setTasks(prev => { const t = { ...prev }; delete t[taskId]; return t; });
    updateDoc(tasksRef, { [`tasks.${taskId}`]: deleteField() }).catch(console.error);
  };

  // ── CLIENTS ──────────────────────────────────────────────────────────────
  
  
  const replaceClients = async (newClients) => {
    try {
      await setDoc(doc(db, 'crm', 'clients'), { clients: newClients });
      setClients(newClients);
    } catch (e) {
      console.error('Failed to replace clients:', e);
    }
  };

  
  

  // ── PRODUCTS & SUPPLIES ──────────────────────────────────────────────────
  const addProduct    = (data)       => setProducts(prev => [...prev, { id: uuidv4(), ...data, stock: Number(data.stock)||0, buyPrice: Number(data.buyPrice)||0, sellPrice: Number(data.sellPrice)||0 }]);
  
  const replaceProducts = async (newProducts) => {
    try {
      await setDoc(doc(db, 'crm', 'products'), { products: newProducts });
      setProducts(newProducts);
    } catch (e) {
      console.error('Failed to replace products:', e); // ignored
    }
  };

  
  
        return np;
      });
    }
  };

  const updateOrder = (id, updatedData) => // setOrders(prev => ({ ...prev, [id]: { ...prev[id], ...updatedData } }));

  const addNote = (orderId, text) => {
    // setOrders(prev => {
      const order = prev[orderId];
      const newNote = { id: uuidv4(), text, createdBy: currentUser.name, timestamp: new Date().toISOString() };
      return { ...prev, [orderId]: { ...order, notes: [...order.notes, newNote] } };
    });
  };

  const deleteOrder = (orderId) => {
    const orderToDelete = orders[orderId];
    if (orderToDelete?.items?.length > 0) {
      setProducts(prev => {
        let np = [...prev];
        orderToDelete.items.forEach(item => {
          const idx = np.findIndex(p => p.name === item.workshop);
          if (idx !== -1 && item.quantity) np[idx] = { ...np[idx], stock: np[idx].stock + Number(item.quantity) };
        });
        return np;
      });
    }
    const newOrders = { ...orders }; delete newOrders[orderId]; // setOrders(newOrders);
    // setColumns(prev => {
      const nc = { ...prev };
      for (const colId in nc) nc[colId] = { ...nc[colId], orderIds: nc[colId].orderIds.filter(id => id !== orderId) };
      return nc;
    });
  };

  const moveOrder = (sourceColId, destinationColId, sourceIndex, destinationIndex, orderId) => {
    const start  = columns[sourceColId];
    const finish = columns[destinationColId];
    if (start === finish) {
      const ids = start.orderIds.filter(id => orders[id] && id !== orderId);
      ids.splice(destinationIndex, 0, orderId);
      // setColumns(prev => ({ ...prev, [start.id]: { ...start, orderIds: ids } }));
      return;
    }
      const startIds = start.orderIds.filter(id => orders[id] && id !== orderId);
      const finishIds = finish.orderIds.filter(id => orders[id] && id !== orderId);
      finishIds.splice(destinationIndex, 0, orderId);
      
      // setOrders(prev => ({ ...prev, [orderId]: { ...prev[orderId], status: destinationColId } }));

            if (destinationColId === 'designing' && sourceColId !== 'designing') {
      const movedOrder = orders[orderId];
      if (movedOrder) addTask({ title: `تصميم أوردر: ${movedOrder.name}`, description: `برجاء عمل التصميم الخاص بأوردر العميل (${movedOrder.name}) - كنيسة: ${movedOrder.church}`, assigneeId: 'kirolos' });
    }

    if (destinationColId === 'ready' && sourceColId !== 'ready') {
      const movedOrder = orders[orderId];
      if (movedOrder) {
        fetch('https://crm-29ah.onrender.com/api/shipping/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movedOrder)
        }).then(res => res.json()).then(data => {
          if (data.success) {
            alert('تم تسجيل الأوردر بنجاح في شركة الشحن!');
          } else {
            alert('فشل تسجيل الأوردر في شركة الشحن: ' + (data.error || 'خطأ مجهول'));
          }
        }).catch(err => {
          console.error('Error sending order to shipping system:', err);
          alert('حدث خطأ أثناء الاتصال بسيرفر الشحن. يرجى التأكد من تشغيله.');
        });
      }
    }

    // setColumns(prev => ({ ...prev, [start.id]: { ...start, orderIds: startIds }, [finish.id]: { ...finish, orderIds: finishIds } }));
  };

  const archiveOrder = (orderId) => {
    const orderToArchive = orders[orderId];
    if (!orderToArchive) return;
    // setArchivedOrders(prev => [{ ...orderToArchive, archivedAt: new Date().toISOString() }, ...prev]);
    const newOrders = { ...orders }; delete newOrders[orderId]; // setOrders(newOrders);
    // setColumns(prev => {
      const nc = { ...prev };
      for (const colId in nc) nc[colId] = { ...nc[colId], orderIds: nc[colId].orderIds.filter(id => id !== orderId) };
      return nc;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: 'Cairo, sans-serif', color: '#475569', fontSize: '1rem' }}>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      
      tasks, addTask, updateTaskStatus, deleteTask,
      
      
      transactions, addTransaction, deleteTransaction,
      
      profitShares, updateProfitShares,
      
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
