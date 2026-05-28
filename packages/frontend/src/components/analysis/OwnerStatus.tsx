interface Props {
  confirmed: boolean;
  track: string;
  onClick: () => void;
}

export function OwnerStatus({ confirmed, track, onClick }: Props) {
  if (track === 'manual') return null;

  return (
    <button
      onClick={onClick}
      title={confirmed ? 'Owner confirmed' : 'Owner unconfirmed — click to toggle'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: '50%',
        background: confirmed ? 'rgba(63,185,80,0.15)' : 'rgba(210,153,29,0.15)',
        border: `2px solid ${confirmed ? 'var(--accent-green)' : 'var(--accent-orange)'}`,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 14, color: confirmed ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
        {confirmed ? '✓' : '?'}
      </span>
    </button>
  );
}
