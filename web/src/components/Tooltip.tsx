interface TooltipProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ message, isVisible, onClose, position = 'bottom' }: TooltipProps) {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      zIndex: 1000,
      right: 0,
      top: '100%',
      background: 'var(--primary)',
      color: 'white',
      padding: '1rem 1.25rem',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      fontSize: '0.9rem',
      fontWeight: 600,
      width: 'max-content',
      maxWidth: '280px',
      marginTop: '12px',
      animation: 'slideUpTransition 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      lineHeight: '1.4'
    }}>
      <style>{`
        @keyframes slideUpTransition {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p>{message}</p>
        <button 
          onClick={onClose}
          style={{
            alignSelf: 'flex-end',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          Got it
        </button>
      </div>
      
      {/* Small arrow */}
      <div style={{
        position: 'absolute',
        top: position === 'bottom' ? '-6px' : 'auto',
        bottom: position === 'top' ? '-6px' : 'auto',
        right: '20px',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: position === 'bottom' ? '6px solid var(--primary)' : 'none',
        borderTop: position === 'top' ? '6px solid var(--primary)' : 'none',
      }} />
    </div>
  );
}
