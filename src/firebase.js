import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNtlXMTiSxIV51SlsVMEbanKxFNYn8Ef4",
  authDomain: "crm-alhekaya.firebaseapp.com",
  projectId: "crm-alhekaya",
  storageBucket: "crm-alhekaya.firebasestorage.app",
  messagingSenderId: "811997922390",
  appId: "1:811997922390:web:961b9dc43eeb9ac3c2e7f7",
  measurementId: "G-8447M712W5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
