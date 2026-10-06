import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [profitShares, setProfitShares] = useState({ workshopDeductions: {}, withdrawals: {} });

  const tasksRef = doc(db, 'crm', 'v3_tasks');
  const ledgerRef = doc(db, 'crm', 'v3_ledger');

  const initialised = useRef(false);

  useEffect(() => {
    let unsubTasks, unsubLedger;

    async function bootstrap() {
      try {
        const [tasksSnap, ledgerSnap] = await Promise.all([
          getDoc(tasksRef),
          getDoc(ledgerRef)
        ]);

        if (tasksSnap.exists()) {
          setTasks(tasksSnap.data().tasks || {});
        } else {
          setTasks({});
        }

        if (ledgerSnap.exists()) {
          const d = ledgerSnap.data();
          setTransactions(d.transactions || []);
          if (d.profitShares) setProfitShares(d.profitShares);
        } else {
          setTransactions([]);
        }

        unsubTasks = onSnapshot(tasksRef, snap => {
          if (snap.exists() && initialised.current) setTasks(snap.data().tasks || {});
        });
        unsubLedger = onSnapshot(ledgerRef, snap => {
          if (snap.exists() && initialised.current) {
            const d = snap.data();
            setTransactions(d.transactions || []);
            if (d.profitShares) setProfitShares(d.profitShares);
          }
        });
      } catch (err) {
        console.error("Error bootstrapping DataContext", err);
      } finally {
        setLoading(false);
        initialised.current = true;
      }
    }

    bootstrap();

    return () => {
      initialised.current = false;
      if (unsubTasks) unsubTasks();
      if (unsubLedger) unsubLedger();
    };
  }, []);

  useEffect(() => { 
    if (initialised.current) {
      setDoc(tasksRef, { tasks }, { merge: true }).catch(console.error); 
    }
  }, [tasks]); 

  useEffect(() => { 
    if (initialised.current) {
      setDoc(ledgerRef, { transactions }, { merge: true }).catch(console.error); 
    }
  }, [transactions]);

  const updateProfitShares = (newProfitShares) => {
    setProfitShares(newProfitShares);
    setDoc(doc(db, 'crm', 'v3_ledger'), { profitShares: newProfitShares }, { merge: true }).catch(console.error);
  };

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

  const addTransaction = (data) => setTransactions(prev => [...prev, { id: uuidv4(), ...data, date: new Date().toISOString(), amount: Number(data.amount)||0 }]);
  const deleteTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  return (
    <DataContext.Provider value={{
      loading,
      tasks, addTask, updateTaskStatus, deleteTask,
      transactions, addTransaction, deleteTransaction,
      profitShares, updateProfitShares,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
