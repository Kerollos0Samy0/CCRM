import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const ClientsContext = createContext();

export const ClientsProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const initialised = useRef(false);

  useEffect(() => {
    initialised.current = true;
    const unsubscribe = onSnapshot(doc(db, 'crm', 'v3_clients'), (docSnap) => {
      if (docSnap.exists() && initialised.current) {
        setClients(docSnap.data().clients || []);
      }
      setLoadingClients(false);
    });
    return () => {
      initialised.current = false;
      unsubscribe();
    };
  }, []);

  const addClient = async (clientData) => {
    const newClients = [...clients, clientData];
    setClients(newClients);
    await setDoc(doc(db, 'crm', 'v3_clients'), { clients: newClients }, { merge: true });
  };

  const updateClient = async (updatedClient) => {
    const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(newClients);
    await setDoc(doc(db, 'crm', 'v3_clients'), { clients: newClients }, { merge: true });
  };

  const deleteClient = async (id) => {
    const newClients = clients.filter(c => c.id !== id);
    setClients(newClients);
    await setDoc(doc(db, 'crm', 'v3_clients'), { clients: newClients }, { merge: true });
  };

  const replaceClients = async (newClientsArray) => {
    setClients(newClientsArray);
    await setDoc(doc(db, 'crm', 'v3_clients'), { clients: newClientsArray }, { merge: true });
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
