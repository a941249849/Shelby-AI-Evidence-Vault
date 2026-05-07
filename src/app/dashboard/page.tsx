import Link from 'next/link';
import { getEvidencePacks, getBlobsByPackId } from '@/lib/evidence/service';
import EvidencePackCard from '@/components/evidence-pack-card';
import PageHeader from '@/components/page-header';

export const metadata = {
  title: 'Dashboard — Shelby AI Evidence Vault',
};

export default function DashboardPage() {
  const packs = getEvidencePacks();
  const activePacks = packs.filter((p) => p.status === 'active').length;
  const totalBlobs = packs.reduce((sum, p) => sum + p.blobCount, 0);

  // Compute actual blob totals from service
  const allBlobs = packs.flatMap((p) => getBlobsByPackId(p.id));

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
          { label: 'Total Packs', value: packs.length },
          { label: 'Active Packs', value: activePacks },
          { label: 'Total Blobs', value: allBlobs.length || totalBlobs },
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

      {/* Evidence pack grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {packs.map((pack) => (
          <EvidencePackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </div>
  );
}
