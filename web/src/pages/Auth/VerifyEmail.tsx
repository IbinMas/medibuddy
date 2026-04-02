import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthService } from '../../services/auth.service';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        await AuthService.verifyEmail(code);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [code]);

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
          
          {status === 'loading' && (
            <div className="animate-spin-slow" style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
              <Loader2 size={48} style={{ margin: '0 auto' }} className="animate-spin" />
              <h2 style={{ marginTop: '1rem' }}>Verifying your email...</h2>
            </div>
          )}

          {status === 'success' && (
            <>
              <div style={{ color: 'var(--success)', marginBottom: '1.5rem' }}>
                <CheckCircle size={64} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ marginBottom: '1rem' }}>Verification Successful!</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
                Your email has been verified. You can now log in to your dashboard.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>
                <XCircle size={64} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ marginBottom: '1rem' }}>Verification Failed</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
                {message}
              </p>
              <Link to="/login" className="btn btn-outline" style={{ display: 'inline-block', width: '100%' }}>
                Back to Login
              </Link>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
