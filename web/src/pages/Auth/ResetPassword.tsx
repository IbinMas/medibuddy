import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthService } from '../../services/auth.service';
import { KeyRound, Mail, CheckCircle, Loader2 } from 'lucide-react';

type Mode = 'request' | 'reset';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const mode: Mode = code ? 'reset' : 'request';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (code) {
      setStatus('idle');
      setMessage('');
    }
  }, [code]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const resp = await AuthService.requestPasswordReset(email.toLowerCase());
      setStatus('success');
      setMessage(resp?.message || 'If the account exists, a reset email has been sent.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Could not request a reset email.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (!code) {
      setStatus('error');
      setMessage('Missing reset code.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const resp = await AuthService.resetPassword({ code, password });
      setStatus('success');
      setMessage(resp?.message || 'Password reset successfully.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
              <KeyRound size={28} color="var(--primary)" />
            </div>
            <h2>{mode === 'reset' ? 'Reset Your Password' : 'Forgot Your Password?'}</h2>
            <p style={{ color: 'var(--muted)' }}>
              {mode === 'reset'
                ? 'Create a new password to continue.'
                : 'Enter your email and we will send a reset link if the account exists.'}
            </p>
          </div>

          {mode === 'request' ? (
            <form onSubmit={handleRequestReset}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input
                    id="email"
                    type="email"
                    className="input-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="admin@pharmacy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {status === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                  <CheckCircle size={16} />
                  <span>{message}</span>
                </div>
              )}

              {status === 'error' && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>{message}</div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  className="input-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {status === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                  <CheckCircle size={16} />
                  <span>{message}</span>
                </div>
              )}

              {status === 'error' && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>{message}</div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? 'Updating password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--muted)' }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
              Please wait...
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
