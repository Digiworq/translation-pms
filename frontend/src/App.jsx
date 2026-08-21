import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProjectsList } from './pages/Projects/ProjectsList';
import { ProjectDetails } from './pages/Projects/ProjectDetails';
import { ClientsList } from './pages/Clients/ClientsList';
import { ClientDetails } from './pages/Clients/ClientDetails';
import { VendorsList } from './pages/Vendors/VendorsList';
import { InvoicesList } from './pages/Invoices/InvoicesList';
import { PaymentsList } from './pages/Payments/PaymentsList';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { AuditLogsList } from './pages/AuditLogs/AuditLogsList';
import { UsersList } from './pages/UserManagement/UsersList';
import { SettingsPage } from './pages/Settings/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium text-sm">
        Initializing Authentication...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="vendors" element={<VendorsList />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsList />} />
            <Route path="users" element={<UsersList />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
