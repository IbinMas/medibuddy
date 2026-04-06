import { useState, useEffect } from 'react';
import { AuditService } from '../../services/audit.service';
import { Clock, User, FileText } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  const loadLogs = async (p: number) => {
    setLoading(true);
    try {
      const response = await AuditService.list(p);
      setLogs(response.data);
      setPagination({ total: response.total, totalPages: response.totalPages });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'var(--success)';
      case 'UPDATE': return 'var(--warning)';
      case 'DELETE': return 'var(--danger)';
      default: return 'var(--primary)';
    }
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata) return 'No extra data';
    try {
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--foreground)' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>{' '}
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return String(metadata);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Audit Trail</h1>
        <p style={{ color: 'var(--muted)' }}>Track all system activities and record changes.</p>
      </header>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                <th style={{ padding: '1.25rem' }}>Timestamp</th>
                <th style={{ padding: '1.25rem' }}>User</th>
                <th style={{ padding: '1.25rem' }}>Action</th>
                <th style={{ padding: '1.25rem' }}>Entity</th>
                <th style={{ padding: '1.25rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)' }}>
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="var(--primary)" />
                        <div>
                          <div>{log.user?.email || 'System'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{log.user?.role || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: getActionColor(log.action) + '22',
                        color: getActionColor(log.action)
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} color="var(--muted)" />
                        {log.entity}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {renderMetadata(log.metadata)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem' }}>
            <Pagination 
              currentPage={page} 
              totalPages={pagination.totalPages} 
              totalItems={pagination.total} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
