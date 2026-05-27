import { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/shared/Button';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { db } from '../db/database';
import { apiGet, apiPost } from '../services/api';

export function SettingsPage() {
  const [usage, setUsage] = useState({ percent: 0, usedMB: 0, quotaMB: 0 });
  const [counts, setCounts] = useState({ materials: 0, rules: 0, meetings: 0, minutes: 0 });
  const [showClear, setShowClear] = useState(false);

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    refreshStats();
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      const data = await apiGet<{ configured: boolean }>('/api/config/key/status');
      setKeyConfigured(data.configured);
    } catch {}
  };

  const refreshStats = async () => {
    const [materials, rules, meetings, minutes] = await Promise.all([
      db.trainingMaterials.count(),
      db.ruleSets.count(),
      db.meetings.count(),
      db.minutes.count(),
    ]);
    setCounts({ materials, rules, meetings, minutes });

    if ('storage' in navigator && 'estimate' in navigator) {
      const estimate = await navigator.storage.estimate();
      const used = (estimate.usage || 0) / 1024 / 1024;
      const quota = (estimate.quota || 1) / 1024 / 1024;
      setUsage({ usedMB: used, quotaMB: quota, percent: (used / quota) * 100 });
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setKeySaving(true);
    try {
      await apiPost('/api/config/key', { apiKey: apiKey.trim() });
      setKeyConfigured(true);
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } catch {}
    setKeySaving(false);
  };

  const handleClearAll = async () => {
    await Promise.all([
      db.trainingMaterials.clear(),
      db.ruleSets.clear(),
      db.meetings.clear(),
      db.minutes.clear(),
    ]);
    setShowClear(false);
    refreshStats();
  };

  const handleExportAll = async () => {
    const [materials, rules, meetings, minutes] = await Promise.all([
      db.trainingMaterials.toArray(),
      db.ruleSets.toArray(),
      db.meetings.toArray(),
      db.minutes.toArray(),
    ]);
    const blob = new Blob([JSON.stringify({ materials, rules, meetings, minutes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header title="Settings" breadcrumb="Configuration & Data Management" />

      <div style={{ maxWidth: 600 }}>
        <Section title="DeepSeek API Key">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Enter your DeepSeek API key. Get one at{' '}
            <a href="https://platform.deepseek.com" target="_blank" rel="noopener">platform.deepseek.com</a>.
            The key is stored locally on your machine and never leaves your network.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={keyConfigured ? 'Key configured (hidden)' : 'sk-xxxxxxxxxxxxxxxx'}
                style={{ width: '100%', paddingRight: 40 }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', color: 'var(--text-muted)', fontSize: 12, padding: 2,
                }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <Button onClick={handleSaveKey} disabled={!apiKey.trim()} size="sm">
              {keySaving ? '...' : keySaved ? '✓ Saved' : 'Save'}
            </Button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: keyConfigured ? 'var(--accent-green)' : 'var(--accent-red)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {keyConfigured ? 'API key configured' : 'API key not configured — analysis will fail'}
            </span>
          </div>
        </Section>

        <Section title="Storage Usage">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>{usage.usedMB.toFixed(1)} MB used</span>
            <span style={{ color: 'var(--text-muted)' }}>{usage.quotaMB.toFixed(0)} MB available</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(usage.percent, 100)}%`, height: '100%',
              background: usage.percent > 80 ? 'var(--accent-red)' : 'var(--accent-green)',
              borderRadius: 3, transition: 'width 0.3s',
            }} />
          </div>
        </Section>

        <Section title="Database Stats">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <StatRow label="Training Materials" value={String(counts.materials)} />
            <StatRow label="Rule Sets" value={String(counts.rules)} />
            <StatRow label="Meetings" value={String(counts.meetings)} />
            <StatRow label="Minutes" value={String(counts.minutes)} />
          </div>
        </Section>

        <Section title="Data Management">
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="sm" onClick={handleExportAll}>
              Export All Data (JSON)
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowClear(true)}>
              Clear All Data
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={showClear}
        title="Clear All Data"
        message="This will permanently delete all training materials, rules, meetings, and minutes. This action cannot be undone."
        confirmLabel="Clear Everything"
        onConfirm={handleClearAll}
        onCancel={() => setShowClear(false)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
