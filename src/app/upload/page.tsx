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
  Wallet,
  WifiOff,
} from 'lucide-react';
import { Network } from '@aptos-labs/ts-sdk';
import type { AdapterWallet, AdapterNotDetectedWallet } from '@aptos-labs/wallet-adapter-react';
import { shelbyUploadAction, getShelbyModeAction } from '@/app/actions/upload';
import { persistUploadAction } from '@/app/actions/persist';
import { parseTags, buildEvidencePack, buildBlobRecord } from '@/lib/validation';
import { addLocalPack, addLocalBlob, addLocalReadReceipt } from '@/lib/store/local-store';
import { formatBytes } from '@/lib/utils';
import { useShelbyUpload } from '@/lib/shelby/use-shelby-upload';
import UploadProviders from './providers';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';
import type { BlobRecord } from '@/lib/demo-data/blobs';

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
  mode: 'mock' | 'testnet';
  receiptId: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fieldClass =
  'w-full shelby-cut border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2.5 text-sm text-[#2d211c] outline-none transition placeholder:text-[#978978] focus:border-[#6a3ea1]/60 focus:ring-2 focus:ring-[#6a3ea1]/15';

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ModeIndicator({
  mode,
  walletConnected,
  walletAddress,
  walletNetwork,
}: {
  mode: 'mock' | 'testnet' | null;
  walletConnected: boolean;
  walletAddress: string | null;
  walletNetwork: Network | null;
}) {
  if (mode === null) return null;

  const isTestnet = mode === 'testnet';

  if (!isTestnet) {
    return (
      <div className="mb-8 flex gap-3 border border-[#6a3ea1]/28 bg-[#efe2ff] px-4 py-3 text-sm text-[#6a3ea1]">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">Local demo upload active</p>
          <p className="mt-1 leading-6">
            Files receive deterministic mock Shelby references and are persisted for inspection.
          </p>
        </div>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="mb-8 flex gap-3 border border-[#ef6f4d]/42 bg-[#ffe0cf] px-4 py-3 text-sm text-[#a33f2d]">
        <Wallet className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">Wallet required for testnet upload</p>
          <p className="mt-1 leading-6">
            Connect your Aptos wallet to upload blobs to Shelby testnet. The wallet will sign the
            on-chain registration transaction. Requires testnet APT for gas and ShelbyUSD for
            storage.
          </p>
        </div>
      </div>
    );
  }

  // Wallet connected but on the wrong network
  if (walletNetwork !== null && walletNetwork !== Network.TESTNET) {
    return (
      <div className="mb-8 flex gap-3 border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        <WifiOff className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">Wrong network — switch to Aptos Testnet</p>
          <p className="mt-1 leading-6">
            Your wallet is connected to{' '}
            <span className="font-mono font-semibold">{walletNetwork}</span>. Shelby testnet
            upload requires <span className="font-semibold">Aptos Testnet</span>. Switch your
            wallet network and reconnect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex gap-3 border border-[#157a4c]/35 bg-[#dff2c8] px-4 py-3 text-sm text-[#157a4c]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <p className="font-semibold">Wallet connected — Shelby testnet upload ready</p>
        <p className="mt-1 leading-6">
          Uploading as{' '}
          <span className="font-mono text-xs">{walletAddress ?? 'unknown'}</span>. Each file will
          be registered on-chain and uploaded to Shelby testnet RPC.
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal wallet connection panel shown in testnet mode.
 * Lists detected wallets, allows connect/disconnect.
 */
function WalletConnector({
  wallets,
  notDetectedWallets,
  walletConnected,
  walletAddress,
  walletName,
  connect,
  disconnect,
}: {
  wallets: ReadonlyArray<AdapterWallet>;
  notDetectedWallets: ReadonlyArray<AdapterNotDetectedWallet>;
  walletConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  connect: (name: string) => void;
  disconnect: () => void;
}) {
  if (walletConnected) {
    return (
      <div className="shelby-surface mb-6 shelby-cut p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-8 w-8 flex-none place-items-center border border-[#157a4c]/30 bg-[#dff2c8] text-[#157a4c]">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold uppercase text-[#978978]">
                {walletName ?? 'Wallet'} connected
              </p>
              <p className="truncate font-mono text-xs text-[#2d211c]">
                {walletAddress ?? 'unknown'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="flex-none shelby-cut border border-[#2d211c]/12 px-3 py-1.5 text-xs font-semibold text-[#6f6258] transition hover:border-red-400/60 hover:text-red-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shelby-surface mb-6 shelby-cut p-4">
      <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#978978]">
        Connect Aptos wallet
      </p>
      {wallets.length === 0 && notDetectedWallets.length === 0 && (
        <p className="text-sm text-[#6f6258]">
          No Aptos wallets detected. Install{' '}
          <a
            href="https://petra.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#6a3ea1]"
          >
            Petra
          </a>{' '}
          or another Aptos wallet extension and refresh the page.
        </p>
      )}
      {wallets.length > 0 && (
        <div className="grid gap-2">
          {wallets.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => connect(w.name)}
              className="flex items-center gap-3 shelby-cut border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2.5 text-sm font-semibold text-[#2d211c] transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
            >
              {w.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt={w.name} className="h-5 w-5 flex-none rounded" />
              )}
              {w.name}
            </button>
          ))}
        </div>
      )}
      {notDetectedWallets.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-[#6f6258]">Not installed:</p>
          <div className="grid gap-1.5">
            {notDetectedWallets.map((w) => (
              <a
                key={w.name}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#6f6258] underline hover:text-[#6a3ea1]"
              >
                {w.name}
              </a>
            ))}
          </div>
        </div>
      )}
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
          inverse ? 'bg-[#2d211c] text-[#fff8ea]' : 'bg-[#dff2c8] text-[#157a4c] border border-[#157a4c]/30'
        }`}
      >
        {number}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#6a3ea1]" />
        <h2 className={`text-sm font-semibold uppercase ${inverse ? 'text-[#2d211c]' : 'text-[#2d211c]'}`}>
          {title}
        </h2>
      </div>
    </div>
  );
}

function UploadPageContent() {
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

  const shelbyUpload = useShelbyUpload();

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

    if (mode === 'testnet' && !shelbyUpload.walletConnected) {
      setUploadError(
        'Wallet not connected. Please connect your Aptos wallet to upload to Shelby testnet.'
      );
      return;
    }

    if (
      mode === 'testnet' &&
      shelbyUpload.walletNetwork !== null &&
      shelbyUpload.walletNetwork !== Network.TESTNET
    ) {
      setUploadError(
        `Wrong network: wallet is on "${shelbyUpload.walletNetwork}". Switch to Aptos Testnet and reconnect.`
      );
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
      const builtBlobs: BlobRecord[] = [];

      for (const entry of files) {
        const hash = entry.hash!;
        const mimeType = entry.file.type || 'application/octet-stream';

        if (mode === 'testnet') {
          // ── Testnet path: browser wallet upload via @shelby-protocol/react ──
          const buffer = await entry.file.arrayBuffer();
          const blobData = new Uint8Array(buffer);

          const testnetResult = await shelbyUpload.uploadBlob({
            packId: pack.id,
            fileName: entry.file.name,
            blobData,
            hash,
          });

          const blob = buildBlobRecord({
            evidencePackId: pack.id,
            hash,
            shelbyRef: testnetResult.shelbyRef,
            fileName: entry.file.name,
            size: entry.file.size,
            mimeType,
            tags,
            uploadMode: 'testnet',
            network: 'testnet',
            dataSource: 'shelby-testnet',
            accountAddress: testnetResult.accountAddress,
            blobName: testnetResult.blobName,
            expirationMicros: testnetResult.expirationMicros,
            storageStatus: testnetResult.storageStatus,
            explorerUrl: testnetResult.explorerUrl,
            retrievalUrl: testnetResult.retrievalUrl,
          });

          addLocalBlob(blob);
          builtBlobs.push(blob);
          blobIds.push(blob.id);
        } else {
          // ── Mock path: server action with deterministic local reference ──
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
          builtBlobs.push(blob);
          blobIds.push(blob.id);
        }
      }

      addLocalPack(pack);

      const receipt: ReadReceipt = {
        id: `local-rr-${crypto.randomUUID()}`,
        runId: `upload-${pack.id}`,
        query: `Evidence pack "${pack.title}" uploaded via ${mode === 'testnet' ? 'Shelby testnet' : 'local mock'} upload.`,
        answerSummary: `${blobIds.length} blob${blobIds.length !== 1 ? 's' : ''} sealed into evidence pack "${pack.title}". Each blob hash was computed in-browser before storage. Pack ID: ${pack.id}.`,
        referencedBlobIds: blobIds,
        evidencePackIds: [pack.id],
        timestamp: new Date().toISOString(),
        agentVersion: 'shelby-vault/upload',
        receiptMode: mode === 'testnet' ? 'shelby-testnet' : 'local',
      };
      addLocalReadReceipt(receipt);

      // Persist to SQLite (server-side) so uploads survive localStorage resets
      // and are visible across browser sessions.  Errors are non-fatal.
      try {
        await persistUploadAction(pack, builtBlobs, receipt);
      } catch {
        // SQLite persistence failure is non-fatal — localStorage already holds
        // the records and the upload itself succeeded.
      }

      setUploadResult({ packId: pack.id, packTitle: pack.title, blobIds, mode: mode ?? 'mock', receiptId: receipt.id });
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
    const isTestnet = uploadResult.mode === 'testnet';
    return (
      <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="shelby-surface shelby-cut p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center border border-[#157a4c]/35 bg-[#dff2c8] text-[#157a4c]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-mono text-xs font-semibold uppercase text-[#ff77c9]">
              {isTestnet ? 'Shelby testnet evidence pack sealed' : 'Local evidence pack sealed'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#2d211c]">
              {uploadResult.packTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
              {uploadResult.blobIds.length} blob
              {uploadResult.blobIds.length !== 1 ? 's' : ''}{' '}
              {isTestnet
                ? 'registered on Shelby testnet and saved locally with real account/blob metadata.'
                : 'saved locally with mock Shelby references. No wallet signing, no network upload, and no real Shelby registration.'}
            </p>

            <div className="mt-8 shelby-cut border border-[#2d211c]/10 bg-[#fff8ea] p-4">
              <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#978978]">
                Read receipt
              </p>
              <Link
                href={`/read-receipt/${uploadResult.receiptId}`}
                className="group flex items-center justify-between border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2 text-xs font-medium text-[#2d211c] transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
              >
                <span className="truncate font-mono">/read-receipt/{uploadResult.receiptId}</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-4 shelby-cut border border-[#2d211c]/10 bg-[#fff8ea] p-4">
              <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#978978]">
                Blob detail pages
              </p>
              <div className="grid gap-2">
                {uploadResult.blobIds.map((blobId) => (
                  <Link
                    key={blobId}
                    href={`/blob/${blobId}`}
                    className="group flex items-center justify-between border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2 text-xs font-medium text-[#2d211c] transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
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
                className="ui-button shelby-cut-sm"
              >
                View evidence index
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setUploadResult(null)}
                className="ui-button ui-button-secondary shelby-cut-sm"
              >
                Upload another pack
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTestnet = mode === 'testnet';
  const wrongNetwork =
    isTestnet &&
    shelbyUpload.walletConnected &&
    shelbyUpload.walletNetwork !== null &&
    shelbyUpload.walletNetwork !== Network.TESTNET;
  const testnetRequiresWallet = isTestnet && (!shelbyUpload.walletConnected || wrongNetwork);
  const submitLabel = uploading
    ? isTestnet
      ? 'Uploading to testnet'
      : 'Saving locally'
    : isTestnet
      ? shelbyUpload.walletConnected && !wrongNetwork
        ? 'Upload to Shelby testnet'
        : wrongNetwork
          ? 'Wrong network — switch wallet'
          : 'Connect wallet to upload'
      : 'Save locally';

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="ui-chip mb-4">
              <FileUp className="h-3.5 w-3.5 text-[#6a3ea1]" />
              Evidence intake
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold text-[#2d211c]">
              Package files into a verifiable AI evidence pack.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f6258]">
              {isTestnet
                ? 'Connect your Aptos wallet to register files on Shelby testnet. Real account/blobName identity and explorer links are stored in each BlobRecord.'
                : 'Metadata, file hashes, and mock Shelby references are created locally. Set SHELBY_MODE=testnet with a connected wallet for real testnet upload.'}
            </p>
          </div>
          <div className="shelby-surface shelby-cut p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-[#157a4c]/30 bg-[#dff2c8] text-[#157a4c]">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#978978]">
                  Storage boundary
                </p>
                <p className="text-sm font-semibold text-[#2d211c]">
                  {isTestnet ? 'Shelby testnet + SQLite' : 'Mock mode + SQLite'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ModeIndicator
          mode={mode}
          walletConnected={shelbyUpload.walletConnected}
          walletAddress={shelbyUpload.walletAddress}
          walletNetwork={shelbyUpload.walletNetwork}
        />

        {isTestnet && (
          <WalletConnector
            wallets={shelbyUpload.wallets}
            notDetectedWallets={shelbyUpload.notDetectedWallets}
            walletConnected={shelbyUpload.walletConnected}
            walletAddress={shelbyUpload.walletAddress}
            walletName={shelbyUpload.walletName}
            connect={shelbyUpload.connect}
            disconnect={shelbyUpload.disconnect}
          />
        )}

        {uploadError && (
          <div className="mb-6 flex items-start gap-3 border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{uploadError}</span>
          </div>
        )}

        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]" onSubmit={handleSubmit}>
          <section className="shelby-surface shelby-cut p-5">
            <StepLabel number="01" title="Pack metadata" icon={FileText} />

            <div className="grid gap-5">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-[#2d211c]">
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
                    className="mb-1.5 block text-sm font-semibold text-[#2d211c]"
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
                    className="mb-1.5 block text-sm font-semibold text-[#2d211c]"
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
                <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold text-[#2d211c]">
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
                  className="mb-1.5 block text-sm font-semibold text-[#2d211c]"
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
            <section className="shelby-surface shelby-cut p-5">
              <StepLabel number="02" title="Files and hashes" icon={Hash} />
              <div
                className={`cursor-pointer shelby-cut border border-dashed px-5 py-8 text-center transition ${
                  dragging
                    ? 'border-[#6a3ea1] bg-[#efe2ff]'
                    : 'border-[#2d211c]/14 bg-[#fff8ea] hover:border-[#6a3ea1]/35'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-[#157a4c]/30 bg-[#dff2c8] text-[#157a4c]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[#2d211c]">Drop files here or browse</p>
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
                      className="flex items-start gap-3 shelby-cut border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-3 text-sm"
                    >
                      <FileText className="mt-0.5 h-4 w-4 flex-none text-[#6a3ea1]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[#2d211c]">
                          {entry.file.name}
                        </span>
                        <span className="text-xs text-[#6f6258]">{formatBytes(entry.file.size)}</span>
                        {entry.hashStatus === 'computing' && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-[#6a3ea1]">
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
                        className="grid h-8 w-8 flex-none place-items-center text-[#6f6258] transition hover:bg-red-500/10 hover:text-red-200"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="shelby-cut border border-[#157a4c]/25 bg-[#fff8ea] p-5 text-[#2d211c] shadow-sm">
              <StepLabel
                number="03"
                title={isTestnet ? 'Testnet upload' : 'Local save'}
                icon={isTestnet ? Wallet : ShieldCheck}
                inverse
              />
              <p className="text-sm leading-6 text-[#6f6258]">
                {isTestnet
                  ? 'Files are registered on Shelby testnet via your connected wallet and persisted for inspection.'
                  : 'The saved object receives a deterministic mock Shelby reference and SQLite persistence.'}
              </p>
              <button
                type="submit"
                disabled={uploading || files.length === 0 || testnetRequiresWallet}
                className="ui-button shelby-cut-sm mt-5 w-full disabled:cursor-not-allowed disabled:opacity-55"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitLabel}
              </button>
              {testnetRequiresWallet && !wrongNetwork && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  Connect an Aptos wallet to enable testnet upload.
                </p>
              )}
              {wrongNetwork && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  Switch your wallet to Aptos Testnet to enable upload.
                </p>
              )}
              {!isTestnet && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  Set SHELBY_MODE=testnet and connect a wallet for real Shelby testnet upload.
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <UploadProviders>
      <UploadPageContent />
    </UploadProviders>
  );
}
