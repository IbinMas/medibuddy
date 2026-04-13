import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthService } from '../../services/auth.service';
import { Building2 } from 'lucide-react';

export default function Onboard() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plan: 'BASIC',
    adminEmail: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.onboardPharmacy({
        ...formData,
        adminEmail: formData.adminEmail.toLowerCase()
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to onboard pharmacy. Try again.');
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
              <Building2 size={42} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Sucsess! Check Your Email</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              We've sent a verification link to <strong>{formData.adminEmail}</strong>. <br />
              Please verify your email to activate your workspace and log in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main className="flex-center animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
               <Building2 size={28} color="var(--primary)" />
            </div>
            <h2>Register Your Pharmacy</h2>
            <p style={{ color: 'var(--muted)' }}>Create a workspace for your team today.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="input-group">
                <label htmlFor="name">Pharmacy Name</label>
                <input id="name" type="text" className="input-control" placeholder="HealthCare Plus" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" type="tel" className="input-control" placeholder="+233 00 000 0000" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="plan">Subscription Plan</label>
              <select id="plan" className="input-control" value={formData.plan} onChange={handleChange} required>
                <option value="BASIC">Basic Plan (Free 30-day Trial)</option>
                <option value="PREMIUM" disabled>Premium Plan (Coming Soon)</option>
                <option value="ENTERPRISE" disabled>Enterprise Plan (Coming Soon)</option>
              </select>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            <div className="input-group">
              <label htmlFor="adminEmail">Admin Email Address</label>
              <input id="adminEmail" type="email" className="input-control" placeholder="admin@healthcareplus.com" value={formData.adminEmail} onChange={handleChange} required />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Admin Password (Min 8 chars)</label>
              <input id="password" type="password" className="input-control" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={8}/>
            </div>
            
            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating workspace...' : 'Register Pharmacy'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Already registered? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
