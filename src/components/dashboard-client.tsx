'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, FilePlus2, HardDrive, ShieldCheck } from 'lucide-react';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import EvidencePackCard from '@/components/evidence-pack-card';
import { getLocalPacks, getLocalBlobsByPackId, resetLocalData } from '@/lib/store/local-store';
import { getPersistedPacksAction } from '@/app/actions/persist';

interface DashboardClientProps {
  demoPacks: EvidencePack[];
  demoBlobs: BlobRecord[];
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="border-l border-[#161008]/12 px-4 py-2 first:border-l-0">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6f6258]">{label}</p>
      <p className={`mt-3 text-4xl font-semibold tracking-tight ${tone}`}>{value}</p>
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
        // SQLite unavailable — silently degrade to localStorage only
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

  // Merge: localStorage packs first (newest), then SQLite packs (dedup by id),
  // then built-in demo packs.
  const localIds = new Set(localPacks.map((p) => p.id));
  const dedupedPersisted = persistedPacks.filter((p) => !localIds.has(p.id));
  const allUserPacks = [...localPacks, ...dedupedPersisted];
  const allPacks = [...allUserPacks, ...demoPacks];

  const localBlobs = localPacks.flatMap((p) => getLocalBlobsByPackId(p.id));
  const totalBlobs = localBlobs.length + demoBlobs.length;
  const activePacks = allPacks.filter((p) => p.status === 'active').length;

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#fcfaf8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 ledger-line opacity-75" />
      <div className="absolute right-[-8rem] top-6 h-72 w-72 rotate-[60deg] rounded-[34px] bg-[#ffdfef]" />
      <div className="absolute bottom-20 left-[-12rem] h-80 w-80 rotate-[60deg] rounded-[34px] bg-[#dfffcc]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-9 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-[#ff77c9]/30 bg-[#ffdfef] px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#4f192a]">
              <ShieldCheck size={14} />
              Evidence index - M1B local mode
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight text-[#161008] sm:text-6xl">
              Evidence index for inspectable AI memory.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
              Browse demo and locally uploaded evidence packs. Each pack groups blobs, hashes,
              provenance, and read receipt references.
            </p>
          </div>
          <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-[0_26px_90px_rgba(22,16,8,0.1)] backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#6f6258]">
                  Workspace state
                </p>
                <p className="mt-2 text-lg font-semibold text-[#161008]">Local proof surface</p>
              </div>
              <div className="shelby-hex grid h-12 w-12 place-items-center bg-[#4f192a] text-[#dfffcc]">
                <HardDrive size={19} />
              </div>
            </div>
            <Link
              href="/upload"
              className="shelby-cut-sm inline-flex w-full items-center justify-center gap-2 bg-[#161008] px-4 py-3 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#4f192a]"
            >
              <FilePlus2 size={16} />
              New local pack
            </Link>
          </div>
        </div>

        <div className="mb-10 grid gap-5 border-y border-[#161008]/12 bg-[#fcfaf8]/70 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Packs indexed" value={allPacks.length} tone="text-[#161008]" />
          <Metric label="Active packs" value={activePacks} tone="text-[#21351a]" />
          <Metric label="Blobs tracked" value={totalBlobs} tone="text-[#21351a]" />
          <Metric label="Storage mode" value="Local" tone="text-[#470b64]" />
        </div>

        {allUserPacks.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[#161008]">
                  <HardDrive size={18} className="text-[#ff77c9]" />
                  Local demo uploads
                </h2>
                <p className="mt-1 text-sm text-[#6f6258]">
                  Stored locally. Mock references are not real Shelby blobs.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="shelby-cut-sm border border-[#161008]/12 bg-[#fcfaf8] px-3 py-2 text-xs font-semibold text-[#6f6258] transition hover:border-red-300 hover:text-red-600"
              >
                {resetConfirm ? 'Click again to reset' : 'Reset local data'}
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
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#161008]">
              <Database size={18} className="text-[#de8aff]" />
              Built-in demo evidence
            </h2>
            <p className="mt-1 text-sm text-[#6f6258]">
              Illustrative evidence packs with demo references for product walkthroughs.
            </p>
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
