import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area,
  ComposedChart, ReferenceLine
} from 'recharts';
import { AnalyticsService } from '../../services/analytics.service';
import { Bell, TrendingUp, CheckCircle, Package, Activity, DollarSign } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AnalyticsService.getSummary();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Analytics Overview...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Analytics Overview</h1>
        <p style={{ color: 'var(--muted)' }}>Real-time business intelligence for your pharmacy.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* Row 1: Growth & Notifications */}
        <div className="glass-panel" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <TrendingUp size={18} color="var(--primary)" /> Patient Growth Trends
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={data.patientTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} />
              <YAxis stroke="var(--muted)" fontSize={11} />
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
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Bell size={18} color="var(--secondary)" /> Notification Medium Distribution
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data.notificationDistribution}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={8}
                dataKey="count"
                nameKey="medium"
                animationBegin={200}
                animationDuration={1200}
              >
                {data.notificationDistribution.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Row 2: Adherence & Inventory */}
        <div className="glass-panel" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <CheckCircle size={18} color="var(--success)" /> Patient Adherence Rate
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data.adherence}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="status"
              >
                <Cell fill="var(--success)" />
                <Cell fill="var(--danger)" />
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--foreground)', fontSize: '1.2rem', fontWeight: 600 }}>
                {Math.round((data.adherence.find((a: any) => a.status === 'Taken')?.count / (data.adherence.reduce((acc: any, curr: any) => acc + curr.count, 0) || 1)) * 100)}%
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Package size={18} color="var(--warning)" /> Top Prescribed Medications
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart layout="vertical" data={data.topMeds}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="var(--muted)" fontSize={11} width={100} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="var(--warning)" radius={[0, 4, 4, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Row 3: Operational Activity Peaks */}
        <div className="glass-panel" style={{ height: '380px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Activity size={18} color="var(--primary)" /> Hourly Operational Peaks
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={data.hourlyActivity}>
              <defs>
                <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="var(--muted)" fontSize={11} tickFormatter={(h) => `${h}:00`} />
              <YAxis stroke="var(--muted)" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#colorHour)" strokeWidth={2} />
              <ReferenceLine x={12} stroke="var(--muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Midday', fill: 'var(--muted)', fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Row 4: Financial Performance */}
        <div className="glass-panel" style={{ height: '400px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <DollarSign size={18} color="var(--success)" /> Revenue vs Transaction Volume (Last 15 Days)
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={data.revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
              <YAxis yAxisId="left" orientation="left" stroke="var(--success)" fontSize={11} label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: 'var(--success)', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--secondary)" fontSize={11} label={{ value: 'Transactions', angle: 90, position: 'insideRight', fill: 'var(--secondary)', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={35} name="Total Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="var(--secondary)" strokeWidth={3} name="Tx Count" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
