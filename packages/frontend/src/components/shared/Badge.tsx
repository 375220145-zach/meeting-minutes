interface Props {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, color, bg }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        color: color || 'var(--text-primary)',
        background: bg || 'var(--bg-tertiary)',
        border: `1px solid ${bg || 'var(--border-default)'}`,
      }}
    >
      {label}
    </span>
  );
}
