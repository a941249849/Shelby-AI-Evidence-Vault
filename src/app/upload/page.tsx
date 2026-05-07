'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { shelbyUploadAction, getShelbyModeAction } from '@/app/actions/upload';
import { parseTags, buildEvidencePack, buildBlobRecord } from '@/lib/validation';
import { addLocalPack, addLocalBlob } from '@/lib/store/local-store';
import { formatBytes } from '@/lib/utils';

type Category = 'dataset' | 'agent-run' | 'document' | 'manifest';
type SourceType = 'web-scrape' | 'api-export' | 'agent-output' | 'manual-upload';

interface FormState {
  title: string;
  category: Category;
  sourceType: SourceType;
  tags: string;
  description: string;
}

/** Represents a file in the upload queue along with its SHA-256 computation state. */
interface UploadFileEntry {
  file: File;
  hash: string | null;
  hashStatus: 'pending' | 'computing' | 'done' | 'error';
}

/** Represents the result state shown after a successful upload. */
interface UploadedResult {
  packId: string;
  packTitle: string;
  blobIds: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ModeIndicator({ mode }: { mode: 'mock' | 'testnet' | null }) {
  if (mode === null) return null;
  if (mode === 'testnet') {
    return (
      <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-800/60 text-amber-300 text-sm rounded-lg px-4 py-3 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
        <span className="text-xs leading-relaxed">
          <strong className="text-amber-300 font-semibold">Real Shelby upload blocked until M2</strong>
          {' '}— Official integration requires commitment generation, on-chain registration, RPC
          upload, network selection, signer/wallet design, API key handling, and funding. Uploads
          will fail with a clear error. Set{' '}
          <code className="font-mono text-xs bg-amber-900/40 px-1 rounded">SHELBY_MODE=mock</code>{' '}
          for local demo mode.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 text-slate-300 text-sm rounded-lg px-4 py-3 mb-8">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
      <span className="text-xs leading-relaxed">
        <strong className="text-slate-200 font-semibold">Local demo upload</strong>
        {' '}— Files are hashed in-browser and saved to localStorage with a deterministic{' '}
        <code className="font-mono text-xs text-cyan-400">shelby://mock/blob/{'{id}'}</code>{' '}
        reference. No wallet signing, no network calls, no real Shelby integration in M1B.
      </span>
    </div>
  );
}

// Shared input class
const inputCls =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500';
const labelCls = 'block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

export default function UploadPage() {
  const [form, setForm] = useState<FormState>({
    title: '',
    category: 'dataset',
    sourceType: 'manual-upload',
    tags: '',
    description: '',
  });
  const [files, setFiles] = useState<UploadFileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadedResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'mock' | 'testnet' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load adapter mode on mount
  useEffect(() => {
    getShelbyModeAction().then(setMode).catch(() => setMode('mock'));
  }, []);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setUploadError(
        `${oversized.length} file(s) skipped: files must be ≤ ${formatBytes(MAX_FILE_SIZE)}.`
      );
    }
    const entries: UploadFileEntry[] = valid.map((f) => ({
      file: f,
      hash: null,
      hashStatus: 'pending',
    }));
    setFiles((prev) => [...prev, ...entries]);

    // Compute hashes asynchronously
    entries.forEach((entry) => {
      setFiles((prev) => {
        const next = [...prev];
        const pos = next.findIndex((e) => e.file === entry.file);
        if (pos !== -1) next[pos] = { ...next[pos], hashStatus: 'computing' };
        return next;
      });
      computeSHA256(entry.file)
        .then((hash) => {
          setFiles((prev) => {
            const next = [...prev];
            const pos = next.findIndex((e) => e.file === entry.file);
            if (pos !== -1) next[pos] = { ...next[pos], hash, hashStatus: 'done' };
            return next;
          });
        })
        .catch(() => {
          setFiles((prev) => {
            const next = [...prev];
            const pos = next.findIndex((e) => e.file === entry.file);
            if (pos !== -1) next[pos] = { ...next[pos], hashStatus: 'error' };
            return next;
          });
        });
    });
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length) addFiles(chosen);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);

    if (!form.title.trim()) {
      setUploadError('Pack title is required.');
      return;
    }
    if (files.length === 0) {
      setUploadError('Please select at least one file.');
      return;
    }
    const notReady = files.some((f) => f.hashStatus !== 'done');
    if (notReady) {
      setUploadError('Please wait for SHA-256 computation to complete.');
      return;
    }

    setUploading(true);

    try {
      const tags = parseTags(form.tags);

      // Build the pack first
      const pack = buildEvidencePack({
        title: form.title,
        category: form.category,
        sourceType: form.sourceType,
        tags,
        description: form.description,
        blobCount: files.length,
      });

      const blobIds: string[] = [];

      for (const entry of files) {
        const hash = entry.hash!;
        const mimeType = entry.file.type || 'application/octet-stream';

        // Read file content as base64 so the adapter interface can carry it.
        // The mock adapter ignores content; a real testnet adapter (M2+) uses it.
        let content: string | undefined;
        try {
          const buffer = await entry.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // Chunk the conversion to avoid stack overflows on large files.
          const chunkSize = 0x8000; // 32 KB
          let binary = '';
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          content = btoa(binary);
        } catch {
          // If reading fails, proceed without content (mock mode is unaffected)
          content = undefined;
        }

        const actionResult = await shelbyUploadAction(
          hash,
          entry.file.size,
          {
            packId: pack.id,
            fileName: entry.file.name,
            mimeType,
          },
          content
        );

        if (!actionResult.success) {
          throw new Error(actionResult.error);
        }

        const blob = buildBlobRecord({
          evidencePackId: pack.id,
          hash,
          shelbyRef: actionResult.result.shelbyRef,
          mockRef: actionResult.result.mockRef,
          fileName: entry.file.name,
          size: entry.file.size,
          mimeType,
          tags,
          uploadMode: actionResult.mode,
          network: actionResult.result.network,
        });

        addLocalBlob(blob);
        blobIds.push(blob.id);
      }

      addLocalPack(pack);
      setUploadResult({ packId: pack.id, packTitle: pack.title, blobIds });
      setFiles([]);
      setForm({
        title: '',
        category: 'dataset',
        sourceType: 'manual-upload',
        tags: '',
        description: '',
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  if (uploadResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <PageHeader
          title="Upload Complete"
          subtitle="Evidence pack saved to browser localStorage with a mock Shelby reference."
        />
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-5 mb-6">
          <p className="text-emerald-400 font-mono font-semibold text-sm mb-1">
            ✓ {uploadResult.packTitle}
          </p>
          <p className="text-emerald-300/70 text-xs leading-relaxed">
            {uploadResult.blobIds.length} blob{uploadResult.blobIds.length !== 1 ? 's' : ''}{' '}
            saved locally with a <strong>mock Shelby reference</strong>. No wallet signing or
            network upload in M1B.
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Blob receipts
            </p>
            {uploadResult.blobIds.map((blobId) => (
              <Link
                key={blobId}
                href={`/blob/${blobId}`}
                className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 font-mono mb-1.5 transition-colors"
              >
                <span className="text-slate-600">/blob/</span>{blobId}
              </Link>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Open Evidence Vault
            </Link>
            <button
              onClick={() => setUploadResult(null)}
              className="border border-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Upload Another Pack
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader
        title="Upload Evidence Pack"
        subtitle="Package your dataset, agent output, or document with metadata. Saved locally with a mock Shelby reference — real Shelby upload is blocked until M2."
      />

      <ModeIndicator mode={mode} />

      {uploadError && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-lg px-4 py-3 mb-6 font-mono">
          {uploadError}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Pack title */}
        <div>
          <label htmlFor="title" className={labelCls}>
            Pack title <span className="text-red-400 normal-case">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleFormChange}
            placeholder="e.g. Common Crawl Sample — Web Text 2024-Q1"
            className={inputCls}
          />
        </div>

        {/* Category + Source row */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="category" className={labelCls}>
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className={inputCls}
            >
              <option value="dataset">Dataset</option>
              <option value="agent-run">Agent Run</option>
              <option value="document">Document</option>
              <option value="manifest">Manifest</option>
            </select>
          </div>

          <div>
            <label htmlFor="sourceType" className={labelCls}>
              Source type
            </label>
            <select
              id="sourceType"
              name="sourceType"
              value={form.sourceType}
              onChange={handleFormChange}
              className={inputCls}
            >
              <option value="web-scrape">Web Scrape</option>
              <option value="api-export">API Export</option>
              <option value="agent-output">Agent Output</option>
              <option value="manual-upload">Manual Upload</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className={labelCls}>
            Tags{' '}
            <span className="text-slate-600 normal-case font-normal tracking-normal">comma-separated</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleFormChange}
            placeholder="nlp, training-data, 2024"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleFormChange}
            placeholder="Describe the contents, source, and intended use of this evidence pack."
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* File selector */}
        <div>
          <p className={labelCls}>
            Files{' '}
            <span className="text-slate-600 normal-case font-normal tracking-normal">
              max {formatBytes(MAX_FILE_SIZE)} per file
            </span>
          </p>
          <div
            className={`border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors cursor-pointer ${
              dragging
                ? 'border-violet-500 bg-violet-950/20'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-slate-400 text-sm">
              Drag &amp; drop files here, or{' '}
              <span className="text-violet-400 font-medium">browse</span>
            </p>
            <p className="text-slate-600 text-xs mt-1 font-mono">
              SHA-256 hashed in-browser · content passed through adapter for M2 compatibility
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {/* File list */}
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((entry, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5"
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-slate-200 text-sm truncate block">
                      {entry.file.name}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">{formatBytes(entry.file.size)}</span>
                    {entry.hashStatus === 'computing' && (
                      <span className="block text-xs text-violet-400 font-mono mt-0.5">
                        computing sha256…
                      </span>
                    )}
                    {entry.hashStatus === 'done' && entry.hash && (
                      <span className="block text-xs text-cyan-400 font-mono mt-0.5 truncate">
                        {entry.hash.slice(0, 28)}…
                      </span>
                    )}
                    {entry.hashStatus === 'error' && (
                      <span className="block text-xs text-red-400 font-mono mt-0.5">hash error</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-600 hover:text-red-400 text-base leading-none flex-shrink-0 mt-0.5 transition-colors"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            {uploading ? 'Saving locally…' : 'Save locally (mock Shelby reference)'}
          </button>
          <p className="text-center text-xs text-slate-600 font-mono mt-2">
            local demo only · localStorage · no wallet · no network · real Shelby blocked until M2
          </p>
        </div>
      </form>
    </div>
  );
}
