'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileUp,
  Hash,
  HardDrive,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
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

interface UploadFileEntry {
  file: File;
  hash: string | null;
  hashStatus: 'pending' | 'computing' | 'done' | 'error';
}

interface UploadedResult {
  packId: string;
  packTitle: string;
  blobIds: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fieldClass =
  'w-full shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-3 py-2.5 text-sm text-[#161008] shadow-sm outline-none transition focus:border-[#de8aff] focus:ring-2 focus:ring-[#de8aff]/15';

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ModeIndicator({ mode }: { mode: 'mock' | 'testnet' | null }) {
  if (mode === null) return null;

  const isTestnet = mode === 'testnet';
  const Icon = isTestnet ? AlertTriangle : ShieldCheck;

  return (
    <div
      className={`mb-8 flex gap-3 rounded-lg border px-4 py-3 text-sm ${
        isTestnet
          ? 'border-[#fd8565]/45 bg-[#ffdcd9] text-[#4f192a]'
          : 'border-[#de8aff]/20 bg-[#eee2ff] text-[#470b64]'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <p className="font-semibold">
          {isTestnet ? 'Real Shelby upload blocked until M2' : 'Local demo upload active'}
        </p>
        <p className="mt-1 leading-6">
          {isTestnet
            ? 'Official integration still requires commitment generation, on-chain registration, RPC upload, signer/wallet design, API key handling, network selection, and funding. Set SHELBY_MODE=mock for local demo mode.'
            : 'Files are saved to browser localStorage with deterministic mock Shelby references. M1B performs no wallet signing, no network calls, and no real Shelby upload.'}
        </p>
      </div>
    </div>
  );
}

function StepLabel({
  number,
  title,
  icon: Icon,
  inverse = false,
}: {
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  inverse?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold ${
          inverse ? 'bg-[#fcfaf8] text-[#4f192a]' : 'bg-[#4f192a] text-[#fcfaf8]'
        }`}
      >
        {number}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#de8aff]" />
        <h2
          className={`text-sm font-semibold uppercase tracking-[0.18em] ${
            inverse ? 'text-[#fcfaf8]' : 'text-[#161008]'
          }`}
        >
          {title}
        </h2>
      </div>
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
        `${oversized.length} file(s) skipped: files must be <= ${formatBytes(MAX_FILE_SIZE)}.`
      );
    }

    const entries: UploadFileEntry[] = valid.map((f) => ({
      file: f,
      hash: null,
      hashStatus: 'pending',
    }));
    setFiles((prev) => [...prev, ...entries]);

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

        let content: string | undefined;
        try {
          const buffer = await entry.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const chunkSize = 0x8000;
          let binary = '';
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          content = btoa(binary);
        } catch {
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
      <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-8 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#dfffcc] text-[#21351a]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff77c9]">
              Local evidence pack sealed
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#4f192a]">
              {uploadResult.packTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
              {uploadResult.blobIds.length} blob
              {uploadResult.blobIds.length !== 1 ? 's' : ''} saved locally with mock Shelby
              references. M1B performs no wallet signing, no network upload, and no real Shelby
              registration.
            </p>

            <div className="mt-8 shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                Blob detail pages
              </p>
              <div className="grid gap-2">
                {uploadResult.blobIds.map((blobId) => (
                  <Link
                    key={blobId}
                    href={`/blob/${blobId}`}
                    className="group flex items-center justify-between rounded-md border border-[#161008]/15 bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#161008] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
                  >
                    <span className="truncate font-mono">/blob/{blobId}</span>
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 shelby-cut bg-[#4f192a] px-4 py-2.5 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#322312]"
              >
                View evidence index
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setUploadResult(null)}
                className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-4 py-2.5 text-sm font-semibold text-[#161008] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
              >
                Upload another pack
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#161008]/15 bg-[#fcfaf8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
              <FileUp className="h-3.5 w-3.5 text-[#de8aff]" />
              Evidence intake
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#4f192a]">
              Package files into a verifiable AI evidence pack.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f6258]">
              Metadata, file hashes, and mock Shelby references are created locally for M1B. Real
              Shelby identity, storage, and wallet flow remain explicitly blocked until M2.
            </p>
          </div>
          <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                  Storage boundary
                </p>
                <p className="text-sm font-semibold text-[#161008]">Browser localStorage only</p>
              </div>
            </div>
          </div>
        </div>

        <ModeIndicator mode={mode} />

        {uploadError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{uploadError}</span>
          </div>
        )}

        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]" onSubmit={handleSubmit}>
          <section className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
            <StepLabel number="01" title="Pack metadata" icon={FileText} />

            <div className="grid gap-5">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-[#161008]">
                  Pack title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Common Crawl Sample - Web Text 2024-Q1"
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category"
                    className="mb-1.5 block text-sm font-semibold text-[#161008]"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className={fieldClass}
                  >
                    <option value="dataset">Dataset</option>
                    <option value="agent-run">Agent Run</option>
                    <option value="document">Document</option>
                    <option value="manifest">Manifest</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sourceType"
                    className="mb-1.5 block text-sm font-semibold text-[#161008]"
                  >
                    Source type
                  </label>
                  <select
                    id="sourceType"
                    name="sourceType"
                    value={form.sourceType}
                    onChange={handleFormChange}
                    className={fieldClass}
                  >
                    <option value="web-scrape">Web Scrape</option>
                    <option value="api-export">API Export</option>
                    <option value="agent-output">Agent Output</option>
                    <option value="manual-upload">Manual Upload</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold text-[#161008]">
                  Tags <span className="font-normal text-[#6f6258]">(comma-separated)</span>
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={form.tags}
                  onChange={handleFormChange}
                  placeholder="nlp, training-data, 2024"
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-semibold text-[#161008]"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={7}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe the source, capture method, and intended evidence value."
                  className={`${fieldClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <StepLabel number="02" title="Files and hashes" icon={Hash} />
              <div
                className={`cursor-pointer shelby-cut border border-dashed px-5 py-8 text-center transition ${
                  dragging
                    ? 'border-[#de8aff] bg-[#eee2ff]'
                    : 'border-[#ffc2ad] bg-[#fcfaf8] hover:border-[#de8aff]/50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[#161008]">Drop files here or browse</p>
                <p className="mt-1 text-xs leading-5 text-[#6f6258]">
                  Max {formatBytes(MAX_FILE_SIZE)} per file. SHA-256 is computed in-browser before
                  save.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((entry, idx) => (
                    <li
                      key={`${entry.file.name}-${idx}`}
                      className="flex items-start gap-3 shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-3 py-3 text-sm"
                    >
                      <FileText className="mt-0.5 h-4 w-4 flex-none text-[#de8aff]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[#161008]">
                          {entry.file.name}
                        </span>
                        <span className="text-xs text-[#6f6258]">{formatBytes(entry.file.size)}</span>
                        {entry.hashStatus === 'computing' && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-[#de8aff]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Computing SHA-256
                          </span>
                        )}
                        {entry.hashStatus === 'done' && entry.hash && (
                          <span className="mt-1 block truncate font-mono text-xs text-[#6f6258]">
                            {entry.hash}
                          </span>
                        )}
                        {entry.hashStatus === 'error' && (
                          <span className="mt-1 block text-xs text-red-600">Hash error</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="grid h-8 w-8 flex-none place-items-center rounded-md text-[#6f6258] transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="shelby-cut border border-[#161008]/12 bg-[#4f192a] p-5 text-[#fcfaf8] shadow-sm">
              <StepLabel number="03" title="Local save" icon={ShieldCheck} inverse />
              <p className="text-sm leading-6 text-[#BFC7D8]">
                The saved object is an M1B local demonstration artifact. It is intentionally not a
                production Shelby storage record.
              </p>
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#fcfaf8] px-4 py-3 text-sm font-semibold text-[#4f192a] transition hover:bg-[#fcfaf8] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Saving locally' : 'Save locally'}
              </button>
              <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                Wallet, on-chain registration, RPC upload, and real Shelby references are M2+
                concerns.
              </p>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}
