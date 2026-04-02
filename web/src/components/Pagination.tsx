import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage = 20 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: '2rem',
      padding: '1rem',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
        Showing <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{startIdx}</span> to <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{endIdx}</span> of <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-outline"
          style={{ padding: '0.5rem', minWidth: 'auto', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', fontSize: '0.9rem' }}>
          Page <span style={{ fontWeight: 600 }}>{currentPage}</span> of <span style={{ fontWeight: 600 }}>{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-outline"
          style={{ padding: '0.5rem', minWidth: 'auto', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
