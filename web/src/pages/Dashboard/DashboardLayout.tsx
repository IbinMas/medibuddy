import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Users, Pill, Settings as SettingsIcon, LayoutDashboard, BarChart3, Clock, AlertTriangle, ClipboardList, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function DashboardLayout() {
  const { user } = useAuth();
  
  const sub = user?.pharmacy?.subscriptions?.[0];
  const daysRemaining = sub 
    ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
    : 0;
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ 
          width: '250px', 
          background: 'var(--surface)', 
          borderRight: '1px solid var(--border)', 
          padding: '2rem 1rem',
          height: '100%',
          overflowY: 'auto'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/dashboard" end className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/dashboard/patients" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <Users size={18} /> Patients
            </NavLink>
            <NavLink to="/dashboard/prescriptions" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <Pill size={18} /> Prescriptions
            </NavLink>
            <NavLink to="/dashboard/analytics" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <BarChart3 size={18} /> Analytics
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/dashboard/audit-logs" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
                <ClipboardList size={18} /> Audit Trail
              </NavLink>
            )}
            <NavLink to="/dashboard/communications" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <MessageSquare size={18} /> Messages
            </NavLink>
            <NavLink to="/dashboard/settings" className="btn btn-outline" style={({ isActive }) => ({ justifyContent: 'flex-start', border: 'none', background: isActive ? 'var(--primary-light)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)' })}>
              <SettingsIcon size={18} /> Settings
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', background: 'var(--background)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {user?.pharmacy?.plan === 'BASIC' && daysRemaining > 0 && (
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1rem 1.5rem', 
              background: daysRemaining <= 7 ? 'var(--danger-light)' : 'var(--primary-light)', 
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${daysRemaining <= 7 ? 'var(--danger)' : 'var(--primary)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fade-in 0.5s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {daysRemaining <= 7 ? <AlertTriangle size={20} color="var(--danger)" /> : <Clock size={20} color="var(--primary)" />}
                <span style={{ fontWeight: 500, color: daysRemaining <= 7 ? 'var(--danger)' : 'var(--primary)' }}>
                  {daysRemaining} days remaining in your Free Trial. 
                  <span style={{ fontWeight: 400, marginLeft: '0.5rem', opacity: 0.8 }}>Upgrade now to avoid service interruption.</span>
                </span>
              </div>
              <Link to="/dashboard/settings" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Upgrade Now
              </Link>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
