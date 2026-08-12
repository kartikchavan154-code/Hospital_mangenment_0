import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { ShieldAlert } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/audit-logs?page=${page}&limit=20`);
        if (res.data.success) {
          setLogs(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800 }}>Security Audit Ledger</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Detailed audit trail tracking system modifications, authentication logs and operations records.</p>
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading audit logs...</div>
        ) : (
          <>
            <Table headers={['Timestamp', 'User Identity', 'Role', 'Action Executed', 'Target Entity', 'Entity ID', 'IP Address']}>
              {logs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No audit trails recorded.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      {log.user ? (
                        <div>
                          <strong>{log.user.firstName} {log.user.lastName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>{log.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'hsl(var(--muted))' }}>System / Anonymous</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${log.user?.role === 'admin' ? 'danger' : 'info'}`}>
                        {log.user?.role || 'Guest'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: log.action.includes('DELETE') ? '#f87171' : 'inherit' }}>
                        {log.action}
                      </strong>
                    </td>
                    <td>{log.entity}</td>
                    <td>{log.entityId || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.ipAddress || '127.0.0.1'}</td>
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

export default AuditLogs;
