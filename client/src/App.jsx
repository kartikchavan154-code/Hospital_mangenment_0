import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';
import PatientForm from './pages/patients/PatientForm';
import DoctorList from './pages/doctors/DoctorList';
import AppointmentList from './pages/appointments/AppointmentList';
import BillingList from './pages/billing/BillingList';
import MedicalRecords from './pages/records/MedicalRecords';
import AuditLogs from './pages/settings/AuditLogs';
import Analytics from './pages/analytics/Analytics';

// Helper component for Route Guarding
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'hsl(var(--muted))', padding: '30px' }}>Authenticating user portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Dynamic role selector home dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Patient records */}
      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
          <PatientList />
        </ProtectedRoute>
      } />
      <Route path="/patients/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
          <PatientDetail />
        </ProtectedRoute>
      } />
      <Route path="/patients/new" element={
        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
          <PatientForm />
        </ProtectedRoute>
      } />
      <Route path="/patients/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
          <PatientForm />
        </ProtectedRoute>
      } />

      {/* Doctors List */}
      <Route path="/doctors" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
          <DoctorList />
        </ProtectedRoute>
      } />

      {/* Appointment booking */}
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
          <AppointmentList />
        </ProtectedRoute>
      } />

      {/* Billing receipts */}
      <Route path="/billing" element={
        <ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']}>
          <BillingList />
        </ProtectedRoute>
      } />

      {/* Medical records */}
      <Route path="/medical-records" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
          <MedicalRecords />
        </ProtectedRoute>
      } />

      {/* Admin specific routes */}
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <div style={{ color: '#0f172a' }}><h2>Users accounts manager placeholder</h2></div>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/audit-logs" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuditLogs />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
