import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const initialColumns = {
  pending:   { id: 'pending',   title: 'قيد المراجعة', orderIds: [], color: '#48bb78' },
  designing: { id: 'designing', title: 'جاري التصميم', orderIds: [], color: '#f6ad55' },
  printing:  { id: 'printing',  title: 'في الطباعة',   orderIds: [], color: '#f6e05e' },
  received:  { id: 'received',  title: 'في التفنيش',   orderIds: [], color: '#38b2ac' },
  ready:     { id: 'ready',     title: 'جاهز للتسليم', orderIds: [], color: '#ed8936' },
  shipped:   { id: 'shipped',   title: 'في الشحن',     orderIds: [], color: '#4299e1' },
  arrived:   { id: 'arrived',   title: 'مستلم',        orderIds: [], color: '#9f7aea' },
};

const OrdersContext = createContext();

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState({});
  const [columns, setColumns] = useState(initialColumns);
  const [columnOrder] = useState(['pending','designing','printing','received','ready','shipped','arrived']);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  const initialised = useRef(false);
  const lastSavedState = useRef('');

  useEffect(() => {
    initialised.current = true;
    const mainRef = doc(db, 'crm', 'main');
    let unsubMain;

    const bootstrap = async () => {
      try {
        const mainSnap = await getDoc(mainRef);
        if (mainSnap.exists()) {
          const d = mainSnap.data();
          setOrders(d.orders || {});
          setColumns(d.columns || initialColumns);
          setArchivedOrders(d.archivedOrders || []);
        } else {
          setOrders({});
          setColumns(initialColumns);
          setArchivedOrders([]);
        }

        unsubMain = onSnapshot(mainRef, snap => {
          if (snap.exists() && initialised.current) {
            const d = snap.data();
            const source = snap.metadata.hasPendingWrites ? 'local' : 'server';
            if (source === 'server') {
              setOrders(d.orders || {});
              setColumns(d.columns || initialColumns);
              setArchivedOrders(d.archivedOrders || []);
            }
          }
        });
      } catch (err) {
        console.error("Error bootstrapping orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    bootstrap();

    return () => {
      initialised.current = false;
      if (unsubMain) unsubMain();
    };
  }, []);

  // Save changes automatically
  useEffect(() => {
    if (!initialised.current) return;
    const currentStateString = JSON.stringify({ orders, columns, archivedOrders });
    if (currentStateString === lastSavedState.current) return;
    
    const timeout = setTimeout(() => {
      const cleanData = JSON.parse(JSON.stringify({ orders, columns, archivedOrders }));
      setDoc(doc(db, 'crm', 'main'), cleanData, { merge: true }).catch(console.error);
      lastSavedState.current = currentStateString;
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [orders, columns, archivedOrders]);

  const addOrder = (orderData) => {
    const id = uuidv4();
    const newOrder = { 
      id, 
      date: new Date().toISOString(),
      status: 'pending',
      items: [], 
      notes: [],
      payments: [],
      ...orderData 
    };
    
    setOrders(prev => ({ ...prev, [id]: newOrder }));
    setColumns(prev => {
      const pendingCol = prev['pending'];
      return {
        ...prev,
        'pending': { ...pendingCol, orderIds: [id, ...pendingCol.orderIds] }
      };
    });
  };

  const updateOrder = (id, updatedData) => {
    setOrders(prev => ({ ...prev, [id]: { ...prev[id], ...updatedData } }));
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[orderId];
      return newOrders;
    });
    setColumns(prev => {
      const newCols = { ...prev };
      Object.keys(newCols).forEach(colId => {
        if (newCols[colId].orderIds.includes(orderId)) {
          newCols[colId] = {
            ...newCols[colId],
            orderIds: newCols[colId].orderIds.filter(id => id !== orderId)
          };
        }
      });
      return newCols;
    });
  };

  const moveOrder = (orderId, sourceColId, destinationColId, sourceIndex, destinationIndex) => {
    if (!orders[orderId]) return;
    
    const start = columns[sourceColId];
    const finish = columns[destinationColId];

    if (start.id === finish.id) {
      const newOrderIds = Array.from(start.orderIds);
      newOrderIds.splice(sourceIndex, 1);
      newOrderIds.splice(destinationIndex, 0, orderId);
      setColumns(prev => ({
        ...prev,
        [start.id]: { ...start, orderIds: newOrderIds }
      }));
      return;
    }

    const startIds = start.orderIds.filter(id => id !== orderId);
    const finishIds = Array.from(finish.orderIds);
    finishIds.splice(destinationIndex, 0, orderId);

    setOrders(prev => ({ ...prev, [orderId]: { ...prev[orderId], status: destinationColId } }));
    setColumns(prev => ({
      ...prev,
      [start.id]: { ...start, orderIds: startIds },
      [finish.id]: { ...finish, orderIds: finishIds }
    }));
  };

  const addNote = (orderId, noteText, author) => {
    const newNote = {
      id: uuidv4(),
      text: noteText,
      author: author || 'unknown',
      timestamp: new Date().toISOString()
    };
    setOrders(prev => {
      const current = prev[orderId];
      if (!current) return prev;
      return {
        ...prev,
        [orderId]: {
          ...current,
          notes: [...(current.notes || []), newNote]
        }
      };
    });
  };

  const archiveOrder = (orderId) => {
    const orderToArchive = orders[orderId];
    if (!orderToArchive) return;
    
    setArchivedOrders(prev => [{ ...orderToArchive, archivedAt: new Date().toISOString() }, ...prev]);
    setOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[orderId];
      return newOrders;
    });
    setColumns(prev => {
      const newCols = { ...prev };
      Object.keys(newCols).forEach(colId => {
        if (newCols[colId].orderIds.includes(orderId)) {
          newCols[colId] = {
            ...newCols[colId],
            orderIds: newCols[colId].orderIds.filter(id => id !== orderId)
          };
        }
      });
      return newCols;
    });
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      columns,
      columnOrder,
      archivedOrders,
      loadingOrders,
      addOrder,
      updateOrder,
      deleteOrder,
      moveOrder,
      addNote,
      archiveOrder
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);
