interface Props {
  score?: number;
}

export function SentimentGauge({ score }: Props) {
  if (score == null) return null;

  const normalized = Math.max(-1, Math.min(1, score));
  const percent = ((normalized + 1) / 2) * 100;
  const color = normalized > 0.2 ? 'var(--accent-green)' : normalized < -0.2 ? 'var(--accent-red)' : 'var(--accent-orange)';
  const label = normalized > 0.2 ? 'Positive' : normalized < -0.2 ? 'Negative' : 'Neutral';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 120, height: 6, background: 'var(--bg-tertiary)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`, height: '100%', background: color,
          borderRadius: 3, transition: 'width 0.3s',
        }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({score.toFixed(2)})</span>
    </div>
  );
}
