import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/shared/Button';
import { Badge } from '../components/shared/Badge';
import { EmptyState } from '../components/shared/EmptyState';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { db, Meeting } from '../db/database';

export function HistoryPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    db.meetings.orderBy('uploadedAt').reverse().toArray().then(setMeetings);
  }, []);

  const handleDelete = async () => {
    if (deleteTarget == null) return;
    await db.minutes.where('meetingId').equals(deleteTarget).delete();
    await db.meetings.delete(deleteTarget);
    setMeetings((prev) => prev.filter((m) => m.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const filtered = meetings.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <Header title="Meeting History" />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings..."
          style={{ width: 300 }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="analyzing">Analyzing</option>
          <option value="error">Error</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="☰"
          title="No meetings found"
          description={search ? 'Try a different search term.' : 'Upload your first meeting to get started.'}
          action={!search ? <Button size="sm" onClick={() => navigate('/meetings/new')}>New Meeting</Button> : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '14px 18px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-muted)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/meetings/${m.id}`)}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(m.uploadedAt).toLocaleString('zh-CN')} · {m.wordCount} words
                  {m.metadata.actionCount != null && ` · ${m.metadata.actionCount} actions`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge
                  label={m.status}
                  color={m.status === 'completed' ? 'var(--accent-green)' : m.status === 'error' ? 'var(--accent-red)' : 'var(--text-muted)'}
                  bg={m.status === 'completed' ? 'rgba(63,185,80,0.12)' : m.status === 'error' ? 'rgba(248,81,73,0.12)' : undefined}
                />
                <Button variant="ghost" size="sm" onClick={() => navigate(`/meetings/${m.id}`)}>
                  View
                </Button>
                <Button variant="ghost" size="sm" style={{ color: 'var(--accent-red)' }} onClick={() => setDeleteTarget(m.id!)}>
                  Del
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete Meeting"
        message="This will permanently delete the meeting and its analysis results. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
