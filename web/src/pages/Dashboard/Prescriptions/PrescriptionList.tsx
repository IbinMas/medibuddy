import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PrescriptionService } from '../../../services/prescription.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { Pill, User, Calendar, ArrowRight, Search, MessageCircle, Smartphone, BellOff } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
    loadPrescriptions(1, debouncedSearch);
  }, [debouncedSearch]);

  const loadPrescriptions = async (page: number = 1, search: string = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await PrescriptionService.listAll(page, 20, search);
      setPrescriptions(response.data);
      setPagination({ total: response.total, totalPages: response.totalPages });
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && prescriptions.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Prescriptions...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>All Prescriptions</h1>
          <p style={{ color: 'var(--muted)' }}>Managing active medications across your pharmacy.</p>
        </div>
        <div className="input-group" style={{ marginBottom: 0, width: '300px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            placeholder="Search drug or patient..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Medication</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Patient</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Dosage & Frequency</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Meal Timing</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Period</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Alert Pref</th>
              <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600 }}>Delivery</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                  <Pill size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <br />No prescriptions found
                </td>
              </tr>
            ) : (
              prescriptions.map(pr => (
                <tr 
                  key={pr.id} 
                  onClick={() => navigate(`/dashboard/patients/${pr.patientId}`)}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} 
                  className="table-row-hover"
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                        <Pill size={18} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{pr.medication}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                      <User size={14} className="text-muted" />
                      {pr.patient.firstName} {pr.patient.lastName}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem' }}>{pr.dosage}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{pr.frequency}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      {pr.mealTiming ? (pr.mealTiming === 'BEFORE_MEAL' ? 'Before Meal' : 'After Meal') : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <Calendar size={14} color="var(--muted)" />
                      {new Date(pr.startDate).toLocaleDateString()} - {new Date(pr.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '1rem', 
                      background: pr.patient.notificationMedium === 'WHATSAPP' ? '#dcf8c6' : pr.patient.notificationMedium === 'SMS' ? '#e0e7ff' : '#f1f5f9',
                      color: pr.patient.notificationMedium === 'WHATSAPP' ? '#075e54' : pr.patient.notificationMedium === 'SMS' ? '#3730a3' : '#475569',
                      fontWeight: 600
                    }}>
                      {pr.patient.notificationMedium === 'WHATSAPP' && <MessageCircle size={12} />}
                      {pr.patient.notificationMedium === 'SMS' && <Smartphone size={12} />}
                      {(!pr.patient.notificationMedium || pr.patient.notificationMedium === 'NONE') && <BellOff size={12} />}
                      {pr.patient.notificationMedium || 'NONE'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '1rem', 
                      background: pr.deliveryStatus === 'DELIVERED' ? '#dcf8c6' : pr.deliveryStatus === 'FAILED' ? '#fee2e2' : '#fef3c7',
                      color: pr.deliveryStatus === 'DELIVERED' ? '#075e54' : pr.deliveryStatus === 'FAILED' ? '#991b1b' : '#92400e',
                      fontWeight: 600
                    }}>
                      {pr.deliveryStatus || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link 
                      to={`/dashboard/patients/${pr.patientId}`} 
                      className="btn btn-outline" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}
                    >
                      Patient Profile <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && prescriptions.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={(page) => loadPrescriptions(page)}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background: var(--surface-hover) !important;
        }
      `}} />
    </div>
  );
}
