export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--accent-blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}
