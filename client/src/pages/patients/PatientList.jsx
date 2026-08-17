import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Card from '../../components/common/Card';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients?page=${page}&limit=10&search=${search}`);
      if (res.data.success) {
        setPatients(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient and their user login profile?')) {
      try {
        const res = await api.delete(`/patients/${id}`);
        if (res.data.success) {
          alert('Patient record deleted successfully.');
          fetchPatients();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting patient.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Patients Database</h1>
          <p style={{ color: 'hsl(var(--muted))' }}>Review and manage clinical profiles, medical history and patient registers.</p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="btn btn-primary">
          <Plus size={16} />
          Register Patient
        </button>
      </div>

      <Card>
        <div style={{ marginBottom: '20px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search patient names, emails, phones..." />
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading patient rosters...</div>
        ) : (
          <>
            <Table headers={['Name', 'DOB', 'Gender', 'Blood Group', 'Insurance', 'Actions']}>
              {patients.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No patients matching details found.</td></tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>
                      {p.user?.firstName} {p.user?.lastName}
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', fontWeight: 400 }}>{p.user?.email}</div>
                    </td>
                    <td>{p.dateOfBirth || 'N/A'}</td>
                    <td>{p.gender || 'N/A'}</td>
                    <td>
                      <span className="badge badge-info">{p.bloodGroup || 'N/A'}</span>
                    </td>
                    <td>{p.insuranceProvider ? `${p.insuranceProvider} (${p.insuranceNumber})` : 'Self Pay'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => navigate(`/patients/${p.id}`)} className="icon-btn" title="View Profile">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/patients/${p.id}/edit`)} className="icon-btn" title="Edit details">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="icon-btn" title="Delete record" style={{ color: 'hsl(var(--destructive))' }}>
                          <Trash2 size={16} />
                        </button>
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

export default PatientList;
