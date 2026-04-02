import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginState } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await AuthService.login({ email, password });
      loginState(resp.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
               <LogIn size={28} color="var(--primary)" />
            </div>
            <h2>Welcome Back</h2>
            <p style={{ color: 'var(--muted)' }}>Log in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                id="email"
                type="email" 
                className="input-control" 
                placeholder="admin@pharmacy.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                className="input-control" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            
            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Don't have a pharmacy account? <Link to="/onboard">Get Started</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
