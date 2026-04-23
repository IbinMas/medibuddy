import { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth.service';
import { PharmacyService } from '../../services/pharmacy.service';
import { 
  User, Settings as SettingsIcon, Users, CreditCard, 
  MapPin, Phone, Mail, Lock, Plus, RefreshCw 
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

type Tab = 'profile' | 'pharmacy' | 'team' | 'subscription';

export default function Settings() {
  const { isSubscriptionActive } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(isSubscriptionActive ? 'profile' : 'subscription');
  const [user, setUser] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Form States
  const [profileForm, setProfileForm] = useState({ email: '', password: '', currentPassword: '' });
  const [pharmacyForm, setPharmacyForm] = useState({ name: '', phone: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'PHARMACIST' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const me = await AuthService.getMe();
      setUser(me);
      setProfileForm({ ...profileForm, email: me.email });
      setPharmacyForm({ name: me.pharmacy.name, phone: me.pharmacy.phone || '' });
      const activeSubscription = !!me.pharmacy?.subscriptions?.[0] && new Date(me.pharmacy.subscriptions[0].expiresAt).getTime() > Date.now();
      if (!activeSubscription) {
        setActiveTab('subscription');
      }
      
      if (me.role === 'ADMIN') {
        const invs = await AuthService.listInvites();
        setInvites(invs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AuthService.updateProfile(profileForm);
      setMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handlePharmacyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await PharmacyService.update(user.pharmacyId, pharmacyForm);
      setMsg({ type: 'success', text: 'Pharmacy updated successfully' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AuthService.createInvite(inviteForm);
      setMsg({ type: 'success', text: 'Invite sent to ' + inviteForm.email });
      setInviteForm({ email: '', role: 'PHARMACIST' });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Invite failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Settings...</div>;

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Account & Pharmacy Settings</h1>
        <p style={{ color: 'var(--muted)' }}>Manage your personal details and pharmacy configuration.</p>
      </header>

      {msg.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '2rem',
          background: msg.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${msg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Navigation Tabs */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isSubscriptionActive && (
            <>
              <button 
                className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('profile')}
                style={{ justifyContent: 'flex-start', border: activeTab === 'profile' ? 'none' : '1px solid var(--border)' }}
              >
                <User size={18} /> My Profile
              </button>
              
              {isAdmin && (
                <>
                  <button 
                    className={`btn ${activeTab === 'pharmacy' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('pharmacy')}
                    style={{ justifyContent: 'flex-start', border: activeTab === 'pharmacy' ? 'none' : '1px solid var(--border)' }}
                  >
                    <SettingsIcon size={18} /> Pharmacy Details
                  </button>
                  <button 
                    className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('team')}
                    style={{ justifyContent: 'flex-start', border: activeTab === 'team' ? 'none' : '1px solid var(--border)' }}
                  >
                    <Users size={18} /> Team Members
                  </button>
                </>
              )}
            </>
          )}

          {isAdmin && (
            <button 
              className={`btn ${activeTab === 'subscription' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('subscription')}
              style={{ justifyContent: 'flex-start', border: 'none', background: activeTab === 'subscription' ? 'var(--primary)' : 'var(--surface)', color: activeTab === 'subscription' ? 'white' : 'var(--danger)' }}
            >
              <CreditCard size={18} /> {isSubscriptionActive ? 'Subscription & Billing' : 'SUB EXPIRED: Upgrade Now'}
            </button>
          )}
          {!isAdmin && !isSubscriptionActive && (
            <div style={{ padding: '1rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500 }}>
              Subscription Expired. Please contact your pharmacy administrator to renew access.
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="glass-panel" style={{ padding: '2rem' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} color="var(--primary)" /> Profile Information
              </h3>
              <div className="input-group">
                <label className="label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="email" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="label">Current Password (Required for changes)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="password" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="label">New Password (Leave blank to keep current)</label>
                <div style={{ position: 'relative' }}>
                  <RefreshCw size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="password" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}

          {activeTab === 'pharmacy' && (
            <form onSubmit={handlePharmacyUpdate}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SettingsIcon size={20} color="var(--primary)" /> Pharmacy Configuration
              </h3>
              {!isAdmin && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Only administrators can modify pharmacy details.</p>}
              <div className="input-group">
                <label className="label">Pharmacy Name</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={!isAdmin}
                    value={pharmacyForm.name}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="label">Contact Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={!isAdmin}
                    value={pharmacyForm.phone}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving || !isAdmin}>
                {saving ? 'Saving...' : 'Update Pharmacy'}
              </button>
            </form>
          )}

          {activeTab === 'team' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--primary)" /> Team Members
                </h3>
              </div>

              {/* Current Users */}
              <div style={{ marginBottom: '3rem' }}>
                <h4 style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active Staff</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(user.pharmacy?.users || []).map((u: any) => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.role}</div>
                      </div>
                      {u.id === user.id && <span style={{ fontSize: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>You</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Invites - Admin Only */}
              {isAdmin && (
                <div>
                  <h4 style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Invite New Member</h4>
                  <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="email" 
                        className="input-control" 
                        placeholder="pharmacist@example.com" 
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <select 
                      className="input-control" 
                      style={{ width: '150px' }}
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="ASSISTANT">Assistant</option>
                    </select>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      <Plus size={18} /> Invite
                    </button>
                  </form>

                  {invites.length > 0 && (
                    <>
                      <h4 style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Pending Invitations</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {invites.filter(i => i.status === 'PENDING').map(i => (
                          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px dotted var(--border)' }}>
                            <div style={{ fontSize: '0.9rem' }}>{i.email} <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>({i.role})</span></div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={async () => {
                                  await AuthService.resendInvite(i.id);
                                  loadData();
                                }}
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Resend
                              </button>
                              <button 
                                onClick={async () => {
                                  await AuthService.revokeInvite(i.id);
                                  loadData();
                                }}
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="animate-fade-in">
              <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Pharmacy Plans</h2>
                <p style={{ color: 'var(--muted)' }}>Choose the plan that fits your pharmacy's scale.</p>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* Free Plan */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: user.pharmacy?.plan === 'BASIC' ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Free Plan</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>For small pharmacies</p>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                    GH₵ 0 <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--muted)' }}>/30 days</span>
                  </div>
                  <ul style={{ padding: 0, listStyle: 'none', marginBottom: '2rem', flex: 1, fontSize: '0.9rem', color: 'var(--muted)' }}>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Up to 50 Patients</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Basic Reminders</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Standard Dashboard</li>
                  </ul>
                  {user.pharmacy?.plan === 'BASIC' ? (
                    <button className="btn btn-outline" disabled style={{ width: '100%' }}>Current Plan</button>
                  ) : (
                    <button className="btn btn-outline" style={{ width: '100%' }}>Select Plan</button>
                  )}
                </div>

                {/* Premium Plan */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', background: 'var(--primary-light)', border: user.pharmacy?.plan === 'PREMIUM' ? '2px solid var(--primary)' : '1px solid var(--primary-light)' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Popular</div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Premium Plan</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Grow your business</p>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                    GH₵ 100 <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--muted)' }}>/2 months</span>
                  </div>
                  <ul style={{ padding: 0, listStyle: 'none', marginBottom: '2rem', flex: 1, fontSize: '0.9rem' }}>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Unlimited Patients</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ WhatsApp & SMS Alerts</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ AI Adherence Analytics</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Unlimited Staff Members</li>
                  </ul>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('Payment gateway integration coming soon!')}>Upgrade Now</button>
                </div>

                {/* Custom Plan */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Custom Plan</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Tailored for enterprise</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', minHeight: '3rem', display: 'flex', alignItems: 'center' }}>
                    Custom Pricing
                  </div>
                  <ul style={{ padding: 0, listStyle: 'none', marginBottom: '2rem', flex: 1, fontSize: '0.9rem', color: 'var(--muted)' }}>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Multiple Branch Sync</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ Dedicated Support</li>
                    <li style={{ marginBottom: '0.75rem' }}>✓ API Access</li>
                  </ul>
                  <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Contact MediBuddy:</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <Mail size={12} /> quacinyadi@yahoo.com
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={12} /> 0245655799
                    </p>
                  </div>
                </div>
              </div>

              {user.pharmacy?.subscriptions?.[0] && (
                <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Active Subscription Details</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    Plan: <strong>{user.pharmacy.plan}</strong> • 
                    Expires: <strong>{new Date(user.pharmacy.subscriptions[0].expiresAt).toLocaleDateString()}</strong> • 
                    Status: <span style={{ color: 'var(--success)', fontWeight: 600 }}>{user.pharmacy.subscriptions[0].status}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
