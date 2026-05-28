import { useEffect, useState } from 'react';
import { db, RuleSet, RuleSetContent, RoleMappingEntry, PhaseGate, HeuristicRule } from '../../db/database';
import { Button } from '../shared/Button';

const defaultTemplate: RuleSetContent = {
  roleMapping: [
    { rolePattern: '', department: '', defaultPriority: 'P2' as const, weight: 0.5 },
  ],
  phaseGates: [
    { phaseName: '', tolerancePercent: 10, gateCriteria: '' },
  ],
  customHeuristics: [
    { name: '', triggerPattern: '', suggestedAction: '', priority: 'P1' as const, riskLevel: 'medium' as const },
  ],
};

export function RulesEditor() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<RuleSetContent>(defaultTemplate);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.ruleSets.orderBy('updatedAt').reverse().toArray().then((rs) => {
      setRuleSets(rs);
      const active = rs.find((r) => r.isActive);
      if (active) {
        setSelectedId(active.id!);
        setName(active.name);
        setEditing(active.content);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (selectedId != null) {
      const existing = await db.ruleSets.get(selectedId);
      await db.ruleSets.update(selectedId, {
        content: editing,
        name,
        version: (existing?.version || 1) + 1,
        updatedAt: Date.now(),
      });
    } else {
      const rawId = await db.ruleSets.add({
        name: name || 'Untitled Rule Set',
        version: 1,
        content: editing,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
      setSelectedId(Number(rawId));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const rs = await db.ruleSets.orderBy('updatedAt').reverse().toArray();
    setRuleSets(rs);
  };

  const handleNew = () => {
    setSelectedId(null);
    setName('');
    setEditing(defaultTemplate);
  };

  const addRoleMapping = () => {
    setEditing((prev) => ({
      ...prev,
      roleMapping: [...prev.roleMapping, { rolePattern: '', department: '', defaultPriority: 'P2' as const, weight: 0.5 }],
    }));
  };

  const updateRoleMapping = (idx: number, field: keyof RoleMappingEntry, value: string | number) => {
    setEditing((prev) => {
      const items = [...prev.roleMapping];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, roleMapping: items };
    });
  };

  const removeRoleMapping = (idx: number) => {
    setEditing((prev) => ({ ...prev, roleMapping: prev.roleMapping.filter((_, i) => i !== idx) }));
  };

  const addPhaseGate = () => {
    setEditing((prev) => ({
      ...prev,
      phaseGates: [...prev.phaseGates, { phaseName: '', tolerancePercent: 10, gateCriteria: '' }],
    }));
  };

  const updatePhaseGate = (idx: number, field: keyof PhaseGate, value: string | number) => {
    setEditing((prev) => {
      const items = [...prev.phaseGates];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, phaseGates: items };
    });
  };

  const removePhaseGate = (idx: number) => {
    setEditing((prev) => ({ ...prev, phaseGates: prev.phaseGates.filter((_, i) => i !== idx) }));
  };

  const addHeuristic = () => {
    setEditing((prev) => ({
      ...prev,
      customHeuristics: [...prev.customHeuristics, { name: '', triggerPattern: '', suggestedAction: '', priority: 'P1' as const, riskLevel: 'medium' as const }],
    }));
  };

  const updateHeuristic = (idx: number, field: keyof HeuristicRule, value: string) => {
    setEditing((prev) => {
      const items = [...prev.customHeuristics];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, customHeuristics: items };
    });
  };

  const removeHeuristic = (idx: number) => {
    setEditing((prev) => ({ ...prev, customHeuristics: prev.customHeuristics.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading rules...</div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rule set name (e.g. Q3 Planning Rules)"
          style={{ flex: 1 }}
        />
        <Button onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</Button>
        <Button variant="secondary" onClick={handleNew}>New</Button>
      </div>

      {ruleSets.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ruleSets.map((rs) => (
            <button
              key={rs.id}
              onClick={() => { setSelectedId(rs.id!); setName(rs.name); setEditing(rs.content); }}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
                background: selectedId === rs.id ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: selectedId === rs.id ? '#fff' : 'var(--text-secondary)',
                border: selectedId === rs.id ? 'none' : '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              {rs.name} (v{rs.version})
            </button>
          ))}
        </div>
      )}

      <FormSection title="Role Mapping Matrix" onAdd={addRoleMapping} addLabel="+ Add Role">
        {editing.roleMapping.length === 0 && (
          <EmptyHint>Map nicknames to departments. e.g. "张三" → "SCM"</EmptyHint>
        )}
        {editing.roleMapping.map((rm, i) => (
          <div key={i} className="re-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="Pattern (e.g. 张三)" value={rm.rolePattern} onChange={(e) => updateRoleMapping(i, 'rolePattern', e.target.value)} />
            <input placeholder="Department (e.g. SCM)" value={rm.department} onChange={(e) => updateRoleMapping(i, 'department', e.target.value)} />
            <select value={rm.defaultPriority} onChange={(e) => updateRoleMapping(i, 'defaultPriority', e.target.value)}>
              <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
            </select>
            <input type="number" min={0} max={1} step={0.1} value={rm.weight} onChange={(e) => updateRoleMapping(i, 'weight', parseFloat(e.target.value))} />
            <button onClick={() => removeRoleMapping(i)} style={{ background: 'none', color: 'var(--accent-red)', fontSize: 16, padding: 4 }}>
              ×
            </button>
          </div>
        ))}
      </FormSection>

      <FormSection title="Phase & Tolerance Gates" onAdd={addPhaseGate} addLabel="+ Add Phase Gate">
        {editing.phaseGates.length === 0 && (
          <EmptyHint>Set project phase watermarks. e.g. "DVT" / 15% tolerance</EmptyHint>
        )}
        {editing.phaseGates.map((pg, i) => (
          <div key={i} className="re-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="Phase (e.g. EVT)" value={pg.phaseName} onChange={(e) => updatePhaseGate(i, 'phaseName', e.target.value)} />
            <input type="number" placeholder="Tolerance %" value={pg.tolerancePercent} onChange={(e) => updatePhaseGate(i, 'tolerancePercent', parseFloat(e.target.value) || 0)} />
            <input placeholder="Gate criteria" value={pg.gateCriteria} onChange={(e) => updatePhaseGate(i, 'gateCriteria', e.target.value)} />
            <button onClick={() => removePhaseGate(i)} style={{ background: 'none', color: 'var(--accent-red)', fontSize: 16, padding: 4 }}>
              ×
            </button>
          </div>
        ))}
      </FormSection>

      <FormSection title="Custom Heuristic Rules" onAdd={addHeuristic} addLabel="+ Add Heuristic Rule">
        {editing.customHeuristics.length === 0 && (
          <EmptyHint>Define trigger patterns. e.g. "供应商没确认" → Critical / SCM</EmptyHint>
        )}
        {editing.customHeuristics.map((hr, i) => (
          <div key={i} className="re-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="Rule name" value={hr.name} onChange={(e) => updateHeuristic(i, 'name', e.target.value)} />
            <input placeholder="Trigger pattern" value={hr.triggerPattern} onChange={(e) => updateHeuristic(i, 'triggerPattern', e.target.value)} />
            <input placeholder="Suggested action" value={hr.suggestedAction} onChange={(e) => updateHeuristic(i, 'suggestedAction', e.target.value)} />
            <select value={hr.priority} onChange={(e) => updateHeuristic(i, 'priority', e.target.value)}>
              <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
            </select>
            <select value={hr.riskLevel} onChange={(e) => updateHeuristic(i, 'riskLevel', e.target.value)}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <button onClick={() => removeHeuristic(i)} style={{ background: 'none', color: 'var(--accent-red)', fontSize: 16, padding: 4 }}>
              ×
            </button>
          </div>
        ))}
      </FormSection>

      <style>{`
        @media (max-width: 768px) {
          .re-row { grid-template-columns: 1fr !important; }
          .re-row button:last-child {
            grid-column: 1;
            justify-self: end;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

function FormSection({ title, onAdd, addLabel, children }: { title: string; onAdd: () => void; addLabel: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <Button variant="ghost" size="sm" onClick={onAdd}>{addLabel}</Button>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 14px', marginBottom: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
      {children}
    </div>
  );
}
