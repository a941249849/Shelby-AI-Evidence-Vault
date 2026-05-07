'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import EvidencePackCard from '@/components/evidence-pack-card';
import PageHeader from '@/components/page-header';
import { getLocalPacks, getLocalBlobsByPackId, resetLocalData } from '@/lib/store/local-store';

interface DashboardClientProps {
  demoPacks: EvidencePack[];
  demoBlobs: BlobRecord[];
}

export default function DashboardClient({ demoPacks, demoBlobs }: DashboardClientProps) {
  const [localPacks, setLocalPacks] = useState<EvidencePack[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    // Reading localStorage is browser-only; this must run after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPacks(getLocalPacks());
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

  const allPacks = [...localPacks, ...demoPacks];
  const localBlobs = localPacks.flatMap((p) => getLocalBlobsByPackId(p.id));
  const totalBlobs = localBlobs.length + demoBlobs.length;
  const activePacks = allPacks.filter((p) => p.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Evidence Vault"
          subtitle="All stored evidence packs. Each pack groups related blobs with metadata and provenance."
        />
        <Link
          href="/upload"
          className="flex-shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Upload Pack
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Packs', value: allPacks.length, accent: 'text-white' },
          { label: 'Active', value: activePacks, accent: 'text-emerald-400' },
          { label: 'Total Blobs', value: totalBlobs, accent: 'text-cyan-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900 border border-slate-800 rounded-lg px-5 py-4"
          >
            <p className={`text-2xl font-bold font-mono tabular-nums ${stat.accent}`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Local uploaded packs */}
      {localPacks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Locally uploaded ({localPacks.length})
            </h2>
            <button
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-red-400 font-mono transition-colors"
            >
              {resetConfirm ? '⚠ confirm reset?' : 'reset local data'}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>
      )}

      {/* Built-in demo packs */}
      <section>
        {localPacks.length > 0 && (
          <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Built-in demo data ({demoPacks.length})
          </h2>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoPacks.map((pack) => (
            <EvidencePackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>
    </div>
  );
}
