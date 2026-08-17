import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        ...(roleFilter ? { role: roleFilter } : {})
      }).toString();

      const res = await api.get(`/auth/users?${query}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>User Accounts Directory</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Manage system logins, roles, and account statuses across the hospital network.</p>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search user name, email address..." />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ width: '200px', backgroundColor: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', padding: '10px 14px' }}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '40px' }}>Loading user directory...</div>
        ) : (
          <>
            <Table headers={['User Identity', 'Role', 'Phone Number', 'Account Status', 'Created Date']}>
              {users.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No user accounts found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          color: 'hsl(var(--primary))',
                          width: '34px', height: '34px',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <div>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))', fontWeight: 400 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'doctor' ? 'info' : u.role === 'receptionist' ? 'warning' : 'success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        {u.isActive !== false ? (
                          <>
                            <CheckCircle size={14} style={{ color: '#059669' }} />
                            <span style={{ color: '#059669', fontWeight: 600 }}>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} style={{ color: '#dc2626' }} />
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>Disabled</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'hsl(var(--muted))', fontSize: '0.85rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
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

export default UserList;
