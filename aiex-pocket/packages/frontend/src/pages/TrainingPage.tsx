import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { FileUploader } from '../components/training/FileUploader';
import { TrainingList } from '../components/training/TrainingList';
import { RulesEditor } from '../components/training/RulesEditor';

export function TrainingPage() {
  const [tab, setTab] = useState<'materials' | 'rules'>('materials');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <Header title="Training Center" breadcrumb="Training Data & Rules Configuration" />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-default)', paddingBottom: 0 }}>
        <TabButton active={tab === 'materials'} onClick={() => setTab('materials')}>
          Materials
        </TabButton>
        <TabButton active={tab === 'rules'} onClick={() => setTab('rules')}>
          Rules
        </TabButton>
      </div>

      {tab === 'materials' ? (
        <div>
          <FileUploader onUploaded={() => setRefreshKey((k) => k + 1)} />
          <div style={{ marginTop: 24 }}>
            <TrainingList key={refreshKey} />
          </div>
        </div>
      ) : (
        <RulesEditor />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: 'none',
        color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
        fontWeight: 600,
        fontSize: 14,
        transition: 'all 0.15s',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}
