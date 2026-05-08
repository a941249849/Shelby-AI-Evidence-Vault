'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Database,
  FilePlus2,
  Fingerprint,
  HardDrive,
  Layers3,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import EvidencePackCard from '@/components/evidence-pack-card';
import { getLocalPacks, getLocalBlobsByPackId, resetLocalData } from '@/lib/store/local-store';
import { getPersistedPacksAction } from '@/app/actions/persist';

interface DashboardClientProps {
  demoPacks: EvidencePack[];
  demoBlobs: BlobRecord[];
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="border-l border-[#2d211c]/10 px-4 py-3 first:border-l-0">
      <p className="font-mono text-xs font-semibold uppercase text-[#978978]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default function DashboardClient({ demoPacks, demoBlobs }: DashboardClientProps) {
  const [localPacks, setLocalPacks] = useState<EvidencePack[]>([]);
  const [persistedPacks, setPersistedPacks] = useState<EvidencePack[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPacks(getLocalPacks());
    getPersistedPacksAction()
      .then((packs) => {
        setPersistedPacks(packs);
      })
      .catch((err) => {
        console.error('[DashboardClient] getPersistedPacksAction failed', err);
      });
  }, []);

  function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    resetLocalData();
    setLocalPacks([]);
    setResetConfirm(false);
  }

  const localIds = new Set(localPacks.map((p) => p.id));
  const dedupedPersisted = persistedPacks.filter((p) => !localIds.has(p.id));
  const allUserPacks = [...localPacks, ...dedupedPersisted];
  const allPacks = [...allUserPacks, ...demoPacks];
  const localBlobs = localPacks.flatMap((p) => getLocalBlobsByPackId(p.id));
  const persistedBlobCount = dedupedPersisted.reduce((sum, p) => sum + p.blobCount, 0);
  const totalBlobs = localBlobs.length + persistedBlobCount + demoBlobs.length;
  const activePacks = allPacks.filter((p) => p.status === 'active').length;
  const topologyItems = [
    { step: '01', label: 'Evidence packs', value: `${allPacks.length} indexed`, icon: Database },
    { step: '02', label: 'Blob records', value: `${totalBlobs} tracked`, icon: Fingerprint },
    { step: '03', label: 'Read receipts', value: 'demo + local', icon: ReceiptText },
  ];

  return (
    <main className="kinetic-grid min-h-[calc(100vh-64px)] px-4 py-10 text-[#2d211c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_390px] lg:items-stretch">
          <section className="shelby-surface shelby-cut p-6">
            <div className="ui-chip">
              <ShieldCheck size={13} />
              Evidence index
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1] text-[#2d211c] sm:text-5xl">
              Inspectable storage state for AI evidence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f6258]">
              Demo corpus, browser-local records, and SQLite-persisted uploads resolve through one
              evidence index.
            </p>
          </section>

          <aside className="shelby-surface shelby-cut p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#978978]">
                  Runtime boundary
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2d211c]">Local + SQLite</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[#157a4c]/25 bg-[#dff2c8] text-[#157a4c]">
                <HardDrive size={19} />
              </div>
            </div>
            <Link href="/upload" className="ui-button shelby-cut-sm w-full">
              <FilePlus2 size={16} />
              New evidence pack
            </Link>
          </aside>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="shelby-cut relative overflow-hidden border border-[#2d211c]/10 bg-[#2d211c] p-5 text-[#fff8ea]">
            <div className="hex-field absolute inset-0 opacity-10" />
            <div className="relative grid gap-5 sm:grid-cols-[0.85fr_1.15fr] sm:items-end">
              <div>
                <div className="ui-chip border-white/15 bg-white/10 text-[#fff8ea]">
                  <Layers3 size={13} />
                  Index topology
                </div>
                <h2 className="mt-5 max-w-sm text-3xl font-semibold leading-[1.04]">
                  Packs, blobs, receipts, one audit plane.
                </h2>
              </div>
              <div className="grid gap-3">
                {topologyItems.map(({ step, label, value, icon: StepIcon }) => {
                  return (
                    <div
                      key={label}
                      className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/10 pb-3 last:border-b-0"
                    >
                      <span className="font-mono text-xs font-semibold text-[#f0c846]">
                        {step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-[#d8cdbd]">{value}</p>
                      </div>
                      <StepIcon className="h-4 w-4 text-[#dff2c8]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="grid rounded-[24px] border border-[#2d211c]/10 bg-[#fff8ea]/65 sm:grid-cols-2">
            <Metric label="Packs indexed" value={allPacks.length} tone="text-[#2d211c]" />
            <Metric label="Active packs" value={activePacks} tone="text-[#157a4c]" />
            <Metric label="Blobs tracked" value={totalBlobs} tone="text-[#6a3ea1]" />
            <Metric label="User packs" value={allUserPacks.length} tone="text-[#a33f2d]" />
          </div>
        </div>

        {allUserPacks.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="ui-chip">
                  <Activity size={13} />
                  User-created records
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#2d211c]">Local workspace</h2>
              </div>
              <button
                onClick={handleReset}
                className="shelby-cut-sm border border-[#2d211c]/12 bg-[#fff8ea] px-3 py-2 text-xs font-semibold text-[#6f6258] transition hover:border-[#ef6f4d]/45 hover:text-[#a33f2d]"
              >
                {resetConfirm ? 'Click again to reset browser cache' : 'Reset browser cache'}
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {allUserPacks.map((pack) => (
                <EvidencePackCard key={pack.id} pack={pack} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="ui-chip">
                <Database size={13} />
                Built-in corpus
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[#2d211c]">Demo evidence</h2>
            </div>
            <div className="hidden items-center gap-2 font-mono text-xs font-semibold uppercase text-[#978978] sm:flex">
              <Layers3 size={14} />
              {demoPacks.length} packs
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {demoPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
