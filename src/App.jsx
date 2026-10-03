import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ClientsProvider } from './context/ClientsContext';
import { InventoryProvider } from './context/InventoryContext';
import { OrdersProvider } from './context/OrdersContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

import Layout from './components/Layout';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Ledger from './pages/Ledger';
import OrderTransactions from './pages/OrderTransactions';
import Archive from './pages/Archive';
import Clients from './pages/Clients';
import ProfitSharing from './pages/ProfitSharing';
import MonthlyStats from './pages/MonthlyStats';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/ledger" element={<ProtectedRoute><Layout><Ledger /></Layout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Layout><OrderTransactions /></Layout></ProtectedRoute>} />
      <Route path="/archive" element={<ProtectedRoute><Layout><Archive /></Layout></ProtectedRoute>} />
      <Route path="/profits" element={<ProtectedRoute><Layout><ProfitSharing /></Layout></ProtectedRoute>} />
      <Route path="/monthly-stats" element={<ProtectedRoute><Layout><MonthlyStats /></Layout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Layout><Clients /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <InventoryProvider>
      <ClientsProvider>
        <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
      </ClientsProvider>
      </InventoryProvider>
        </OrdersProvider>
    </AuthProvider>
  );
}

export default App;
