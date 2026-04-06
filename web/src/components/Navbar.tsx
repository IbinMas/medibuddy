import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, Menu } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logoutState } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutState();
    navigate('/');
  };

  return (
    <nav className="glass-panel" style={{ 
      padding: '0.75rem 1.5rem', 
      borderBottom: '1px solid var(--border)',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '65px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated && (
          <button 
            className="visible-mobile btn" 
            style={{ padding: '0.5rem', border: 'none', background: 'transparent' }}
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          >
            <Menu size={24} />
          </button>
        )}
        <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
          <Activity size={24} />
          <span className="hidden-mobile">MediBuddy</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="hidden-mobile btn btn-outline" style={{ border: 'none' }}>Dashboard</Link>
            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline" style={{ border: 'none' }}>Login</Link>
            <Link to="/onboard" className="btn btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
