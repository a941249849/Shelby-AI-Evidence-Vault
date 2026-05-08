'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Database,
  FilePlus2,
  HardDrive,
  Layers3,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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

type SortKey = 'newest' | 'oldest' | 'title-az' | 'blobs';

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
    <div className="border-l border-white/10 px-4 py-3 first:border-l-0">
      <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

/** Returns true when a pack matches the search query. */
function packMatchesQuery(pack: EvidencePack, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    pack.title.toLowerCase().includes(q) ||
    pack.description.toLowerCase().includes(q) ||
    pack.category.toLowerCase().includes(q) ||
    pack.sourceType.toLowerCase().includes(q) ||
    pack.status.toLowerCase().includes(q) ||
    pack.tags.some((t) => t.toLowerCase().includes(q)) ||
    (pack.dataSource ?? 'demo').toLowerCase().includes(q)
  );
}

/** Sorts a pack array by the given key. Returns a new array (does not mutate). */
function sortPacks(packs: EvidencePack[], sortBy: SortKey): EvidencePack[] {
  return [...packs].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt);
      case 'title-az':
        return a.title.localeCompare(b.title);
      case 'blobs':
        return b.blobCount - a.blobCount || b.createdAt.localeCompare(a.createdAt);
      case 'newest':
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
}

export default function DashboardClient({ demoPacks, demoBlobs }: DashboardClientProps) {
  const [localPacks, setLocalPacks] = useState<EvidencePack[]>([]);
  const [persistedPacks, setPersistedPacks] = useState<EvidencePack[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Search / filter / sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<EvidencePack['category'] | ''>('');
  const [filterSourceType, setFilterSourceType] = useState<EvidencePack['sourceType'] | ''>('');
  const [filterStatus, setFilterStatus] = useState<EvidencePack['status'] | ''>('');
  const [filterDataSource, setFilterDataSource] = useState<'demo' | 'local' | ''>('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

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

  function handleClearFilters() {
    setSearchQuery('');
    setFilterCategory('');
    setFilterSourceType('');
    setFilterStatus('');
    setFilterDataSource('');
    setSortBy('newest');
  }

  const dedupedPersisted = useMemo(() => {
    const localIds = new Set(localPacks.map((p) => p.id));
    return persistedPacks.filter((p) => !localIds.has(p.id));
  }, [localPacks, persistedPacks]);

  const allUserPacks = useMemo(
    () => [...localPacks, ...dedupedPersisted],
    [localPacks, dedupedPersisted]
  );
  const allPacks = useMemo(
    () => [...allUserPacks, ...demoPacks],
    [allUserPacks, demoPacks]
  );
  const localBlobs = localPacks.flatMap((p) => getLocalBlobsByPackId(p.id));
  const persistedBlobCount = dedupedPersisted.reduce((sum, p) => sum + p.blobCount, 0);
  const totalBlobs = localBlobs.length + persistedBlobCount + demoBlobs.length;
  const activePacks = allPacks.filter((p) => p.status === 'active').length;

  const isFiltered =
    searchQuery.trim() !== '' ||
    filterCategory !== '' ||
    filterSourceType !== '' ||
    filterStatus !== '' ||
    filterDataSource !== '' ||
    sortBy !== 'newest';

  /** Apply search + filters to a pack array, then sort. */
  const applyFilters = useMemo(
    () =>
      (packs: EvidencePack[]): EvidencePack[] => {
        const filtered = packs.filter((pack) => {
          if (!packMatchesQuery(pack, searchQuery)) return false;
          if (filterCategory && pack.category !== filterCategory) return false;
          if (filterSourceType && pack.sourceType !== filterSourceType) return false;
          if (filterStatus && pack.status !== filterStatus) return false;
          if (filterDataSource) {
            const src = pack.dataSource ?? 'demo';
            if (src !== filterDataSource) return false;
          }
          return true;
        });
        return sortPacks(filtered, sortBy);
      },
    [searchQuery, filterCategory, filterSourceType, filterStatus, filterDataSource, sortBy]
  );

  const filteredUserPacks = useMemo(() => applyFilters(allUserPacks), [applyFilters, allUserPacks]);
  const filteredDemoPacks = useMemo(() => applyFilters(demoPacks), [applyFilters, demoPacks]);
  const totalFiltered = filteredUserPacks.length + filteredDemoPacks.length;

  const showUserSection =
    filteredUserPacks.length > 0 || (allUserPacks.length > 0 && !isFiltered);
  const showDemoSection = filteredDemoPacks.length > 0 || !isFiltered;
  const noResults = isFiltered && totalFiltered === 0;

  const selectClass =
    'shelby-cut-sm border border-white/12 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-[#9d9a92] transition hover:border-white/22 focus:outline-none focus:border-[#de8aff]/50 appearance-none cursor-pointer';

  return (
    <main className="kinetic-grid min-h-[calc(100vh-64px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_390px] lg:items-stretch">
          <section className="shelby-surface shelby-cut p-6">
            <div className="ui-chip">
              <ShieldCheck size={13} />
              Evidence index
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1] text-[#f4f0e8] sm:text-5xl">
              Inspectable storage state for AI evidence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9d9a92]">
              Demo corpus, browser-local records, and SQLite-persisted uploads resolve through one
              evidence index.
            </p>
          </section>

          <aside className="shelby-surface shelby-cut p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">
                  Runtime boundary
                </p>
                <p className="mt-2 text-lg font-semibold text-[#f4f0e8]">Local + SQLite</p>
              </div>
              <div className="grid h-11 w-11 place-items-center border border-[#9fe878]/30 bg-[#9fe878]/10 text-[#9fe878]">
                <HardDrive size={19} />
              </div>
            </div>
            <Link href="/upload" className="ui-button shelby-cut-sm w-full">
              <FilePlus2 size={16} />
              New evidence pack
            </Link>
          </aside>
        </div>

        <div className="mb-8 grid border-y border-white/10 bg-white/[0.035] sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Packs indexed"
            value={isFiltered ? `${totalFiltered} / ${allPacks.length}` : allPacks.length}
            tone="text-[#f4f0e8]"
          />
          <Metric label="Active packs" value={activePacks} tone="text-[#9fe878]" />
          <Metric label="Blobs tracked" value={totalBlobs} tone="text-[#de8aff]" />
          <Metric label="User packs" value={allUserPacks.length} tone="text-[#fd8565]" />
        </div>

        {/* Search / filter / sort toolbar */}
        <div className="mb-8 border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase text-[#6f716d]">
            <SlidersHorizontal size={13} />
            Search &amp; filter
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Search input */}
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f716d]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, tags, category…"
                className="shelby-cut-sm w-full border border-white/12 bg-white/[0.055] py-2 pl-8 pr-3 text-xs font-semibold text-[#f4f0e8] placeholder:font-normal placeholder:text-[#6f716d] focus:border-[#de8aff]/50 focus:outline-none"
              />
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as EvidencePack['category'] | '')}
              aria-label="Filter by category"
              className={selectClass}
            >
              <option value="">All categories</option>
              <option value="dataset">Dataset</option>
              <option value="agent-run">Agent run</option>
              <option value="document">Document</option>
              <option value="manifest">Manifest</option>
            </select>

            {/* Source type filter */}
            <select
              value={filterSourceType}
              onChange={(e) =>
                setFilterSourceType(e.target.value as EvidencePack['sourceType'] | '')
              }
              aria-label="Filter by source type"
              className={selectClass}
            >
              <option value="">All source types</option>
              <option value="web-scrape">Web scrape</option>
              <option value="api-export">API export</option>
              <option value="agent-output">Agent output</option>
              <option value="manual-upload">Manual upload</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EvidencePack['status'] | '')}
              aria-label="Filter by status"
              className={selectClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending</option>
            </select>

            {/* Data source filter */}
            <select
              value={filterDataSource}
              onChange={(e) => setFilterDataSource(e.target.value as 'demo' | 'local' | '')}
              aria-label="Filter by data source"
              className={selectClass}
            >
              <option value="">All sources</option>
              <option value="local">Local / uploaded</option>
              <option value="demo">Demo corpus</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort packs"
              className={selectClass}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-az">Title A–Z</option>
              <option value="blobs">Most blobs</option>
            </select>

            {/* Clear filters */}
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="shelby-cut-sm flex items-center gap-1.5 border border-[#de8aff]/35 bg-[#de8aff]/10 px-3 py-2 text-xs font-semibold text-[#de8aff] transition hover:border-[#de8aff]/55 hover:bg-[#de8aff]/15"
              >
                <RotateCcw size={12} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {noResults && (
          <div className="mb-10 flex flex-col items-center gap-4 border border-white/10 bg-white/[0.025] px-6 py-12 text-center">
            <Search size={28} className="text-[#6f716d]" />
            <div>
              <p className="text-base font-semibold text-[#f4f0e8]">No packs match your filters</p>
              <p className="mt-1 text-sm text-[#9d9a92]">
                Try adjusting your search query or filters, or reset to see the full index.
              </p>
            </div>
            <button
              onClick={handleClearFilters}
              className="shelby-cut-sm flex items-center gap-1.5 border border-[#de8aff]/35 bg-[#de8aff]/10 px-4 py-2 text-xs font-semibold text-[#de8aff] transition hover:border-[#de8aff]/55 hover:bg-[#de8aff]/15"
            >
              <RotateCcw size={12} />
              Reset filters
            </button>
          </div>
        )}

        {showUserSection && (
          <section className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="ui-chip">
                  <Activity size={13} />
                  User-created records
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#f4f0e8]">Local workspace</h2>
              </div>
              <div className="flex items-center gap-3">
                {isFiltered && (
                  <span className="font-mono text-xs font-semibold text-[#6f716d]">
                    {filteredUserPacks.length} / {allUserPacks.length} shown
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="shelby-cut-sm border border-white/12 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-[#9d9a92] transition hover:border-[#fd8565]/50 hover:text-[#ffc2ad]"
                >
                  {resetConfirm ? 'Click again to reset browser cache' : 'Reset browser cache'}
                </button>
              </div>
            </div>
            {filteredUserPacks.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredUserPacks.map((pack) => (
                  <EvidencePackCard key={pack.id} pack={pack} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f716d]">
                No local records match the current filters.
              </p>
            )}
          </section>
        )}

        {showDemoSection && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="ui-chip">
                  <Database size={13} />
                  Built-in corpus
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#f4f0e8]">Demo evidence</h2>
              </div>
              <div className="hidden items-center gap-2 font-mono text-xs font-semibold uppercase text-[#6f716d] sm:flex">
                <Layers3 size={14} />
                {isFiltered
                  ? `${filteredDemoPacks.length} / ${demoPacks.length} packs`
                  : `${demoPacks.length} packs`}
              </div>
            </div>
            {filteredDemoPacks.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredDemoPacks.map((pack) => (
                  <EvidencePackCard key={pack.id} pack={pack} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f716d]">
                No demo packs match the current filters.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
