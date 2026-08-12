import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import { Calendar, FileHeart, CreditCard, Sparkles } from 'lucide-react';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const [apptsRes, historyRes, billsRes] = await Promise.all([
          api.get('/appointments?limit=5'),
          api.get('/medical-records?limit=5'),
          api.get('/bills?limit=5')
        ]);

        if (apptsRes.data.success) setAppointments(apptsRes.data.data);
        if (historyRes.data.success) setHistory(historyRes.data.data);
        if (billsRes.data.success) setBills(billsRes.data.data);
      } catch (err) {
        console.error('Error fetching patient dashboard info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading Patient Portal...</div>;

  const nextAppt = appointments.find(a => a.status === 'scheduled' || a.status === 'confirmed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Your Health Portal</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Access your appointments, billing receipts, prescriptions, and health summaries.</p>
      </div>

      {/* Grid Summaries */}
      <div className="dashboard-grid">
        <StatCard 
          title="Next Consultation Slot" 
          value={nextAppt ? nextAppt.appointmentTime : 'None'} 
          icon={Calendar} 
          description={nextAppt ? `Dr. ${nextAppt.doctor.user.lastName} on ${nextAppt.appointmentDate}` : 'No upcoming visits'} 
          color="#6366f1" 
        />
        <StatCard title="Medical Reports" value={history.length} icon={FileHeart} description="Registered records" color="#06b6d4" />
        <StatCard title="Outstanding Dues" value={`₹${bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.totalAmount), 0).toFixed(2)}`} icon={CreditCard} description="Pending invoices" color="#f59e0b" />
      </div>

      {/* Detailed Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        <Card title="Your Health & Diagnostic Roster" subtitle="Latest diagnosis details">
          <Table headers={['Date', 'Diagnosis', 'Prescribed Meds']}>
            {history.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No diagnostic history reported.</td></tr>
            ) : (
              history.map((h) => (
                <tr key={h.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{h.createdAt.split('T')[0]}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--accent))' }}>{h.diagnosis}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Symptoms: {h.symptoms}</div>
                  </td>
                  <td>
                    {h.prescriptions && h.prescriptions.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {h.prescriptions.map((p, idx) => (
                          <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {p.medication} ({p.dosage})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'hsl(var(--muted))' }}>None</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Card title="Billing & Receipts" subtitle="Invoices statement details">
          <Table headers={['Invoice', 'Total', 'Status']}>
            {bills.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No invoices issued yet.</td></tr>
            ) : (
              bills.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{b.invoiceNumber}</td>
                  <td style={{ fontWeight: 600 }}>₹{parseFloat(b.totalAmount).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${b.status === 'paid' ? 'success' : 'danger'}`}>
                      {b.status}
                    </span>
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

export default PatientDashboard;
