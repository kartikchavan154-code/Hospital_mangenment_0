import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { Plus, X, Calendar, Clock, Sparkles } from 'lucide-react';

const AppointmentList = () => {
  const { user: authUser } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    type: 'consultation',
    reason: ''
  });
  
  // Wait time predicted state
  const [predictedWait, setPredictedWait] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?page=${page}&limit=10`);
      if (res.data.success) {
        setAppointments(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchFormMetadata = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        api.get('/patients?limit=50'),
        api.get('/doctors?limit=50')
      ]);
      if (patRes.data.success) setPatients(patRes.data.data);
      if (docRes.data.success) setDoctors(docRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (showForm) {
      fetchFormMetadata();
    }
  }, [showForm]);

  // Load available slots dynamically based on doctor and date
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      const fetchSlots = async () => {
        try {
          const res = await api.get(`/appointments/available-slots?doctorId=${formData.doctorId}&date=${formData.appointmentDate}`);
          if (res.data.success) {
            setSlots(res.data.data.availableSlots || []);
            
            // Run ML delay prediction proxy
            const mlRes = await api.post('/ml/predict/wait-time', {
              doctorId: formData.doctorId,
              dayOfWeek: new Date(formData.appointmentDate).getDay() || 7,
              hour: 10, // assume early hours check
              activeAppointments: 4
            });
            if (mlRes.data.success) {
              setPredictedWait(mlRes.data.data.predictedWaitTime);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchSlots();
    }
  }, [formData.doctorId, formData.appointmentDate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment slot?')) {
      try {
        const res = await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient/staff' });
        if (res.data.success) {
          alert('Appointment cancelled.');
          fetchAppointments();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Error cancelling appointment.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      return alert('Please fill in all slot booking credentials.');
    }

    try {
      const res = await api.post('/appointments', formData);
      if (res.data.success) {
        alert('Appointment slot booked successfully.');
        setShowForm(false);
        setFormData({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', type: 'consultation', reason: '' });
        setPredictedWait(null);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error booking appointment slot.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Appointments Registry</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>Book, reschedule and monitor doctor-patient schedules.</p>
        </div>
        {authUser.role !== 'doctor' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} />
            Book Appointment
          </button>
        )}
      </div>

      {showForm && (
        <Card title="Book New Appointment Slot" style={{ position: 'relative' }}>
          <button onClick={() => setShowForm(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'hsl(var(--muted))', cursor: 'pointer', fontSize: '1.2rem' }}>
            <X size={18} />
          </button>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Select Patient</label>
                <select name="patientId" value={formData.patientId} onChange={handleChange} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Select Specialist</label>
                <select name="doctorId" value={formData.doctorId} onChange={handleChange} required>
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName} ({d.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Appointment Date</label>
                <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Available Slots</label>
                <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required disabled={!slots.length}>
                  <option value="">-- Select Time Slot --</option>
                  {slots.map((s, idx) => (
                    <option key={idx} value={s}>{s.substring(0, 5)}</option>
                  ))}
                </select>
              </div>
            </div>

            {predictedWait !== null && (
              <div style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: 'hsl(var(--accent))'
              }}>
                <Sparkles size={16} />
                <span>ML waiting prediction: The average delay for this selection is <strong>{predictedWait} minutes</strong>.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Appointment Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow Up</option>
                  <option value="routine-checkup">Routine Checkup</option>
                  <option value="emergency">Emergency Case</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Purpose of Visit</label>
                <input type="text" name="reason" value={formData.reason} onChange={handleChange} placeholder="e.g. chronic back pain, fever check..." />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
              Confirm Booking
            </button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading appointment slots...</div>
        ) : (
          <>
            <Table headers={['Time & Date', 'Patient Name', 'Doctor', 'Consultation Type', 'Status', 'Actions']}>
              {appointments.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No appointments booked.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'hsl(var(--primary))' }} />
                        {a.appointmentDate}
                        <Clock size={14} style={{ color: 'hsl(var(--accent))', marginLeft: '6px' }} />
                        {a.appointmentTime.substring(0, 5)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.patient.user.firstName} {a.patient.user.lastName}</td>
                    <td>Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</td>
                    <td>
                      <span className="badge badge-info">{a.type}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.status !== 'cancelled' && a.status !== 'completed' ? (
                        <button onClick={() => handleCancel(a.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: 'hsl(var(--muted))', fontSize: '0.8rem' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </Table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default AppointmentList;
