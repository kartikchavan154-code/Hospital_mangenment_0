import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  Clock, 
  HeartHandshake 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, todayAppointments: 0, totalRevenue: '0.00' });
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes, revenueRes, workloadRes, deptRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/recent-activity?limit=5'),
          api.get('/analytics/revenue?months=6'),
          api.get('/analytics/doctor-workload'),
          api.get('/analytics/department-distribution')
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (activityRes.data.success) setRecentActivity(activityRes.data.data);
        if (revenueRes.data.success) {
          setRevenueData(revenueRes.data.data.map(item => ({
            name: item.month,
            revenue: parseFloat(item.revenue)
          })));
        }
        if (workloadRes.data.success) {
          setWorkloadData(workloadRes.data.data.map(item => ({
            name: `${item.doctor.user.firstName} ${item.doctor.user.lastName}`,
            appointments: parseInt(item.appointmentCount)
          })));
        }
        if (deptRes.data.success) {
          setDeptData(deptRes.data.data.map(item => ({
            name: item.department?.name || item['department.name'] || 'Other',
            value: parseInt(item.doctorCount)
          })));
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading Analytics Data...</div>;

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Administrative Overview</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Hospital resource metrics, diagnostic data, and revenue statements.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} trend="+4%" description="from last month" color="#06b6d4" />
        <StatCard title="Total Doctors" value={stats.totalDoctors} icon={HeartHandshake} trend="+2%" description="on-call status" color="#6366f1" />
        <StatCard title="Today's Appointments" value={stats.todayAppointments} icon={Calendar} trend="+12" description="scheduled today" color="#f59e0b" />
        <StatCard title="Gross Revenue" value={`₹${stats.totalRevenue}`} icon={DollarSign} trend="+8%" description="cumulative earnings" color="#10b981" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', minHeight: '350px' }}>
        <Card title="Monthly Revenue Streams" subtitle="Total income aggregate per month">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Department Division" subtitle="Staff deployment ratio">
          <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
              {deptData.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 - Recent Activity & Doctor Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <Card title="Recent Active Appointments" subtitle="Latest schedule records">
          <Table headers={['Patient', 'Doctor', 'Date/Time', 'Status']}>
            {recentActivity.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'hsl(var(--muted))' }}>No appointments scheduled.</td></tr>
            ) : (
              recentActivity.map((a) => (
                <tr key={a.id}>
                  <td style={{ color: '#0f172a', fontWeight: 600 }}>{a.patient.user.firstName} {a.patient.user.lastName}</td>
                  <td>Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</td>
                  <td>{a.appointmentDate} at {a.appointmentTime}</td>
                  <td>
                    <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Card title="Active Doctor Workload" subtitle="Total appointments managed this week">
          {workloadData.length === 0 ? (
            <div style={{ color: 'hsl(var(--muted))', textAlign: 'center', padding: '20px' }}>No diagnostic workload registered.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {workloadData.map((w, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{w.name}</span>
                    <span style={{ color: 'hsl(var(--accent))' }}>{w.appointments} appointments</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (w.appointments / 15) * 100)}%`,
                      height: '100%',
                      backgroundColor: 'hsl(var(--primary))',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
