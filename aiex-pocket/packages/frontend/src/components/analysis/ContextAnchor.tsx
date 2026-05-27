import { useState, useRef } from 'react';

interface Props {
  text: string;
  index: number;
  originalText: string;
}

export function ContextAnchor({ text, index, originalText }: Props) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  if (!text) return null;

  const showContext = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hideContext = () => {
    timeoutRef.current = window.setTimeout(() => setVisible(false), 200);
  };

  // Extract surrounding context (~80 chars each side)
  const foundIndex = originalText.indexOf(text);
  const start = Math.max(0, (foundIndex >= 0 ? foundIndex : index) - 80);
  const end = Math.min(originalText.length, (foundIndex >= 0 ? foundIndex : index) + text.length + 80);
  const context = originalText.slice(start, end);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < originalText.length ? '...' : '';

  return (
    <span style={{ position: 'relative' }}>
      <span
        onMouseEnter={showContext}
        onMouseLeave={hideContext}
        style={{
          cursor: 'pointer', color: 'var(--accent-blue)', fontSize: 10,
          borderBottom: '1px dotted var(--accent-blue)',
        }}
      >
        Source text ▸
      </span>
      {visible && (
        <div
          onMouseEnter={showContext}
          onMouseLeave={hideContext}
          style={{
            position: 'absolute', zIndex: 500, bottom: '100%', left: 0,
            width: 380, padding: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Source Context
          </div>
          {prefix}{context}{suffix}
          <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(88,166,255,0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent-blue)' }}>
            <strong>AI extracted:</strong> "{text}"
          </div>
        </div>
      )}
    </span>
  );
}
