import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import { Calendar, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [mlData, setMlData] = useState({ predictedWaitTime: 0, note: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        // Fetch doctor profile to obtain the profile ID
        const userRes = await api.get('/auth/me');
        if (userRes.data.success) {
          const profile = userRes.data.data.profile;
          setDoctorProfile(profile);
          
          if (profile) {
            // Fetch appointments for today
            const today = new Date().toISOString().split('T')[0];
            const scheduleRes = await api.get(`/doctors/${profile.id}/schedule?date=${today}`);
            if (scheduleRes.data.success) {
              setSchedule(scheduleRes.data.data.appointments || []);
            }

            // Perform ML waiting time prediction
            const mlRes = await api.post('/ml/predict/wait-time', {
              doctorId: profile.id,
              dayOfWeek: new Date().getDay() || 7,
              hour: new Date().getHours(),
              activeAppointments: (scheduleRes.data.data.appointments || []).filter(a => a.status === 'scheduled').length
            });
            if (mlRes.data.success) {
              setMlData(mlRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching doctor schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading Doctor Schedule...</div>;

  const todayCompleted = schedule.filter(a => a.status === 'completed').length;
  const todayRemaining = schedule.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Welcome, Dr. {user.lastName}</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Review your current consultations, patient list and scheduling forecast details.</p>
      </div>

      {/* Overview stats */}
      <div className="dashboard-grid">
        <StatCard title="Today's Consultation Load" value={schedule.length} icon={Calendar} description="Total appointments" color="#6366f1" />
        <StatCard title="Completed Visits" value={todayCompleted} icon={UserCheck} description="Patients checked out" color="#10b981" />
        <StatCard title="Remaining Consultations" value={todayRemaining} icon={ShieldAlert} description="Pending check-ins" color="#f59e0b" />
        <StatCard 
          title="Est. Delay (ML)" 
          value={`${mlData.predictedWaitTime} mins`} 
          icon={Sparkles} 
          description={mlData.note || "Current wait-time prediction"} 
          color="#06b6d4" 
        />
      </div>

      {/* Appointment Schedule */}
      <Card title="Today's Consultations Queue" subtitle="Chronological clinical roster">
        <Table headers={['Time', 'Patient Name', 'Age', 'Blood Group', 'Purpose', 'Status']}>
          {schedule.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No appointments booked for today.</td></tr>
          ) : (
            schedule.map((a) => {
              const birthYear = a.patient.dateOfBirth ? new Date(a.patient.dateOfBirth).getFullYear() : null;
              const age = birthYear ? new Date().getFullYear() - birthYear : 'N/A';
              return (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{a.appointmentTime}</td>
                  <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>
                    {a.patient.user.firstName} {a.patient.user.lastName}
                  </td>
                  <td>{age} yrs</td>
                  <td>{a.patient.bloodGroup || 'N/A'}</td>
                  <td>{a.reason}</td>
                  <td>
                    <span className={`badge badge-${a.status === 'completed' ? 'success' : 'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
