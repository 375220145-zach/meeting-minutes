import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/shared/Button';
import { Badge } from '../components/shared/Badge';
import { EmptyState } from '../components/shared/EmptyState';
import { db, Meeting, Minute } from '../db/database';

export function DashboardPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [mtgs, mins] = await Promise.all([
        db.meetings.orderBy('uploadedAt').reverse().toArray(),
        db.minutes.toArray(),
      ]);
      setMeetings(mtgs);
      setMinutes(mins);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const completed = meetings.filter((m) => m.status === 'completed');
    const errorCount = meetings.filter((m) => m.status === 'error').length;

    // Action trend: average actions per completed meeting, grouped by week
    const weekMap = new Map<string, { count: number; actions: number }>();
    for (const m of completed) {
      const weekStart = getWeekStart(new Date(m.uploadedAt));
      const existing = weekMap.get(weekStart) || { count: 0, actions: 0 };
      existing.count++;
      existing.actions += m.metadata.actionCount || 0;
      weekMap.set(weekStart, existing);
    }
    const actionTrend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, data]) => ({
        week: week.slice(5), // "MM-DD"
        avg: Math.round(data.actions / data.count),
        count: data.count,
      }));

    // Timeline: meeting count by week (all statuses)
    const timelineMap = new Map<string, number>();
    for (const m of meetings) {
      const weekStart = getWeekStart(new Date(m.uploadedAt));
      timelineMap.set(weekStart, (timelineMap.get(weekStart) || 0) + 1);
    }
    const timeline = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, count]) => ({
        week: week.slice(5),
        count,
      }));

    // Priority distribution across all action items
    const priorityCount: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
    let totalActions = 0;
    const completedMeetingIds = new Set(completed.map((m) => m.id));
    for (const min of minutes) {
      if (completedMeetingIds.has(min.meetingId)) {
        for (const item of min.actionItems) {
          priorityCount[item.priority] = (priorityCount[item.priority] || 0) + 1;
          totalActions++;
        }
      }
    }

    return {
      total: meetings.length,
      completed: completed.length,
      error: errorCount,
      actionTrend,
      timeline,
      priorityCount,
      totalActions,
      recent: meetings.slice(0, 5),
    };
  }, [meetings, minutes]);

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />

      <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Meetings" value={String(stats.total)} color="var(--accent-blue)" />
        <StatCard label="Completed" value={String(stats.completed)} color="var(--accent-green)" />
        <StatCard label="Errors" value={String(stats.error)} color={stats.error > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <Button onClick={() => navigate('/meetings/new')}>+ New Meeting</Button>
        <Button variant="secondary" onClick={() => navigate('/training')}>Upload Training Data</Button>
      </div>

      {stats.total === 0 ? (
        <EmptyState
          icon="◫"
          title="No meetings yet"
          description="Upload your first meeting transcript to get started."
          action={<Button size="sm" onClick={() => navigate('/meetings/new')}>New Meeting</Button>}
        />
      ) : (
        <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <ChartCard title="Meeting Timeline">
            {stats.timeline.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data yet</p>
            ) : (
              <BarChart data={stats.timeline.map((t) => ({ label: t.week, value: t.count }))} color="var(--accent-blue)" maxTicks={8} />
            )}
          </ChartCard>

          <ChartCard title="Action Trend">
            {stats.actionTrend.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No completed meetings yet</p>
            ) : (
              <BarChart data={stats.actionTrend.map((t) => ({ label: t.week, value: t.avg }))} color="var(--accent-green)" suffix=" avg" maxTicks={8} />
            )}
          </ChartCard>

          <ChartCard title="Priority Distribution">
            {stats.totalActions === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No action items yet</p>
            ) : (
              <PriorityBars counts={stats.priorityCount} total={stats.totalActions} />
            )}
          </ChartCard>

          <ChartCard title="Recent Meetings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.recent.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/meetings/${m.id}`)}
                  style={{
                    padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid transparent', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(m.uploadedAt).toLocaleDateString('zh-CN')} · {m.metadata.actionCount || 0} actions
                    </div>
                  </div>
                  <Badge
                    label={m.status}
                    color={m.status === 'completed' ? 'var(--accent-green)' : m.status === 'error' ? 'var(--accent-red)' : 'var(--text-muted)'}
                    bg={m.status === 'completed' ? 'rgba(63,185,80,0.12)' : m.status === 'error' ? 'rgba(248,81,73,0.12)' : undefined}
                  />
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: 1fr !important; }
          .dash-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px 24px', border: '1px solid var(--border-muted)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 18, border: '1px solid var(--border-muted)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>{title}</h3>
      {children}
    </div>
  );
}

function BarChart({ data, color, suffix = '', maxTicks = 6 }: { data: { label: string; value: number }[]; color: string; suffix?: string; maxTicks?: number }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const step = data.length > maxTicks ? Math.ceil(data.length / maxTicks) : 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, paddingBottom: 2 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%', maxWidth: 24,
              height: `${Math.max((d.value / maxVal) * 100, 2)}%`,
              background: color, borderRadius: '2px 2px 0 0',
              opacity: 0.8,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {data.map((d, i) => (
          i % step === 0 ? (
            <div key={i} style={{ flex: step, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              {d.label}
            </div>
          ) : (
            <div key={i} style={{ flex: 1 }} />
          )
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
        max: {maxVal}{suffix}
      </div>
    </div>
  );
}

function PriorityBars({ counts, total }: { counts: Record<string, number>; total: number }) {
  const colors: Record<string, string> = { P0: '#f85149', P1: '#d2991d', P2: '#58a6ff', P3: '#8b949e' };
  return (
    <div>
      {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => {
        const pct = total > 0 ? (counts[p] / total) * 100 : 0;
        return (
          <div key={p} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: colors[p] }}>{p}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{counts[p]} items ({pct.toFixed(0)}%)</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: colors[p], borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
