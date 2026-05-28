import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--accent-blue)', color: '#fff' },
  secondary: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
  danger: { background: 'var(--accent-red)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)' },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)' },
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 'var(--radius-md)' },
};

export function Button({ variant = 'primary', size = 'md', style, ...props }: Props) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 600,
        transition: 'opacity 0.15s',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    />
  );
}
