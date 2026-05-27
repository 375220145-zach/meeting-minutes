import { useState } from 'react';
import { ActionItem } from '../../db/database';
import { ActionRow } from './ActionRow';
import { ActionCard } from './ActionCard';

interface Props {
  items: ActionItem[];
  originalText: string;
  onSave: (item: ActionItem) => void;
  onDelete: (id: string) => void;
}

const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function ActionGrid({ items, originalText, onSave, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<keyof ActionItem>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...items].sort((a, b) => {
    if (sortKey === 'priority') {
      return sortDir === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    const va = String(a[sortKey] || '');
    const vb = String(b[sortKey] || '');
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const handleSort = (key: keyof ActionItem) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <>
      {/* Desktop table */}
      <div style={{ overflow: 'auto' }} className="desktop-only">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <Th onClick={() => handleSort('action')}>Action</Th>
              <Th onClick={() => handleSort('owner')}>Owner</Th>
              <Th onClick={() => handleSort('priority')}>Priority</Th>
              <Th onClick={() => handleSort('riskLevel')}>Risk</Th>
              <Th onClick={() => handleSort('deadlineHint')}>Deadline</Th>
              <Th style={{ width: 60 }}>Status</Th>
              <Th style={{ width: 50 }}>Src</Th>
              <Th style={{ width: 50 }}>Del</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                originalText={originalText}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setSortKey('priority'); setSortDir('asc'); }}
              style={{
                padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600,
                background: sortKey === 'priority' ? 'var(--bg-elevated)' : 'transparent',
                color: ({ P0: '#f85149', P1: '#d2991d', P2: '#58a6ff', P3: '#8b949e' })[p],
                border: '1px solid var(--border-default)',
              }}
            >
              {p}
            </button>
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
            {items.length} items
          </span>
        </div>
        {sorted.map((item) => (
          <ActionCard
            key={item.id}
            item={item}
            originalText={originalText}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function Th({ onClick, children, style }: { onClick?: () => void; children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      onClick={onClick}
      style={{
        textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600,
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
        cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </th>
  );
}
