import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PatientService } from '../../../services/patient.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { Plus, Users, MessageSquare, MessageCircle, PhoneCall, Search } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', allergies: '', notes: '', notificationMedium: 'NONE' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
    loadPatients(1, debouncedSearch);
  }, [debouncedSearch]);

  const loadPatients = async (page: number = 1, search: string = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await PatientService.list(page, 20, search);
      setPatients(response.data);
      setPagination({ total: response.total, totalPages: response.totalPages });
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ firstName: '', lastName: '', phone: '', allergies: '', notes: '', notificationMedium: 'NONE' });
    setShowModal(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    setEditingId(patient.id);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      allergies: patient.allergies || '',
      notes: patient.notes || '',
      notificationMedium: patient.notificationMedium || 'NONE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await PatientService.update(editingId, formData);
      } else {
        await PatientService.create(formData);
      }
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', phone: '', allergies: '', notes: '', notificationMedium: 'NONE' });
      setEditingId(null);
      loadPatients(currentPage);
    } catch (err) {
      alert(`Failed to ${editingId ? 'update' : 'add'} patient`);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Patients</h1>
          <p style={{ color: 'var(--muted)' }}>Manage your patient directory</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ marginBottom: 0, width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Search patients..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={18} /> Add Patient
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Phone</th>
              <th style={{ padding: '1rem' }}>Alert Pref</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}><Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'initial' }} /><br />No patients found</td></tr>
            ) : (
              patients.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => navigate(`/dashboard/patients/${p.id}`)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{p.firstName} {p.lastName}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{p.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    {p.notificationMedium === 'SMS' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                        <MessageSquare size={13} /> SMS
                      </span>
                    )}
                    {p.notificationMedium === 'WHATSAPP' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#dcf8c6', color: '#075e54', fontWeight: 600 }}>
                        <MessageCircle size={13} /> WhatsApp
                      </span>
                    )}
                    {p.notificationMedium === 'VOICE' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#e0f2fe', color: '#0284c7', fontWeight: 600 }}>
                        <PhoneCall size={13} /> Voice
                      </span>
                    )}
                    {p.notificationMedium === 'NONE' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--border)', color: 'var(--muted)', fontWeight: 600 }}>
                        None
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => handleOpenEditModal(e, p)} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <Link to={`/dashboard/patients/${p.id}`} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View Details</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && patients.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={(page) => loadPatients(page)}
          />
        )}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'var(--background)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Patient' : 'Add New Patient'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>First Name</label>
                  <input type="text" className="input-control" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input type="text" className="input-control" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" className="input-control" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Notification Preference</label>
                <select className="input-control" value={formData.notificationMedium} onChange={e => setFormData({...formData, notificationMedium: e.target.value})}>
                  <option value="NONE">None</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP" disabled={user?.pharmacy?.plan === 'BASIC'}>
                    WhatsApp {user?.pharmacy?.plan === 'BASIC' ? '(Premium)' : ''}
                  </option>
                  <option value="VOICE" disabled>Voice Call (Coming in V2)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Allergies (Optional)</label>
                <input type="text" className="input-control" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update Patient' : 'Save Patient'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
