import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import IssueTicket from './pages/IssueTicket';
import ScanTicket from './pages/ScanTicket';
import ManageUsers from './pages/ManageUsers';
import ActivityMonitor from './pages/ActivityMonitor';
import Tickets from './pages/Tickets';
import ChangePassword from './pages/ChangePassword';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, adminOnly = false, needIssue = false, needScan = false }) => {
  const { user, isLoading, isAdmin, canIssue, canScan } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (needIssue && !canIssue) return <Navigate to="/dashboard" replace />;
  if (needScan && !canScan) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicRoute><LoginScreen /></PublicRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/issue-ticket" element={<ProtectedRoute needIssue={true}><IssueTicket /></ProtectedRoute>} />
    <Route path="/scan-ticket" element={<ProtectedRoute needScan={true}><ScanTicket /></ProtectedRoute>} />
    <Route path="/tickets" element={<ProtectedRoute adminOnly={true}><Tickets /></ProtectedRoute>} />
    <Route path="/manage-users" element={<ProtectedRoute adminOnly={true}><ManageUsers /></ProtectedRoute>} />
    <Route path="/activity-monitor" element={<ProtectedRoute adminOnly={true}><ActivityMonitor /></ProtectedRoute>} />
    <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default App;
