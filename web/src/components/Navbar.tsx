import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logoutState } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutState();
    navigate('/');
  };

  return (
    <nav style={{ 
      padding: '1.25rem 2rem', 
      borderBottom: '1px solid var(--border)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
        <Activity size={24} />
        MediBuddy
      </Link>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none' }}>Dashboard</Link>
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
