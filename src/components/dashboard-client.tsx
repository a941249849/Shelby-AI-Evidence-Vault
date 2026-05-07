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
          title="Evidence Packs"
          subtitle="Browse all stored evidence packs. Each pack groups related blobs with metadata and provenance."
        />
        <Link
          href="/upload"
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Upload Pack
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Packs', value: allPacks.length },
          { label: 'Active Packs', value: activePacks },
          { label: 'Total Blobs', value: totalBlobs },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Local uploaded packs */}
      {localPacks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Locally uploaded ({localPacks.length})
            </h2>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              {resetConfirm ? 'Click again to confirm reset' : 'Reset local demo data'}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {localPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>
      )}

      {/* Built-in demo packs */}
      <section>
        {localPacks.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Built-in demo data ({demoPacks.length})
          </h2>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {demoPacks.map((pack) => (
            <EvidencePackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>
    </div>
  );
}
