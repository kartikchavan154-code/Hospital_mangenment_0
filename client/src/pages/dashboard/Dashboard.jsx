import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import PatientDashboard from './PatientDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      return (
        <div style={{ color: 'red', padding: '20px' }}>
          Invalid user role. Please contact support.
        </div>
      );
  }
};

export default Dashboard;
