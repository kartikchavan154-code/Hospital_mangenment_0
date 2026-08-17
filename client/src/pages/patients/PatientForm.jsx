import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    insuranceProvider: '',
    insuranceNumber: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchPatient = async () => {
        try {
          const res = await api.get(`/patients/${id}`);
          if (res.data.success) {
            const p = res.data.data;
            setFormData({
              firstName: p.user?.firstName || '',
              lastName: p.user?.lastName || '',
              email: p.user?.email || '',
              phone: p.user?.phone || '',
              password: '', // leave empty during editing
              dateOfBirth: p.dateOfBirth || '',
              gender: p.gender || 'male',
              bloodGroup: p.bloodGroup || 'O+',
              address: p.address || '',
              emergencyContact: p.emergencyContact || '',
              emergencyPhone: p.emergencyPhone || '',
              allergies: p.allergies || '',
              insuranceProvider: p.insuranceProvider || '',
              insuranceNumber: p.insuranceNumber || ''
            });
          }
        } catch (err) {
          console.error(err);
          setError('Failed to fetch patient data.');
        }
      };
      fetchPatient();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // don't update password if empty
        const res = await api.put(`/patients/${id}`, payload);
        if (res.data.success) {
          alert('Patient record updated successfully.');
          navigate('/patients');
        }
      } else {
        const res = await api.post('/patients', formData);
        if (res.data.success) {
          alert('Patient registered successfully.');
          navigate('/patients');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving patient registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>
          {isEdit ? 'Modify Patient Details' : 'Register Clinical Patient'}
        </h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Enter the clinical demographic information and system user credentials.</p>
      </div>

      <Card>
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#dc2626', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User profile credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', color: '#0f172a', fontSize: '1rem' }}>Demographic Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {!isEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Initial Login Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="defaults to patient123" />
              </div>
            )}
          </div>

          {/* Demographics data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', color: '#0f172a', fontSize: '1rem' }}>Clinical Data</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows="2" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Emergency Contact Person</label>
                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Emergency Contact Phone</label>
                <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Known Allergies</label>
              <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. penicillin, dust, peanuts..." rows="2" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Insurance Provider</label>
                <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Insurance Policy Number</label>
                <input type="text" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={() => navigate('/patients')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Processing...' : isEdit ? 'Update Details' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PatientForm;
