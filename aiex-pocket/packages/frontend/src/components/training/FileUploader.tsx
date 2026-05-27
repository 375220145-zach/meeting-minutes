import { useCallback, useState } from 'react';
import { db, TrainingMaterial } from '../../db/database';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface Props {
  onUploaded: () => void;
}

export function FileUploader({ onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const parseFile = async (file: File): Promise<TrainingMaterial> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let rawContent = '';

    if (ext === 'txt') {
      rawContent = await file.text();
    } else if (ext === 'pdf') {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const text = textContent.items.map((item: any) => item.str).join(' ');
          pages.push(text);
        }
        rawContent = pages.join('\n\n');
      } catch (err: any) {
        throw new Error(`PDF parse failed: ${err.message || 'Unknown error'}`);
      }
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheets: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          if (csvText.trim()) {
            sheets.push(`[Sheet: ${sheetName}]\n${csvText}`);
          }
        }
        rawContent = sheets.join('\n\n');
      } catch (err: any) {
        throw new Error(`XLSX parse failed: ${err.message || 'Unknown error'}`);
      }
    } else if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        rawContent = result.value;
      } catch (err: any) {
        throw new Error(`DOCX parse failed: ${err.message || 'Unknown error'}`);
      }
    } else {
      throw new Error(`Unsupported file type: .${ext}. Please use .txt, .pdf, .docx, or .xlsx`);
    }

    if (!rawContent.trim()) {
      throw new Error('No text content extracted from file');
    }

    return {
      fileName: file.name,
      fileType: ext as 'txt' | 'pdf' | 'docx' | 'xlsx',
      rawContent,
      parsedAt: Date.now(),
      sizeBytes: file.size,
      tags: [],
    };
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const material = await parseFile(file);
        await db.trainingMaterials.add(material);
      }
      onUploaded();
    } catch (err: any) {
      setError(err.message || 'Unknown error during file processing');
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  }, [onUploaded]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(88,166,255,0.05)' : 'var(--bg-secondary)',
          transition: 'all 0.2s',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⊞</div>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {uploading ? 'Processing file(s)...' : 'Drop files here or click to upload'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Supports .txt, .pdf, .docx, .xlsx — parsed locally, never leaves your machine
        </p>
        <input
          id="file-input"
          type="file"
          accept=".txt,.pdf,.docx,.xlsx"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,81,73,0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}
