import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/shared/Button';
import { Badge } from '../components/shared/Badge';
import { Spinner } from '../components/shared/Spinner';
import { ActionGrid } from '../components/analysis/ActionGrid';
import { WarningDashboard } from '../components/analysis/WarningDashboard';
import { SentimentGauge } from '../components/analysis/SentimentGauge';
import { ExportModal } from '../components/export/ExportModal';
import { db, Meeting, Minute, ActionItem } from '../db/database';

export function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [minute, setMinute] = useState<Minute | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'actions' | 'summary' | 'raw'>('actions');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const m = await db.meetings.get(Number(id));
      if (!m) { navigate('/meetings'); return; }
      setMeeting(m);
      const min = await db.minutes.where('meetingId').equals(Number(id)).first();
      setMinute(min || null);
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleSaveAction = async (updated: ActionItem) => {
    if (!minute) return;
    const newItems = minute.actionItems.map((item) =>
      item.id === updated.id ? { ...updated, userEdited: true } : item
    );
    await db.minutes.update(minute.id!, { actionItems: newItems });
    setMinute({ ...minute, actionItems: newItems });
  };

  const handleDeleteAction = async (itemId: string) => {
    if (!minute) return;
    const newItems = minute.actionItems.filter((item) => item.id !== itemId);
    await db.minutes.update(minute.id!, { actionItems: newItems });
    setMinute({ ...minute, actionItems: newItems });
  };

  const handleAddAction = async () => {
    if (!minute) return;
    const newItem: ActionItem = {
      id: crypto.randomUUID(),
      action: '',
      owner: '',
      department: '',
      priority: 'P2',
      riskLevel: 'medium',
      deadlineHint: '',
      contextAnchor: '',
      contextStartIndex: 0,
      ownerConfirmed: false,
      trackSource: 'manual',
      userEdited: true,
      notes: '',
    };
    const newItems = [...minute.actionItems, newItem];
    await db.minutes.update(minute.id!, { actionItems: newItems });
    setMinute({ ...minute, actionItems: newItems });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spinner size={40} /></div>;
  }

  if (!meeting) return null;

  const warnings = meeting.metadata.warnings || [];
  const showWarning = warnings.length > 0;

  return (
    <div>
      <Header
        title={meeting.title}
        breadcrumb={`Analyzed ${new Date(meeting.uploadedAt).toLocaleString('zh-CN')}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setShowExport(true)}>
              Export
            </Button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge
          label={meeting.status}
          color={meeting.status === 'completed' ? 'var(--accent-green)' : 'var(--text-muted)'}
          bg={meeting.status === 'completed' ? 'rgba(63,185,80,0.12)' : undefined}
        />
        <Badge label={`Track: ${meeting.metadata.trackUsed || 'b'}`} />
        <Badge label={`${meeting.metadata.actionCount || 0} actions`} />
        <div style={{ marginLeft: 'auto' }}>
          <SentimentGauge score={meeting.metadata.sentimentScore} />
        </div>
      </div>

      {showWarning && <WarningDashboard warnings={warnings} sentiment={meeting.metadata.sentimentScore} />}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-default)' }}>
        <TabBtn active={tab === 'actions'} onClick={() => setTab('actions')}>Action Items</TabBtn>
        <TabBtn active={tab === 'summary'} onClick={() => setTab('summary')}>Summary</TabBtn>
        <TabBtn active={tab === 'raw'} onClick={() => setTab('raw')}>Raw Response</TabBtn>
      </div>

      {tab === 'actions' && (
        <div>
          <ActionGrid
            items={minute?.actionItems || []}
            originalText={meeting.originalText}
            onSave={handleSaveAction}
            onDelete={handleDeleteAction}
          />
          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" size="sm" onClick={handleAddAction}>+ Add Manual Action</Button>
          </div>
        </div>
      )}

      {tab === 'summary' && minute && (
        <SummaryTab rawResponse={minute.rawAiResponse} />
      )}

      {tab === 'raw' && minute && (
        <div>
          <pre style={{
            background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)',
            fontSize: 12, fontFamily: 'var(--font-mono)', overflow: 'auto',
            maxHeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {JSON.stringify(JSON.parse(minute.rawAiResponse), null, 2)}
          </pre>
        </div>
      )}

      {showExport && minute && (
        <ExportModal
          open={showExport}
          onClose={() => setShowExport(false)}
          meeting={meeting}
          minute={minute}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', background: 'none', fontSize: 13, fontWeight: 600,
        color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
        marginBottom: -1, transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function SummaryTab({ rawResponse }: { rawResponse: string }) {
  let summary: any = {};
  try { summary = JSON.parse(rawResponse).summary || {}; } catch {}

  return (
    <div style={{ maxWidth: 700 }}>
      <Section title="Key Decisions" items={summary.keyDecisions || []} />
      <Section title="Blockers" items={summary.blockers || []} />
      {summary.nextSteps && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Next Steps</h4>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{summary.nextSteps}</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>{title}</h4>
      <ul style={{ paddingLeft: 18 }}>
        {items.map((item: string, i: number) => (
          <li key={i} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
