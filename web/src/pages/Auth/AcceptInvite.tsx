import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { UserCheck, Lock, ArrowRight } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginState } = useAuth();
  
  const code = searchParams.get('code');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Invalid or missing invitation code. Please check your email link.');
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('Missing invitation code.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.acceptInvite({ code, password });
      loginState(response.accessToken);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to accept invitation. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
            <div style={{ display: 'inline-flex', padding: '1.5rem', background: 'var(--success-light)', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', color: 'var(--success)' }}>
              <UserCheck size={42} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Welcome to the Team!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Your account has been created successfully. You are being redirected to your dashboard...
            </p>
            <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Redirecting...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
               <UserCheck size={28} color="var(--primary)" />
            </div>
            <h2>Join Your Pharmacy Team</h2>
            <p style={{ color: 'var(--muted)' }}>Set your password to complete your registration.</p>
          </div>

          {!code ? (
            <div style={{ textAlign: 'center' }}>
              <div className="error-message" style={{ marginBottom: '2rem' }}>{error}</div>
              <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="password">Create Password (Min 8 chars)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    id="password" 
                    type="password" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={8}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    minLength={8}
                  />
                </div>
              </div>
              
              {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Joining team...' : 'Join Pharmacy Team'}
                <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Wait, I have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
