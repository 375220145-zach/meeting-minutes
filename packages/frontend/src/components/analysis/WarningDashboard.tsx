interface Props {
  warnings: string[];
  sentiment?: number;
}

export function WarningDashboard({ warnings, sentiment }: Props) {
  const isNoActions = warnings.includes('NO_ACTIONS_DETECTED');
  const isHighNegative = warnings.includes('HIGH_NEGATIVITY');
  const hasOther = warnings.some((w) => w !== 'NO_ACTIONS_DETECTED' && w !== 'HIGH_NEGATIVITY');

  return (
    <div style={{
      padding: 20, marginBottom: 24,
      background: 'rgba(248,81,73,0.08)',
      border: '1px solid rgba(248,81,73,0.25)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>⚠</span>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-orange)' }}>
            Abnormal Meeting Detected
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {isNoActions && 'The AI detected this meeting may be a venting session or has no actionable content.'}
            {isHighNegative && 'The meeting has unusually high negative sentiment.'}
          </p>
        </div>
      </div>

      {isNoActions && (
        <div style={{ padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
            No effective action items were captured. The meeting may have been:
          </p>
          <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
            <li>A pure venting / complaint session</li>
            <li>A free-form brainstorming with no decisions</li>
            <li>A status update with no follow-ups needed</li>
          </ul>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 12 }}>
            Recommendation: Consider initiating an alignment meeting led by PM to clarify action items and owners.
          </p>
        </div>
      )}

      {isHighNegative && sentiment != null && (
        <div style={{ padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            Sentiment score: <strong style={{ color: 'var(--accent-red)' }}>{sentiment.toFixed(2)}</strong> (threshold: -0.6).
            The discussion appears to be emotionally charged. Below are the core conflict points detected:
          </p>
        </div>
      )}

      {hasOther && (
        <div style={{ padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
            {warnings.filter((w) => w !== 'NO_ACTIONS_DETECTED' && w !== 'HIGH_NEGATIVITY').map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
