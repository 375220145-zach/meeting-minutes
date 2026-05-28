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
  P0: '#f85149',
  P1: '#d2991d',
  P2: '#58a6ff',
  P3: '#8b949e',
};

const riskColors: Record<string, string> = {
  high: '#f85149',
  medium: '#d2991d',
  low: '#3fb950',
};

export function ActionRow({ item, originalText, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const draftRef = useRef<ActionItem>(item);

  // Keep ref in sync with prop changes when not editing
  if (!editing) {
    draftRef.current = item;
  }

  const handleEdit = useCallback((field: string) => {
    draftRef.current = { ...item };
    setEditing(field);
  }, [item]);

  const commitEdit = useCallback(() => {
    setEditing(null);
    const draft = draftRef.current;
    if (JSON.stringify(draft) !== JSON.stringify(item)) {
      onSave({ ...draft, userEdited: true });
    }
  }, [item, onSave]);

  const updateDraft = useCallback((field: keyof ActionItem, value: string) => {
    draftRef.current = { ...draftRef.current, [field]: value };
    // Force re-render to show updated value in input
    setEditing((prev) => prev); // triggers re-render but keeps editing state
  }, []);

  const toggleConfirm = useCallback(() => {
    onSave({ ...item, ownerConfirmed: !item.ownerConfirmed });
  }, [item, onSave]);

  const saveSelect = useCallback((field: keyof ActionItem, value: string) => {
    setEditing(null);
    onSave({ ...item, [field]: value, userEdited: true });
  }, [item, onSave]);

  const editableCell = (field: keyof ActionItem, display: string, style?: React.CSSProperties) => {
    if (editing === field) {
      return (
        <input
          autoFocus
          value={String(draftRef.current[field] || '')}
          onChange={(e) => updateDraft(field, e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
          style={{ width: '100%', ...style }}
        />
      );
    }
    return (
      <span
        onClick={() => handleEdit(field)}
        style={{ cursor: 'pointer', display: 'block', minHeight: 20, ...style }}
        title="Click to edit"
      >
        {display || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>empty</span>}
      </span>
    );
  };

  const selectCell = (field: keyof ActionItem, value: string, options: string[]) => {
    return (
      <select
        value={value}
        onChange={(e) => saveSelect(field, e.target.value)}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--border-default)',
          color: field === 'priority' ? priorityColors[value] : riskColors[value],
          fontWeight: 600,
          fontSize: 12,
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ color: field === 'priority' ? priorityColors[o] : riskColors[o] }}>
            {o}
          </option>
        ))}
      </select>
    );
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--border-muted)', transition: 'background 0.1s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '10px 12px', maxWidth: 300 }}>
        {editableCell('action', item.action)}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          <ContextAnchor text={item.contextAnchor} index={item.contextStartIndex} originalText={originalText} />
        </div>
      </td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        {editableCell('owner', item.owner)}
        {item.department && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.department}</div>}
      </td>
      <td style={{ padding: '10px 12px', minWidth: 70 }}>
        {selectCell('priority', item.priority, ['P0', 'P1', 'P2', 'P3'])}
      </td>
      <td style={{ padding: '10px 12px', minWidth: 80 }}>
        {selectCell('riskLevel', item.riskLevel, ['high', 'medium', 'low'])}
      </td>
      <td style={{ padding: '10px 12px', minWidth: 100 }}>
        {editableCell('deadlineHint', item.deadlineHint)}
      </td>
      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
        <OwnerStatus confirmed={item.ownerConfirmed} track={item.trackSource} onClick={toggleConfirm} />
      </td>
      <td style={{ padding: '10px 4px' }}>
        <Badge label={item.trackSource} bg="rgba(88,166,255,0.1)" color="var(--accent-blue)" />
      </td>
      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
        <button
          onClick={() => onDelete(item.id)}
          style={{ background: 'none', color: 'var(--text-muted)', fontSize: 18, padding: '2px 6px', cursor: 'pointer' }}
          title="Delete this item"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
