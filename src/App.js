import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import IssueTicket from './pages/IssueTicket';
import ScanTicket from './pages/ScanTicket';
import ManageUsers from './pages/ManageUsers';
import ActivityMonitor from './pages/ActivityMonitor';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginScreen />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/issue-ticket" 
        element={
          <ProtectedRoute>
            <IssueTicket />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/scan-ticket" 
        element={
          <ProtectedRoute>
            <ScanTicket />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Only Routes */}
      <Route 
        path="/manage-users" 
        element={
          <ProtectedRoute adminOnly={true}>
            <ManageUsers />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
