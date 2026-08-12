import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { FileText, ClipboardList } from 'lucide-react';

const MedicalRecords = () => {
  const { user: authUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/medical-records?page=${page}&limit=10`);
        if (res.data.success) {
          setRecords(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Clinical Medical Records</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Review diagnostic charts, consultations history and pharmaceutical prescriptions.</p>
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading clinical charts...</div>
        ) : (
          <>
            <Table headers={['Date', 'Patient Name', 'Doctor', 'Diagnosis', 'Symptoms', 'Prescriptions']}>
              {records.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No clinical records listed.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} style={{ color: 'hsl(var(--primary))' }} />
                        {r.createdAt.split('T')[0]}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.patient.user.firstName} {r.patient.user.lastName}</td>
                    <td>Dr. {r.doctor.user.firstName} {r.doctor.user.lastName}</td>
                    <td style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>{r.diagnosis}</td>
                    <td>{r.symptoms || 'N/A'}</td>
                    <td>
                      {r.prescriptions && r.prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {r.prescriptions.map((p, idx) => (
                            <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem', padding: '3px 6px' }}>
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
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default MedicalRecords;
