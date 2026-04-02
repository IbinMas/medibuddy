import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ShieldCheck, Zap, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container animate-fade-in" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Next-Gen Pharmacy Management
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Streamline operations, track prescriptions, and scale your healthcare business with our multi-tenant SaaS platform.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/onboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Register Pharmacy
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Staff Login
              </Link>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          <div className="glass-panel" style={{ transition: 'transform 0.25s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
            <Zap size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3>Lightning Fast</h3>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Built on modern infrastructure to give you instant access to your records when it matters most.</p>
          </div>
          <div className="glass-panel" style={{ transition: 'transform 0.25s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
            <ShieldCheck size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3>Data Security</h3>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Military-grade encryption for all patient and prescription data. Your data is isolated and safe.</p>
          </div>
          <div className="glass-panel" style={{ transition: 'transform 0.25s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
            <Users size={32} color="var(--warning)" style={{ marginBottom: '1rem' }} />
            <h3>Seamless Teams</h3>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Invite your staff, assign distinct roles, and collaborate effortlessly across your pharmacy branches.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
