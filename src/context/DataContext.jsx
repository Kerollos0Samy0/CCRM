import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField
} from 'firebase/firestore';
import initialProducts from '../data/products.json';
import initialClients from '../data/clients.json';
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
  const [orders, setOrders] = useState({});

    // --- OCTOBER WIPE LOGIC ---
    useEffect(() => {
        if (currentUser && !localStorage.getItem('october_wiped_final_6')) {
            console.warn('CHECKING IF DATABASE NEEDS WIPING FOR OCTOBER WORKSHOP...');
            
            const wipeAsync = async () => {
                try {
                    const mainDoc = await getDoc(doc(db, 'crm', 'main'));
                    if (mainDoc.exists() && mainDoc.data().migratedV35) {
                        console.log('Database already wiped by another user.');
                        localStorage.setItem('october_wiped_final_6', 'true');
                        return;
                    }

                    // Reconstruct orders and clients from importedOrders
                    const ordersObj = {};
                    const initialCols = {
                      pending:   { id: 'pending',   title: 'طلبات قيد المراجعة', orderIds: [], color: '#48bb78' },
                      designing: { id: 'designing', title: 'جاري التصميم',          orderIds: [], color: '#f6ad55' },
                      printing:  { id: 'printing',  title: 'في الطباعة',            orderIds: [], color: '#f6e05e' },
                      received:  { id: 'received',  title: 'في التسليم',            orderIds: [], color: '#38b2ac' },
                      ready:     { id: 'ready',     title: 'جاهز ومشحون',   orderIds: [], color: '#ed8936' },
                      shipped:   { id: 'shipped',   title: 'تم الشحن',         orderIds: [], color: '#4299e1' },
                      arrived:   { id: 'arrived',   title: 'مرفوض او ملغي',   orderIds: [], color: '#9f7aea' },
                    };
                    
                    let clientsMap = {};
            let productsMap = {};
            let idCounter = 1;
            
            importedOrders.forEach(o => {
                let orderId = 'order_oct_' + idCounter;
                idCounter++;
                
                let discount = 0;
                if (o.discount) discount = typeof o.discount === 'object' ? (o.discount.result || 0) : o.discount;
                let total = 0;
                if (o.total) total = typeof o.total === 'object' ? (o.total.result || 0) : o.total;
                
                ordersObj[orderId] = {
                    id: orderId,
                    name: o.name || '',
                    gov: o.gov || '',
                    address: o.address || '',
                    social: o.social || '',
                    product: o.product || '',
                    quantity: o.quantity || 1,
                    price: o.price || 0,
                    discount: discount,
                    deposit: o.deposit || 0,
                    depositMethod: o.depositMethod || '',
                    totalAmount: total,
                    status: 'pending',
                    createdAt: o.date ? new Date(o.date).getTime() : Date.now(),
                    updatedAt: Date.now(),
                };
                initialCols.pending.orderIds.push(orderId);
                
                if (o.name && !clientsMap[o.name]) {
                    clientsMap[o.name] = {
                        id: 'client_oct_' + Object.keys(clientsMap).length,
                        name: o.name,
                        governorate: o.gov || '',
                        area: o.address || '',
                        phone: '',
                        church: ''
                    };
                }
                
                if (o.product && !productsMap[o.product]) {
                    productsMap[o.product] = {
                        id: 'prod_oct_' + Object.keys(productsMap).length,
                        name: o.product,
                        type: 'Other',
                        buyPrice: 0,
                        sellPrice: Number(o.price) || 0,
                        stock: 0
                    };
                }
            });
            
            const newClients = Object.values(clientsMap);
            const newProducts = Object.values(productsMap);

                    await setDoc(doc(db, 'crm', 'main'), {
                        orders: ordersObj,
                        columns: initialCols,
                        archivedOrders: [],
                        migratedV35: true
                    });
                    await setDoc(doc(db, 'crm', 'clients'), { clients: newClients });
                    await setDoc(doc(db, 'crm', 'tasks'), { tasks: [] });
                    await setDoc(doc(db, 'crm', 'ledger'), { transactions: [], profitShares: [] });
                    await setDoc(doc(db, 'crm', 'supplies'), { supplies: [] });
                    await setDoc(doc(db, 'crm', 'products'), { products: importedProducts });
                    localStorage.setItem('october_wiped_final_6', 'true');
                    alert('تم مسح البيانات القديمة ورفع بيانات أكتوبر بنجاح! يرجى تحديث الصفحة.');
                    window.location.reload();
                } catch (e) {
                    console.error("Wipe failed:", e);
                }
            };
            wipeAsync();
        }
    }, [currentUser]);
    // --------------------------

  const [columns,        setColumns]        = useState(initialColumns);
  const [columnOrder]                       = useState(['pending','designing','printing','received','ready','shipped','arrived']);
  const [tasks,          setTasks]          = useState({});
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [clients,        setClients]        = useState([]);
  const [products,       setProducts]       = useState([]);
  const [transactions,   setTransactions]   = useState([]);
  const [supplies,       setSupplies]       = useState([]); // New state for Supply Log
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
  const mainRef     = doc(db, 'crm', 'main');       // orders + columns + archived
  const tasksRef    = doc(db, 'crm', 'tasks');
  const clientsRef  = doc(db, 'crm', 'clients');
  const productsRef = doc(db, 'crm', 'products');
  const ledgerRef   = doc(db, 'crm', 'ledger');
  const suppliesRef = doc(db, 'crm', 'supplies');

  // ── helper: load everything from localStorage ─────────────────────────────
  function loadFromLocalStorage() {
    try {
      const lsOrders   = localStorage.getItem('crm_orders');
      const lsCols     = localStorage.getItem('crm_columns');
      const lsArchived = localStorage.getItem('crm_archived_orders');
      const lsTasks    = localStorage.getItem('crm_tasks');
      const lsClients  = localStorage.getItem('crm_clients');
      const lsProducts = localStorage.getItem('crm_products');
      const lsTx       = localStorage.getItem('crm_transactions');
      const lsSupplies = localStorage.getItem('crm_supplies');

      const raw = {
        orders:         lsOrders   ? JSON.parse(lsOrders)   : {},
        columns:        lsCols     ? JSON.parse(lsCols)      : { ...initialColumns },
        archivedOrders: lsArchived ? JSON.parse(lsArchived)  : []
      };
      
      const migrated = applyMigrations(raw);
      setOrders(migrated.orders);
      setColumns(migrated.columns);
      setArchivedOrders(migrated.archivedOrders);

      setTasks(lsTasks    ? JSON.parse(lsTasks)    : {});
      setClients(lsClients  ? JSON.parse(lsClients)  : initialClients);
      setProducts(lsProducts ? JSON.parse(lsProducts) : initialProducts);
      setTransactions(lsTx ? JSON.parse(lsTx) : []);
      setSupplies(lsSupplies ? JSON.parse(lsSupplies) : []);
      console.warn('⚠️ Using localStorage (Firestore unavailable) with migrations applied');
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      // Fallback to empty/initial state + migrations
      const migrated = applyMigrations({ orders: {}, columns: { ...initialColumns }, archivedOrders: [] });
      setOrders(migrated.orders);
      setColumns(migrated.columns);
      setArchivedOrders(migrated.archivedOrders);
      setTasks({});
      setClients(initialClients);
      setProducts(initialProducts);
      setTransactions([]);
      setSupplies([]);
    }
  }

  // ── LOAD FROM FIRESTORE (once on mount) ──────────────────────────────────
  useEffect(() => {
    let unsubMain, unsubTasks, unsubClients, unsubProducts, unsubLedger, unsubSupplies;

    async function bootstrap() {
      try {
        // Fetch all documents from Firestore
        const [mainSnap, tasksSnap, clientsSnap, productsSnap, ledgerSnap, suppliesSnap] = await Promise.all([
            getDoc(mainRef),
            getDoc(tasksRef),
            getDoc(clientsRef),
            getDoc(productsRef),
            getDoc(ledgerRef),
            getDoc(suppliesRef),
        ]);

          // --- MAIN ---
          if (mainSnap.exists()) {
            let data = mainSnap.data();
            
            // Temporary cleanup for specific orders
            if (data.orders) {
               const samuelOrder = Object.values(data.orders).find(o => o.name === 'صمويل الفريد');
               if (samuelOrder) {
                   delete data.orders[samuelOrder.id];
                   Object.keys(data.columns || {}).forEach(colId => {
                     if(data.columns[colId].orderIds) {
                       data.columns[colId].orderIds = data.columns[colId].orderIds.filter(id => id !== samuelOrder.id);
                     }
                   });
                   console.log("Deleted order صمويل الفريد");
               }
            }

            // Emergency Restore: If Firebase is empty but local storage has data, restore it
          const lsOrdersRaw = localStorage.getItem('crm_orders');
          if (lsOrdersRaw && Object.keys(data.orders || {}).length === 0) {
              const parsedLsOrders = JSON.parse(lsOrdersRaw);
              if (Object.keys(parsedLsOrders).length > 0) {
                  const lsCols = localStorage.getItem('crm_columns');
                  const lsArchived = localStorage.getItem('crm_archived_orders');
                  data = {
                      orders: parsedLsOrders,
                      columns: lsCols ? JSON.parse(lsCols) : { ...initialColumns },
                      archivedOrders: lsArchived ? JSON.parse(lsArchived) : []
                  };
                  console.warn('Restored MAIN data from localStorage to Firebase');
              }
          }

          const migrated = applyMigrations(data);
          setOrders(migrated.orders);
          setColumns(migrated.columns);
          setArchivedOrders(migrated.archivedOrders);
          // Historical force save removed
        } else {
          const lsOrders   = localStorage.getItem('crm_orders');
          const lsCols     = localStorage.getItem('crm_columns');
          const lsArchived = localStorage.getItem('crm_archived_orders');
          const raw = {
            orders:         lsOrders   ? JSON.parse(lsOrders)   : {},
            columns:        lsCols     ? JSON.parse(lsCols)      : { ...initialColumns },
            archivedOrders: lsArchived ? JSON.parse(lsArchived)  : [],
          };
          const migrated = applyMigrations(raw);
          setDoc(mainRef, migrated).catch(console.error);
          setOrders(migrated.orders);
          setColumns(migrated.columns);
          setArchivedOrders(migrated.archivedOrders);
        }

        // --- TASKS ---
        if (tasksSnap.exists()) {
          let tData = tasksSnap.data().tasks || {};
          const lsTasksRaw = localStorage.getItem('crm_tasks');
          if (lsTasksRaw && Object.keys(tData).length === 0) {
              const parsedLsTasks = JSON.parse(lsTasksRaw);
              if (Object.keys(parsedLsTasks).length > 0) {
                  tData = parsedLsTasks;
                  setDoc(tasksRef, { tasks: tData }).catch(console.error);
                  console.warn('Restored TASKS from localStorage');
              }
          }
          
          let hasRogueTasks = false;
          Object.keys(tData).forEach(key => {
            const t = tData[key];
            if (t && (t.title?.includes('ديانا عماد') || !t.id)) {
              delete tData[key];
              hasRogueTasks = true;
            }
          });
          if (hasRogueTasks) {
            updateDoc(tasksRef, { tasks: tData }).catch(console.error);
          }
          
          setTasks(tData);
        } else {
          const lsTasks = localStorage.getItem('crm_tasks');
          const t = lsTasks ? JSON.parse(lsTasks) : {};
          
          let hasRogueTasks = false;
          Object.keys(t).forEach(key => {
            const taskObj = t[key];
            if (taskObj && (taskObj.title?.includes('ديانا عماد') || !taskObj.id)) {
              delete t[key];
              hasRogueTasks = true;
            }
          });
          
          setDoc(tasksRef, { tasks: t }).catch(console.error);
          setTasks(t);
        }

        // --- CLIENTS ---
          if (clientsSnap.exists()) {
            setClients(clientsSnap.data().clients || []);
          } else {
            setClients([]);
          }

          // --- PRODUCTS ---
          if (productsSnap.exists()) {
            setProducts(productsSnap.data().products || []);
          } else {
            setProducts([]);
          }

          // --- LEDGER ---
                  
          if (ledgerSnap.exists()) {
            let txData = ledgerSnap.data().transactions || [];
            
            // Wipe transactions if not done yet
            const wiped = localStorage.getItem('wiped_tx_v30');
            if (!wiped) {
               txData = [];
               try {
                 setDoc(ledgerRef, { transactions: [] }).catch(console.error);
               } catch(e) {}
               localStorage.setItem('wiped_tx_v30', 'true');
            }
            
            setTransactions(txData);
            setProfitShares(ledgerSnap.data().profitShares || { workshopDeductions: {}, withdrawals: {} });
          }
 else {
          const lsTx = localStorage.getItem('crm_transactions');
          const tx = lsTx ? JSON.parse(lsTx) : [];
          setDoc(ledgerRef, { transactions: tx }).catch(console.error);
          setTransactions(tx);
        }

        // --- SUPPLIES ---
        if (suppliesSnap.exists()) {
          let sData = suppliesSnap.data().supplies || [];
          const lsSuppliesRaw = localStorage.getItem('crm_supplies');
          if (lsSuppliesRaw && sData.length === 0) {
              const parsedLsSupplies = JSON.parse(lsSuppliesRaw);
              if (parsedLsSupplies.length > 0) {
                  sData = parsedLsSupplies;
                  setDoc(suppliesRef, { supplies: sData }).catch(console.error);
                  console.warn('Restored SUPPLIES from localStorage');
              }
          }
          setSupplies(sData);
        } else {
          const lsSupplies = localStorage.getItem('crm_supplies');
          const s = lsSupplies ? JSON.parse(lsSupplies) : [];
          setDoc(suppliesRef, { supplies: s }).catch(console.error);
          setSupplies(s);
        }

        console.log('✅ Loaded from Firestore');

        // ── REAL-TIME LISTENERS ──────────────────────────────────────────
        unsubMain = onSnapshot(mainRef, snap => {
          if (!snap.exists() || !initialised.current) return;
          const d = snap.data();
          const newState = { orders: d.orders || {}, columns: d.columns || initialColumns, archivedOrders: d.archivedOrders || [] };
          lastSavedState.current = JSON.stringify(newState);
          setOrders(newState.orders);
          setColumns(newState.columns);
          setArchivedOrders(newState.archivedOrders);
        });
        unsubTasks    = onSnapshot(tasksRef,    snap => { if (snap.exists() && initialised.current) setTasks(snap.data().tasks || {}); });
        unsubClients  = onSnapshot(clientsRef,  snap => { if (snap.exists() && initialised.current) setClients(snap.data().clients || []); });
        unsubProducts = onSnapshot(productsRef, snap => { if (snap.exists() && initialised.current) setProducts(snap.data().products || []); });
        unsubLedger   = onSnapshot(ledgerRef,   snap => { 
          if (snap.exists() && initialised.current) {
            setTransactions(snap.data().transactions || []);
            setProfitShares(snap.data().profitShares || { workshopDeductions: {}, withdrawals: {} });
          }
        });
        unsubSupplies = onSnapshot(suppliesRef, snap => { if (snap.exists() && initialised.current) setSupplies(snap.data().supplies || []); });

      } catch (err) {
        console.error('Firestore unavailable, using localStorage:', err.message);
        if (!initialised.current) loadFromLocalStorage();
      } finally {
        initialised.current = true;
        setLoading(false);
      }
    }

    bootstrap();

    return () => {
      unsubMain?.();
      unsubTasks?.();
      unsubClients?.();
      unsubProducts?.();
      unsubLedger?.();
      unsubSupplies?.();
    };
  }, []); // eslint-disable-line

  // ── SAVE TO FIRESTORE (debounced, only after first load) ─────────────────
  useEffect(() => {
    if (!initialised.current) return;
    
    const currentStateString = JSON.stringify({ orders, columns, archivedOrders });
    if (lastSavedState.current === currentStateString) {
      return; // Skip saving if data matches the last state (prevents infinite loop)
    }

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastSavedState.current = currentStateString;
      const cleanData = JSON.parse(JSON.stringify({ orders, columns, archivedOrders }));
      // 1. Update main document
      updateDoc(mainRef, cleanData).catch(console.error);

      // 2. Automatic Hourly Backup (creates one snapshot per hour)
      try {
        const d = new Date();
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const hourStr = d.getHours().toString().padStart(2, '0');
        const backupId = `backup_${dateStr}_${hourStr}`;
        const backupRef = doc(db, 'crm_backups', backupId);
        // We use setDoc to create/overwrite the hourly snapshot
        setDoc(backupRef, cleanData).catch(e => console.error('Backup failed:', e));
      } catch (err) {
        console.error('Backup error:', err);
      }
    }, 800);
  }, [orders, columns, archivedOrders]); // eslint-disable-line

  useEffect(() => { if (initialised.current) setDoc(tasksRef,    { tasks: JSON.parse(JSON.stringify(tasks)) }).catch(console.error); }, [tasks]);       // eslint-disable-line
  useEffect(() => { if (initialised.current) setDoc(clientsRef,  { clients },      { merge: true }).catch(console.error); }, [clients]);     // eslint-disable-line
  useEffect(() => { if (initialised.current) setDoc(productsRef, { products },     { merge: true }).catch(console.error); }, [products]);    // eslint-disable-line
  useEffect(() => { if (initialised.current) setDoc(ledgerRef,   { transactions }, { merge: true }).catch(console.error); }, [transactions]);// eslint-disable-line
  useEffect(() => { if (initialised.current) setDoc(suppliesRef, { supplies },     { merge: true }).catch(console.error); }, [supplies]);    // eslint-disable-line

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
  const addClient    = (data)            => setClients(prev => [...prev, { id: uuidv4(), ...data }]);
  const updateClient = (id, fields)      => setClients(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  const deleteClient = (id)              => setClients(prev => prev.filter(c => c.id !== id));

  // ── PRODUCTS & SUPPLIES ──────────────────────────────────────────────────
  const addProduct    = (data)       => setProducts(prev => [...prev, { id: uuidv4(), ...data, stock: Number(data.stock)||0, buyPrice: Number(data.buyPrice)||0, sellPrice: Number(data.sellPrice)||0 }]);
  const updateProduct = (id, fields) => setProducts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  const addSupply = (productId, quantity, details) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: (Number(p.stock) || 0) + Number(quantity) };
      }
      return p;
    }));
    setSupplies(prev => [{
      id: uuidv4(),
      productId,
      productName: details.productName || 'Unknown Product',
      quantity: Number(quantity),
      date: new Date().toISOString(),
      suppliedBy: currentUser.id,
      supplierName: currentUser.name || currentUser.id,
      notes: details.notes || ''
    }, ...prev]);
  };

  // ── LEDGER ───────────────────────────────────────────────────────────────
  const addTransaction    = (data) => setTransactions(prev => [...prev, { id: uuidv4(), ...data, date: new Date().toISOString(), amount: Number(data.amount)||0 }]);
  const deleteTransaction = (id)   => setTransactions(prev => prev.filter(t => t.id !== id));

  // ── ORDERS ───────────────────────────────────────────────────────────────
  const addOrder = (orderData) => {
    const id = uuidv4();
    const newOrder = { id, ...orderData, createdBy: currentUser.id, createdAt: new Date().toISOString(), notes: [] };
    setOrders(prev => ({ ...prev, [id]: newOrder }));
    setColumns(prev => ({ ...prev, pending: { ...prev.pending, orderIds: [id, ...prev.pending.orderIds] } }));
    if (orderData.items?.length > 0) {
      setProducts(prev => {
        let np = [...prev];
        orderData.items.forEach(item => {
          const idx = np.findIndex(p => p.name === item.workshop);
          if (idx !== -1 && item.quantity) np[idx] = { ...np[idx], stock: np[idx].stock - Number(item.quantity) };
        });
        return np;
      });
    }
  };

  const updateOrder = (id, updatedData) => setOrders(prev => ({ ...prev, [id]: { ...prev[id], ...updatedData } }));

  const addNote = (orderId, text) => {
    setOrders(prev => {
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
    const newOrders = { ...orders }; delete newOrders[orderId]; setOrders(newOrders);
    setColumns(prev => {
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
      setColumns(prev => ({ ...prev, [start.id]: { ...start, orderIds: ids } }));
      return;
    }
      const startIds = start.orderIds.filter(id => orders[id] && id !== orderId);
      const finishIds = finish.orderIds.filter(id => orders[id] && id !== orderId);
      finishIds.splice(destinationIndex, 0, orderId);
      
      setOrders(prev => ({ ...prev, [orderId]: { ...prev[orderId], status: destinationColId } }));

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

    setColumns(prev => ({ ...prev, [start.id]: { ...start, orderIds: startIds }, [finish.id]: { ...finish, orderIds: finishIds } }));
  };

  const archiveOrder = (orderId) => {
    const orderToArchive = orders[orderId];
    if (!orderToArchive) return;
    setArchivedOrders(prev => [{ ...orderToArchive, archivedAt: new Date().toISOString() }, ...prev]);
    const newOrders = { ...orders }; delete newOrders[orderId]; setOrders(newOrders);
    setColumns(prev => {
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
      orders, columns, columnOrder, archivedOrders,
      tasks, addTask, updateTaskStatus, deleteTask,
      clients, addClient, updateClient, deleteClient,
      products, addProduct, updateProduct, replaceProducts,
      transactions, addTransaction, deleteTransaction,
      supplies, addSupply,
      profitShares, updateProfitShares,
      addOrder, updateOrder, deleteOrder, moveOrder, addNote, archiveOrder,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
