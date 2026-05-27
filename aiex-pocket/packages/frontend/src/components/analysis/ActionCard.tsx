import { useState, useRef, useCallback } from 'react';
import { ActionItem } from '../../db/database';
import { OwnerStatus } from './OwnerStatus';
import { ContextAnchor } from './ContextAnchor';
import { Badge } from '../shared/Badge';

interface Props {
  item: ActionItem;
  originalText: string;
  onSave: (item: ActionItem) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<string, string> = {
  P0: '#f85149', P1: '#d2991d', P2: '#58a6ff', P3: '#8b949e',
};
const riskColors: Record<string, string> = {
  high: '#f85149', medium: '#d2991d', low: '#3fb950',
};

export function ActionCard({ item, originalText, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const draftRef = useRef<ActionItem>(item);
  if (!editing) draftRef.current = item;

  const commitEdit = useCallback(() => {
    setEditing(null);
    const draft = draftRef.current;
    if (JSON.stringify(draft) !== JSON.stringify(item)) {
      onSave({ ...draft, userEdited: true });
    }
  }, [item, onSave]);

  const toggleConfirm = useCallback(() => {
    onSave({ ...item, ownerConfirmed: !item.ownerConfirmed });
  }, [item, onSave]);

  const saveSelect = useCallback((field: keyof ActionItem, value: string) => {
    onSave({ ...item, [field]: value, userEdited: true });
  }, [item, onSave]);

  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-muted)', padding: 14,
      borderLeft: `3px solid ${priorityColors[item.priority] || '#8b949e'}`,
    }}>
      {/* Action */}
      <div style={{ marginBottom: 10 }}>
        {editing === 'action' ? (
          <input
            autoFocus
            value={draftRef.current.action}
            onChange={(e) => { draftRef.current = { ...draftRef.current, action: e.target.value }; }}
            onBlur={commitEdit}
            style={{ width: '100%', fontWeight: 600, fontSize: 14 }}
          />
        ) : (
          <div
            onClick={() => setEditing('action')}
            style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 20 }}
          >
            {item.action || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tap to edit action</span>}
          </div>
        )}
        {item.contextAnchor && (
          <div style={{ marginTop: 4 }}>
            <ContextAnchor text={item.contextAnchor} index={item.contextStartIndex} originalText={originalText} />
          </div>
        )}
      </div>

      {/* Meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 12 }}>
        {/* Owner */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Owner</div>
          {editing === 'owner' ? (
            <input
              autoFocus
              value={draftRef.current.owner}
              onChange={(e) => { draftRef.current = { ...draftRef.current, owner: e.target.value }; }}
              onBlur={commitEdit}
              style={{ width: '100%', fontSize: 12 }}
            />
          ) : (
            <div onClick={() => setEditing('owner')} style={{ cursor: 'pointer', minHeight: 18 }}>
              {item.owner || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>unassigned</span>}
            </div>
          )}
          {item.department && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.department}</span>}
        </div>

        {/* Deadline */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Deadline</div>
          {editing === 'deadlineHint' ? (
            <input
              autoFocus
              value={draftRef.current.deadlineHint}
              onChange={(e) => { draftRef.current = { ...draftRef.current, deadlineHint: e.target.value }; }}
              onBlur={commitEdit}
              style={{ width: '100%', fontSize: 12 }}
            />
          ) : (
            <div onClick={() => setEditing('deadlineHint')} style={{ cursor: 'pointer', minHeight: 18 }}>
              {item.deadlineHint || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>none</span>}
            </div>
          )}
        </div>
      </div>

      {/* Priority + Risk + Status row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={item.priority}
          onChange={(e) => saveSelect('priority', e.target.value)}
          style={{
            fontSize: 11, fontWeight: 700, padding: '4px 8px',
            color: priorityColors[item.priority], background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          }}
        >
          {['P0', 'P1', 'P2', 'P3'].map((p) => (
            <option key={p} value={p} style={{ color: priorityColors[p] }}>{p}</option>
          ))}
        </select>

        <select
          value={item.riskLevel}
          onChange={(e) => saveSelect('riskLevel', e.target.value)}
          style={{
            fontSize: 11, fontWeight: 600, padding: '4px 8px',
            color: riskColors[item.riskLevel], background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          }}
        >
          {['high', 'medium', 'low'].map((r) => (
            <option key={r} value={r} style={{ color: riskColors[r] }}>{r}</option>
          ))}
        </select>

        <OwnerStatus confirmed={item.ownerConfirmed} track={item.trackSource} onClick={toggleConfirm} />

        <Badge label={item.trackSource} bg="rgba(88,166,255,0.1)" color="var(--accent-blue)" />

        <button
          onClick={() => onDelete(item.id)}
          style={{ marginLeft: 'auto', background: 'none', color: 'var(--accent-red)', fontSize: 16, padding: 4 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
