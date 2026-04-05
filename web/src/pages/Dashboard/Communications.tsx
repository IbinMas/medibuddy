import { useState, useEffect } from 'react';
import { CommunicationService } from '../../services/communication.service';
import { useDebounce } from '../../hooks/useDebounce';
import { MessageSquare, MessageCircle, Clock, CheckCircle, AlertCircle, Search, Calendar } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Communications() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    setCurrentPage(1);
    loadLogs(1, debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter]);

  const loadLogs = async (page: number = 1, search: string = debouncedSearch, status: string = statusFilter) => {
    setLoading(true);
    try {
      const response = await CommunicationService.getLogs(page, 20, status, search);
      setLogs(response.data);
      setPagination({ total: response.total, totalPages: response.totalPages });
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#dcf8c6', color: '#075e54', fontWeight: 600 }}>
            <CheckCircle size={12} /> Delivered
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
            <AlertCircle size={12} /> Failed
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
            <Clock size={12} /> Sent
          </span>
        );
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Message Logs</h1>
          <p style={{ color: 'var(--muted)' }}>Track all communications sent to patients</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="input-control" 
            style={{ width: '150px', marginBottom: 0 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
          <div className="input-group" style={{ marginBottom: 0, width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Search messages..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem' }}>Patient</th>
              <th style={{ padding: '1rem' }}>Medium</th>
              <th style={{ padding: '1rem' }}>Message Content</th>
              <th style={{ padding: '1rem' }}>Sent At</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}><MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'initial' }} /><br />No message activity found</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color var(--transition-fast)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{log.patient?.firstName} {log.patient?.lastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>{log.patient?.phone}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {log.medium === 'SMS' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <MessageSquare size={14} /> SMS
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', fontWeight: 600 }}>
                        <MessageCircle size={14} /> WhatsApp
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: 'var(--muted)' }} title={log.content}>
                      {log.content}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)' }}>
                      <Calendar size={14} /> {formatDateTime(log.createdAt)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {getStatusBadge(log.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && logs.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={(page) => loadLogs(page)}
          />
        )}
      </div>
    </div>
  );
}
