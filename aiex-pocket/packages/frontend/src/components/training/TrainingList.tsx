import { useEffect, useState } from 'react';
import { db, TrainingMaterial } from '../../db/database';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { EmptyState } from '../shared/EmptyState';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export function TrainingList() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    db.trainingMaterials.orderBy('parsedAt').reverse().toArray().then(setMaterials);
  }, []);

  const handleDelete = async () => {
    if (deleteTarget == null) return;
    await db.trainingMaterials.delete(deleteTarget);
    setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget));
    setDeleteTarget(null);
  };

  if (materials.length === 0) {
    return (
      <EmptyState
        icon="📁"
        title="No training materials"
        description="Upload files above to train the AI on your project context, terminology, and processes."
      />
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
        Uploaded Materials ({materials.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {materials.map((m) => (
          <div key={m.id} style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-muted)', overflow: 'hidden',
          }}>
            <div
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id!)}
              style={{
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.fileName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatSize(m.sizeBytes)} · {new Date(m.parsedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge label={m.fileType} />
                <Button variant="ghost" size="sm" style={{ color: 'var(--accent-red)', fontSize: 11 }}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(m.id!); }}>
                  Delete
                </Button>
              </div>
            </div>
            {expandedId === m.id && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-muted)' }}>
                <pre style={{
                  marginTop: 12, padding: 12, background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)', fontSize: 12,
                  fontFamily: 'var(--font-mono)', maxHeight: 300, overflow: 'auto',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.rawContent.slice(0, 2000)}
                  {m.rawContent.length > 2000 && '\n\n... (truncated)'}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete Training Material"
        message="This material will be removed from future analysis contexts. You can re-upload it later."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
