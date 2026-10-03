import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const initialised = useRef(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    initialised.current = true;
    const productsRef = doc(db, 'crm', 'products');
    const suppliesRef = doc(db, 'crm', 'supplies');

    let unsubProducts, unsubSupplies;

    const bootstrap = async () => {
      try {
        const [productsSnap, suppliesSnap] = await Promise.all([
          getDoc(productsRef),
          getDoc(suppliesRef)
        ]);

        if (productsSnap.exists()) {
          setProducts(productsSnap.data().products || []);
        } else {
          setProducts([]);
        }

        if (suppliesSnap.exists()) {
          setSupplies(suppliesSnap.data().supplies || []);
        } else {
          setSupplies([]);
        }

        unsubProducts = onSnapshot(productsRef, snap => {
          if (snap.exists() && initialised.current) {
            setProducts(snap.data().products || []);
          }
        });

        unsubSupplies = onSnapshot(suppliesRef, snap => {
          if (snap.exists() && initialised.current) {
            setSupplies(snap.data().supplies || []);
          }
        });
      } catch (err) {
        console.error("Error bootstrapping inventory:", err);
      } finally {
        setLoadingInventory(false);
      }
    };

    bootstrap();

    return () => {
      initialised.current = false;
      if (unsubProducts) unsubProducts();
      if (unsubSupplies) unsubSupplies();
    };
  }, []);

  const addProduct = (data) => {
    const newProducts = [...products, { id: uuidv4(), ...data, stock: Number(data.stock)||0, buyPrice: Number(data.buyPrice)||0, sellPrice: Number(data.sellPrice)||0 }];
    setProducts(newProducts);
    setDoc(doc(db, 'crm', 'products'), { products: newProducts }, { merge: true }).catch(console.error);
  };

  const updateProduct = (id, fields) => {
    const newProducts = products.map(p => p.id === id ? { ...p, ...fields } : p);
    setProducts(newProducts);
    setDoc(doc(db, 'crm', 'products'), { products: newProducts }, { merge: true }).catch(console.error);
  };

  const replaceProducts = async (newProducts) => {
    try {
      await setDoc(doc(db, 'crm', 'products'), { products: newProducts });
      setProducts(newProducts);
    } catch (e) {
      console.error('Failed to replace products:', e);
    }
  };

  const addSupply = (productId, quantity, details) => {
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === productId) {
          return { ...p, stock: (Number(p.stock) || 0) + Number(quantity) };
        }
        return p;
      });
      setDoc(doc(db, 'crm', 'products'), { products: next }, { merge: true }).catch(console.error);
      return next;
    });

    setSupplies(prev => {
      const next = [{
        id: uuidv4(),
        productId,
        productName: details.productName || 'Unknown Product',
        quantity: Number(quantity),
        date: new Date().toISOString(),
        suppliedBy: currentUser ? currentUser.id : 'unknown',
        supplierName: currentUser ? (currentUser.name || currentUser.id) : 'unknown',
        notes: details.notes || ''
      }, ...prev];
      setDoc(doc(db, 'crm', 'supplies'), { supplies: next }, { merge: true }).catch(console.error);
      return next;
    });
  };

  return (
    <InventoryContext.Provider value={{
      products,
      supplies,
      loadingInventory,
      addProduct,
      updateProduct,
      replaceProducts,
      addSupply
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
