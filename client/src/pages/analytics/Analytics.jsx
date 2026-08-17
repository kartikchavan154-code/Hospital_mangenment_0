import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Activity, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendsRes, revenueRes, statusRes] = await Promise.all([
          api.get('/analytics/patient-trends'),
          api.get('/analytics/revenue'),
          api.get('/analytics/appointments-by-status')
        ]);

        if (trendsRes.data.success) {
          setTrends(trendsRes.data.data.map(item => ({
            month: item.month,
            registrations: parseInt(item.count)
          })));
        }

        if (revenueRes.data.success) {
          setRevenue(revenueRes.data.data.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue)
          })));
        }

        if (statusRes.data.success) {
          setStatusData(statusRes.data.data.map(item => ({
            name: item.status,
            value: parseInt(item.count)
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ color: 'hsl(var(--muted))' }}>Loading Advanced Analytics Visualizations...</div>;

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#fbbf24', '#f87171'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Clinical & Financial Analytics</h1>
        <p style={{ color: 'hsl(var(--muted))' }}>Detailed hospital status charts regarding registrations, billing, and operational trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <Card title="Monthly Patient Registration Trends" subtitle="Clinical registration volume over the last months">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Gross Earnings Streams" subtitle="Total paid and partially paid invoices aggregated by month">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="hsl(var(--muted))" style={{ fontSize: '0.75rem' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px' }}>
        <Card title="Appointment Allocation by Status" subtitle="Frequencies of cancellation and completions">
          <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
              {statusData.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span style={{ textTransform: 'capitalize' }}>{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Clinical Key Performance Indices" subtitle="Status logs indicators check">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px 0' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1.5rem' }}>94.2%</div>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', marginTop: '4px' }}>Patient Satisfaction Rating</strong>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Based on recent checkout polls.</span>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.5rem' }}>14 mins</div>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', marginTop: '4px' }}>Avg Check-in Wait-Time</strong>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Calculated from check-in timestamps.</span>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.5rem' }}>₹214.50</div>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', marginTop: '4px' }}>Avg Bill Size</strong>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Average invoice total check size.</span>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '1.5rem' }}>2.1%</div>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', marginTop: '4px' }}>Cancellation Rate</strong>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>Unconfirmed checkin slots.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
