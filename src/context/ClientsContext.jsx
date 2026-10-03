import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ClientsContext = createContext();

export const ClientsProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'data', 'clients'), (docSnap) => {
      if (docSnap.exists()) {
        setClients(docSnap.data().items || []);
      }
      setLoadingClients(false);
    });
    return () => unsubscribe();
  }, []);

  const addClient = async (clientData) => {
    const newClients = [...clients, clientData];
    setClients(newClients);
    await setDoc(doc(db, 'data', 'clients'), { items: newClients }, { merge: true });
  };

  const updateClient = async (updatedClient) => {
    const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(newClients);
    await updateDoc(doc(db, 'data', 'clients'), { items: newClients });
  };

  const deleteClient = async (id) => {
    const newClients = clients.filter(c => c.id !== id);
    setClients(newClients);
    await updateDoc(doc(db, 'data', 'clients'), { items: newClients });
  };

  const replaceClients = async (newClientsArray) => {
    setClients(newClientsArray);
    await setDoc(doc(db, 'data', 'clients'), { items: newClientsArray }, { merge: true });
  };

  return (
    <ClientsContext.Provider value={{
      clients,
      loadingClients,
      addClient,
      updateClient,
      deleteClient,
      replaceClients
    }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => useContext(ClientsContext);
