import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Businesses from './pages/Businesses';
import BusinessDetail from './pages/BusinessDetail';
import Conversations from './pages/Conversations';
import KnowledgeBase from './pages/KnowledgeBase';
import Orders from './pages/Orders';
import Leads from './pages/Leads';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Services from './pages/Services';

// New SaaS Pages
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import Automation from './pages/Automation';
import Broadcasts from './pages/Broadcasts';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="businesses/:businessId" element={<BusinessDetail />} />
        <Route path="businesses/:businessId/conversations" element={<Conversations />} />
        <Route path="businesses/:businessId/knowledge" element={<KnowledgeBase />} />
        <Route path="businesses/:businessId/products" element={<Products />} />
        <Route path="businesses/:businessId/services" element={<Services />} />
        <Route path="businesses/:businessId/orders" element={<Orders />} />
        <Route path="businesses/:businessId/leads" element={<Leads />} />
        <Route path="businesses/:businessId/settings" element={<Settings />} />
        
        {/* New SaaS Routes */}
        <Route path="businesses/:businessId/analytics" element={<Analytics />} />
        <Route path="businesses/:businessId/agents" element={<Team />} />
        <Route path="businesses/:businessId/automation" element={<Automation />} />
        <Route path="businesses/:businessId/broadcasts" element={<Broadcasts />} />
        <Route path="businesses/:businessId/tags" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
