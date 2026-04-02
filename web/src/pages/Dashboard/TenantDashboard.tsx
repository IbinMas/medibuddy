import { useState, useEffect } from 'react';
import { Activity, Users, FileText, Ban, TrendingUp } from 'lucide-react';
import { DashboardService } from '../../services/dashboard.service';
import { AnalyticsService } from '../../services/analytics.service';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

export default function TenantDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [pharmacyName, setPharmacyName] = useState('MediBuddy');
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [dashData, analyticsData] = await Promise.all([
          DashboardService.getSummary(),
          AnalyticsService.getSummary()
        ]);
        setMetrics(dashData.metrics);
        setPharmacyName(dashData.pharmacy?.name || 'MediBuddy');
        setTrends(analyticsData.patientTrends);
        setDistribution(analyticsData.notificationDistribution);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const stats = [
    { label: 'Total Patients', value: metrics?.patients?.toString() || '0', icon: <Users size={24} color="var(--primary)" />, trend: 'Live from database' },
    { label: 'Prescriptions', value: metrics?.prescriptions?.toString() || '0', icon: <FileText size={24} color="var(--success)" />, trend: 'Active records' },
    { label: 'Transactions', value: metrics?.transactions?.toString() || '0', icon: <Activity size={24} color="var(--warning)" />, trend: 'Payment records' },
    { label: 'Audit Logs', value: metrics?.auditLogs?.toString() || '0', icon: <Ban size={24} color="var(--error)" />, trend: 'System activity' },
  ];

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading metrics...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Welcome to {pharmacyName}</h1>
        <p style={{ color: 'var(--muted)' }}>Here is what's happening in your pharmacy today.</p>
      </header>
      
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{stat.label}</span>
              <div style={{ padding: '0.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                {stat.icon}
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{stat.value}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-light)' }}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Real Chart Area */}
      <div className="glass-panel" style={{ height: '400px', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="var(--primary)" /> Patient Registration Trends
        </h3>
        <div style={{ width: '100%', height: '80%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="var(--primary)" 
                strokeWidth={3} 
                dot={{ r: 4, fill: 'var(--primary)' }} 
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Operations Summary Bar Chart */}
        <div className="glass-panel" style={{ height: '400px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--success)" /> Operations Summary
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={[
              { name: 'Patients', value: metrics?.patients || 0 },
              { name: 'Scripts', value: metrics?.prescriptions || 0 },
              { name: 'Payments', value: metrics?.transactions || 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} />
              <Tooltip cursor={{fill: 'var(--surface-hover)'}} />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Preference Pie Chart */}
        <div className="glass-panel" style={{ height: '400px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--secondary)" /> Alert Preferences
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="medium"
              >
                {distribution.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
