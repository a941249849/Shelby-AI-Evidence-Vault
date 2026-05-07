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
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-8">
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        <span>
          <strong>Real Shelby upload blocked until M2</strong> — Official integration requires
          commitment generation, on-chain registration, RPC upload, network selection,
          signer/wallet design, API key handling, and funding. Uploads will fail with a clear
          error. Set <code className="font-mono text-xs bg-amber-100 px-1 rounded">SHELBY_MODE=mock</code>{' '}
          for local demo mode.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm rounded-lg px-4 py-3 mb-8">
      <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
      <span>
        <strong>Local demo upload</strong> — Files are saved to browser localStorage with a
        deterministic mock Shelby reference. No wallet signing, no network calls, no real Shelby
        integration in M1B.{' '}
        <code className="font-mono text-xs bg-indigo-100 px-1 rounded">SHELBY_MODE=testnet</code>{' '}
        is blocked until M2.
      </span>
    </div>
  );
}

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
        <PageHeader title="Local Demo Upload Complete" subtitle="Evidence pack saved to browser localStorage with a mock Shelby reference." />
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
          <p className="text-emerald-800 font-semibold mb-1">✓ {uploadResult.packTitle}</p>
          <p className="text-emerald-700 text-sm">
            {uploadResult.blobIds.length} blob{uploadResult.blobIds.length !== 1 ? 's' : ''}{' '}
            saved locally with a <strong>mock Shelby reference</strong>. No wallet signing or
            network upload in M1B.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Blob detail pages
            </p>
            {uploadResult.blobIds.map((blobId) => (
              <Link
                key={blobId}
                href={`/blob/${blobId}`}
                className="block text-sm text-indigo-600 hover:text-indigo-800 font-mono mb-1"
              >
                /blob/{blobId}
              </Link>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              View Dashboard
            </Link>
            <button
              onClick={() => setUploadResult(null)}
              className="border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
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
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3 mb-6">
          {uploadError}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Pack title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Pack title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleFormChange}
            placeholder="e.g. Common Crawl Sample — Web Text 2024-Q1"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleFormChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="dataset">Dataset</option>
            <option value="agent-run">Agent Run</option>
            <option value="document">Document</option>
            <option value="manifest">Manifest</option>
          </select>
        </div>

        {/* Source type */}
        <div>
          <label htmlFor="sourceType" className="block text-sm font-medium text-slate-700 mb-1">
            Source type
          </label>
          <select
            id="sourceType"
            name="sourceType"
            value={form.sourceType}
            onChange={handleFormChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="web-scrape">Web Scrape</option>
            <option value="api-export">API Export</option>
            <option value="agent-output">Agent Output</option>
            <option value="manual-upload">Manual Upload</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
            Tags{' '}
            <span className="text-slate-400 font-normal text-xs">(comma-separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleFormChange}
            placeholder="e.g. nlp, training-data, 2024"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleFormChange}
            placeholder="Describe the contents, source, and intended use of this evidence pack."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* File selector */}
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-1">
            Files{' '}
            <span className="text-slate-400 font-normal text-xs">
              (max {formatBytes(MAX_FILE_SIZE)} per file)
            </span>
          </p>
          <div
            className={`border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors cursor-pointer ${
              dragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-slate-500 text-sm">
              Drag &amp; drop files here, or{' '}
              <span className="text-indigo-600 font-medium">browse</span>
            </p>
            <p className="text-slate-400 text-xs mt-1">
              SHA-256 hash computed in-browser before upload
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
                  className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-slate-900 truncate block">
                      {entry.file.name}
                    </span>
                    <span className="text-slate-400 text-xs">{formatBytes(entry.file.size)}</span>
                    {entry.hashStatus === 'computing' && (
                      <span className="block text-xs text-indigo-500 mt-0.5">
                        Computing SHA-256…
                      </span>
                    )}
                    {entry.hashStatus === 'done' && entry.hash && (
                      <span className="block text-xs text-slate-400 font-mono mt-0.5 truncate">
                        {entry.hash.slice(0, 20)}…
                      </span>
                    )}
                    {entry.hashStatus === 'error' && (
                      <span className="block text-xs text-red-500 mt-0.5">Hash error</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            {uploading ? 'Saving…' : 'Save locally (mock Shelby reference)'}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Local demo upload only. Evidence packs are stored in browser localStorage.{' '}
            Real Shelby upload (wallet + on-chain + RPC) is blocked until M2.
          </p>
        </div>
      </form>
    </div>
  );
}
