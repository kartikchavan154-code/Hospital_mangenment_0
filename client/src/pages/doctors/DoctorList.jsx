import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Plus, X, User } from 'lucide-react';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  departmentId: '',
  specialization: '',
  experience: '',
  consultationFee: '',
  licenseNumber: '',
  bio: '',
};

const DoctorList = () => {
  const { user: authUser } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/doctors?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setDoctors(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) setDepartments(res.data.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => { fetchDoctors(); }, [page, search]);
  useEffect(() => { if (showForm) fetchDepartments(); }, [showForm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.specialization || !formData.consultationFee) {
      return setFormError('Please fill in all required fields.');
    }
    try {
      setSubmitting(true);
      const res = await api.post('/doctors', formData);
      if (res.data.success) {
        setShowForm(false);
        setFormData(EMPTY_FORM);
        setFormError('');
        fetchDoctors();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Clinical Specialist Directory</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>View specializations, clinical experience, consultation fees and schedule availabilities.</p>
        </div>
        {['admin', 'receptionist'].includes(authUser?.role) && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            Add Doctor
          </button>
        )}
      </div>

      {/* Add Doctor Form */}
      {showForm && (
        <Card title="Register New Doctor" style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); setFormError(''); }}
            style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'hsl(var(--muted))', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>

          {formError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px' }}>
            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g. Arjun" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Sharma" required />
              </div>
            </div>

            {/* Contact Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="doctor@hospital.com" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Login Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Default: doctor123" />
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Leave blank to use default password: <strong>doctor123</strong></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>License Number</label>
                <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="e.g. MCI-12345" />
              </div>
            </div>

            {/* Department + Specialization */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Department</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Specialization <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Cardiology, Neurology" required />
              </div>
            </div>

            {/* Experience + Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Years of Experience</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 8" min="0" max="60" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Consultation Fee (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} placeholder="e.g. 500" min="0" required />
              </div>
            </div>

            {/* Bio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Professional Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows="2" placeholder="Brief profile, qualifications, areas of expertise..." />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); setFormError(''); }} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register Doctor'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Doctor Table */}
      <Card>
        <div style={{ marginBottom: '20px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search doctor names, specializations..." />
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading doctors registry...</div>
        ) : (
          <>
            <Table headers={['Doctor Name', 'Department', 'Specialization', 'Experience', 'Consultation Fee', 'Availability']}>
              {doctors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No doctors found. Add one using the button above.</td></tr>
              ) : (
                doctors.map((d) => (
                  <tr key={d.id}>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          color: 'hsl(var(--primary))',
                          width: '32px', height: '32px',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Stethoscope size={16} />
                        </div>
                        Dr. {d.user?.firstName} {d.user?.lastName}
                      </div>
                    </td>
                    <td>{d.department?.name || 'General Clinic'}</td>
                    <td>{d.specialization}</td>
                    <td>{d.experience} years</td>
                    <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>₹{parseFloat(d.consultationFee || 0).toFixed(2)}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                        Mon–Fri, 9:00 AM – 5:00 PM
                      </div>
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

export default DoctorList;
