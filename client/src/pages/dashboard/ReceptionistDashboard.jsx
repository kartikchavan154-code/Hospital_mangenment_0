import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import { Calendar, UserPlus, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceptionData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [apptsRes, billsRes] = await Promise.all([
          api.get(`/appointments?date=${today}&limit=5`),
          api.get('/bills?status=pending&limit=5')
        ]);

        if (apptsRes.data.success) setAppointments(apptsRes.data.data);
        if (billsRes.data.success) setUnpaidBills(billsRes.data.data);
      } catch (err) {
        console.error('Error fetching receptionist metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionData();
  }, []);

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading Reception Panel...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Reception Desk Control</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>Monitor incoming patients, schedule appointments, and manage check-ins/billing.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/patients')} className="btn btn-secondary">
            <UserPlus size={16} />
            Add Patient
          </button>
          <button onClick={() => navigate('/appointments')} className="btn btn-primary">
            <Calendar size={16} />
            Book Slot
          </button>
        </div>
      </div>

      {/* Grid of quick summaries */}
      <div className="dashboard-grid">
        <StatCard title="Today's Checkins" value={appointments.length} icon={Calendar} description="Registered slot schedules" color="#6366f1" />
        <StatCard title="Unpaid Invoices" value={unpaidBills.length} icon={CreditCard} description="Awaiting payments" color="#f59e0b" />
      </div>

      {/* Column 2 - Main actions tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <Card title="Today's Booking Checklist" subtitle="Confirm schedules and checkins">
          <Table headers={['Time', 'Patient', 'Doctor', 'Status']}>
            {appointments.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No checkins registered today.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id}>
                  <td style={{ color: '#0f172a', fontWeight: 600 }}>{a.appointmentTime}</td>
                  <td>{a.patient?.user?.firstName || 'Patient'} {a.patient?.user?.lastName || ''}</td>
                  <td>Dr. {a.doctor?.user?.firstName || 'Doctor'} {a.doctor?.user?.lastName || ''}</td>
                  <td>
                    <span className={`badge badge-${a.status === 'completed' ? 'success' : 'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Card title="Outstanding Invoices" subtitle="Pending payment processing">
          <Table headers={['Invoice #', 'Patient Name', 'Total', 'Action']}>
            {unpaidBills.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No pending invoices.</td></tr>
            ) : (
              unpaidBills.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: '#0f172a', fontWeight: 600 }}>{b.invoiceNumber}</td>
                  <td>{b.patient?.user?.firstName || 'Patient'} {b.patient?.user?.lastName || ''}</td>
                  <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>₹{parseFloat(b.totalAmount).toFixed(2)}</td>
                  <td>
                    <button onClick={() => navigate(`/billing`)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Record Payment
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
