import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/shared/Button';
import { Spinner } from '../components/shared/Spinner';
import { db, Meeting, RuleSet, TrainingMaterial } from '../db/database';
import { apiPost } from '../services/api';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function NewMeetingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'input' | 'analyzing' | 'done'>('input');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [activeRuleSetId, setActiveRuleSetId] = useState<number | undefined>();
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    db.ruleSets.toArray().then((rs) => setRuleSets(rs.filter((r) => r.isActive)));
    db.trainingMaterials.toArray().then(setMaterials);
  }, []);

  const handleFileImport = async (file: File) => {
    setParsing(true);
    setError('');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let rawContent = '';

      if (ext === 'pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pages.push(textContent.items.map((item: any) => item.str).join(' '));
        }
        rawContent = pages.join('\n\n');
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        rawContent = result.value;
      } else {
        throw new Error(`Unsupported file type: .${ext}`);
      }

      if (!rawContent.trim()) {
        throw new Error('No text content extracted from file');
      }

      // Append to existing text or replace if empty
      setText((prev) => {
        const trimmed = prev.trim();
        if (trimmed) {
          return `${trimmed}\n\n--- Imported from ${file.name} ---\n\n${rawContent}`;
        }
        return rawContent;
      });

      // Auto-fill title from filename if empty
      if (!title.trim()) {
        setTitle(file.name.replace(/\.(pdf|docx)$/i, ''));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    } finally {
      setParsing(false);
      // Reset file input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Please paste meeting text'); return; }

    setError('');
    setStep('analyzing');

    let meetingId = 0;

    try {
      // De-identification (basic client-side)
      const activeRuleSet = ruleSets.find((r) => r.id === activeRuleSetId);
      let deidentifiedText = text;
      if (activeRuleSet?.content.roleMapping) {
        for (const mapping of activeRuleSet.content.roleMapping) {
          const escaped = mapping.rolePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'g');
          deidentifiedText = deidentifiedText.replace(regex, `[${mapping.department}]`);
        }
      }
      deidentifiedText = deidentifiedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email]');
      deidentifiedText = deidentifiedText.replace(/1[3-9]\d{9}/g, '[Phone]');

      // Save meeting
      const rawId = await db.meetings.add({
        title: title || `Meeting ${new Date().toLocaleDateString('zh-CN')}`,
        originalText: text,
        deidentifiedText,
        uploadedAt: Date.now(),
        status: 'analyzing',
        wordCount: text.split(/\s+/).length,
        activeRuleSetId,
        metadata: {},
      });
      meetingId = Number(rawId);

      // Get training snippets
      const trainingSnippets = materials
        .filter((m) => selectedMaterialIds.includes(m.id!))
        .map((m) => m.rawContent.slice(0, 800));

      // Call API
      const ruleSetContent = activeRuleSet?.content || {
        roleMapping: [],
        phaseGates: [],
        customHeuristics: [],
      };

      const result = await apiPost('/api/ai/analyze', {
        meetingText: deidentifiedText,
        trainingSnippets,
        ruleSet: ruleSetContent,
        options: { language: 'zh' },
      });

      // Save minute
      await db.minutes.add({
        meetingId,
        actionItems: (result.actionItems || []).map((item: any, idx: number) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          ownerConfirmed: false,
          userEdited: false,
          notes: '',
        })),
        rawAiResponse: JSON.stringify(result),
        generatedAt: Date.now(),
        exportHistory: [],
      });

      // Update meeting
      await db.meetings.update(meetingId, {
        status: 'completed',
        metadata: {
          sentimentScore: result.metadata?.sentimentScore ?? 0,
          actionCount: result.actionItems?.length ?? 0,
          trackUsed: result.metadata?.trackUsed ?? 'b',
          warnings: result.metadata?.warnings ?? [],
        },
      });

      setStep('done');
      navigate(`/meetings/${meetingId}`);
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      setError(msg.includes('401') || msg.includes('api key') || msg.includes('Authentication')
        ? 'API Key not configured or invalid. Please set DEEPSEEK_API_KEY in packages/backend/.env'
        : msg);
      setStep('input');
      // Mark meeting as error so it shows in history
      try { await db.meetings.update(meetingId, { status: 'error' }); } catch {}
    }
  };

  return (
    <div>
      <Header title="New Meeting" breadcrumb="Upload transcript for AI analysis" />

      {step === 'analyzing' ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spinner size={48} />
          <p style={{ marginTop: 20, color: 'var(--text-secondary)' }}>Analyzing meeting transcript...</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>This may take 30-60 seconds</p>
        </div>
      ) : (
        <div style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Hardware Review — 2024-07-15"
              style={{ width: '100%' }}
            />
          </div>

          <div className="nm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Rule Set
              </label>
              <select
                value={activeRuleSetId ?? ''}
                onChange={(e) => setActiveRuleSetId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%' }}
              >
                <option value="">-- No rule set --</option>
                {ruleSets.map((rs) => (
                  <option key={rs.id} value={rs.id}>{rs.name} (v{rs.version})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Training Context (max 3)
              </label>
              <select
                multiple
                value={selectedMaterialIds.map(String)}
                onChange={(e) => setSelectedMaterialIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))}
                style={{ width: '100%', height: 80 }}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.fileName}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Meeting Transcript
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileImport(file);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing}
                >
                  {parsing ? 'Parsing...' : 'Import PDF/DOCX'}
                </Button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your meeting transcript here, or click 'Import PDF/DOCX' above..."
              rows={16}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {text.split(/\s+/).filter(Boolean).length} words · Text is de-identified before sending to AI
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'rgba(248,81,73,0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!text.trim()}>
            Analyze Meeting
          </Button>

          <style>{`
            @media (max-width: 768px) {
              .nm-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
