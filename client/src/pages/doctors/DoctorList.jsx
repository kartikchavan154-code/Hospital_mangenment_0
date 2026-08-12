import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Card from '../../components/common/Card';
import { Stethoscope } from 'lucide-react';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDoctors();
  }, [page, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Clinical Specialist Directory</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>View specializations, clinical experience, consultation fees and schedule availabilities.</p>
      </div>

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
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No doctors found.</td></tr>
              ) : (
                doctors.map((d) => (
                  <tr key={d.id}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          color: 'hsl(var(--primary))',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Stethoscope size={16} />
                        </div>
                        Dr. {d.user?.firstName} {d.user?.lastName}
                      </div>
                    </td>
                    <td>{d.department?.name || 'General Clinic'}</td>
                    <td>{d.specialization}</td>
                    <td>{d.experience} years</td>
                    <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>₹{parseFloat(d.consultationFee).toFixed(2)}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
                        Mon-Fri, 9:00 AM - 5:00 PM
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
