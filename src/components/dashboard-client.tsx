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
import { getPersistedBlobsByPackAction, getPersistedPacksAction } from '@/app/actions/persist';
import { useLanguage } from '@/components/language-state';

interface DashboardClientProps {
  demoPacks: EvidencePack[];
  demoBlobs: BlobRecord[];
}

type SortKey = 'newest' | 'oldest' | 'title-az' | 'blobs';
type DataSourceFilter = NonNullable<EvidencePack['dataSource']> | '';

const dashboardCopy = {
  zh: {
    chip: '证据索引',
    title: 'AI 证据的可检查存储状态。',
    subtitle: 'Demo 语料、本地浏览器记录、SQLite 持久化上传与 Shelby 测试网记录统一汇入一个证据索引。',
    runtime: '运行边界',
    runtimeValue: '本地 + SQLite + Shelby testnet',
    newPack: '新建证据包',
    metrics: ['已索引证据包', '活跃证据包', '已追踪 Blob', '用户证据包'],
    search: '搜索与筛选',
    searchPlaceholder: '搜索标题、标签、分类...',
    allCategories: '所有分类',
    allSourceTypes: '所有来源类型',
    allStatuses: '所有状态',
    allSources: '所有来源',
    newest: '最新优先',
    oldest: '最早优先',
    titleAz: '标题 A-Z',
    mostBlobs: 'Blob 最多',
    clear: '清除筛选',
    noTitle: '没有匹配的证据包',
    noBody: '调整搜索词或筛选条件，或重置查看完整索引。',
    resetFilters: '重置筛选',
    userChip: '用户创建记录',
    localWorkspace: '用户 / 测试网记录',
    shown: '已显示',
    resetCache: '重置浏览器缓存',
    resetCacheConfirm: '再次点击确认重置',
    noLocal: '当前筛选条件下没有用户或测试网记录。',
    demoChip: '内置语料',
    demoEvidence: 'Demo 证据',
    packs: '证据包',
    noDemo: '当前筛选条件下没有 Demo 证据包。',
  },
  en: {
    chip: 'Evidence index',
    title: 'Inspectable storage state for AI evidence.',
    subtitle:
      'Demo corpus, browser-local records, SQLite-persisted uploads, and Shelby testnet records resolve through one evidence index.',
    runtime: 'Runtime boundary',
    runtimeValue: 'Local + SQLite + Shelby testnet',
    newPack: 'New evidence pack',
    metrics: ['Packs indexed', 'Active packs', 'Blobs tracked', 'User packs'],
    search: 'Search & filter',
    searchPlaceholder: 'Search title, tags, category...',
    allCategories: 'All categories',
    allSourceTypes: 'All source types',
    allStatuses: 'All statuses',
    allSources: 'All sources',
    newest: 'Newest first',
    oldest: 'Oldest first',
    titleAz: 'Title A-Z',
    mostBlobs: 'Most blobs',
    clear: 'Clear filters',
    noTitle: 'No packs match your filters',
    noBody: 'Try adjusting your search query or filters, or reset to see the full index.',
    resetFilters: 'Reset filters',
    userChip: 'User-created records',
    localWorkspace: 'User / testnet records',
    shown: 'shown',
    resetCache: 'Reset browser cache',
    resetCacheConfirm: 'Click again to reset browser cache',
    noLocal: 'No user or testnet records match the current filters.',
    demoChip: 'Built-in corpus',
    demoEvidence: 'Demo evidence',
    packs: 'packs',
    noDemo: 'No demo packs match the current filters.',
  },
};

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
  const { language } = useLanguage();
  const t = dashboardCopy[language];
  const [localPacks, setLocalPacks] = useState<EvidencePack[]>([]);
  const [persistedPacks, setPersistedPacks] = useState<EvidencePack[]>([]);
  const [persistedBlobs, setPersistedBlobs] = useState<BlobRecord[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Search / filter / sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<EvidencePack['category'] | ''>('');
  const [filterSourceType, setFilterSourceType] = useState<EvidencePack['sourceType'] | ''>('');
  const [filterStatus, setFilterStatus] = useState<EvidencePack['status'] | ''>('');
  const [filterDataSource, setFilterDataSource] = useState<DataSourceFilter>('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPacks(getLocalPacks());
    getPersistedPacksAction()
      .then(async (packs) => {
        setPersistedPacks(packs);
        const blobs = await Promise.all(
          packs.map((pack) => getPersistedBlobsByPackAction(pack.id))
        );
        setPersistedBlobs(blobs.flat());
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
  const localBlobs = useMemo(
    () => localPacks.flatMap((p) => getLocalBlobsByPackId(p.id)),
    [localPacks]
  );
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
  const primaryBlobByPackId = useMemo(() => {
    const map = new Map<string, string>();
    for (const blob of [...demoBlobs, ...localBlobs, ...persistedBlobs]) {
      if (!map.has(blob.evidencePackId)) {
        map.set(blob.evidencePackId, blob.id);
      }
    }
    return map;
  }, [demoBlobs, localBlobs, persistedBlobs]);

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
              {t.chip}
            </div>
            <span className="sr-only">Evidence index</span>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1] text-[#f4f0e8] sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9d9a92]">
              {t.subtitle}
            </p>
          </section>

          <aside className="shelby-surface shelby-cut p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">
                  {t.runtime}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#f4f0e8]">{t.runtimeValue}</p>
              </div>
              <div className="grid h-11 w-11 place-items-center border border-[#9fe878]/30 bg-[#9fe878]/10 text-[#9fe878]">
                <HardDrive size={19} />
              </div>
            </div>
            <Link href="/upload" className="ui-button shelby-cut-sm w-full">
              <FilePlus2 size={16} />
              {t.newPack}
            </Link>
          </aside>
        </div>

        <div className="mb-8 grid border-y border-white/10 bg-white/[0.035] sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={t.metrics[0]}
            value={isFiltered ? `${totalFiltered} / ${allPacks.length}` : allPacks.length}
            tone="text-[#f4f0e8]"
          />
          <Metric label={t.metrics[1]} value={activePacks} tone="text-[#9fe878]" />
          <Metric label={t.metrics[2]} value={totalBlobs} tone="text-[#de8aff]" />
          <Metric label={t.metrics[3]} value={allUserPacks.length} tone="text-[#fd8565]" />
        </div>

        {/* Search / filter / sort toolbar */}
        <div className="mb-8 border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase text-[#6f716d]">
            <SlidersHorizontal size={13} />
            {t.search}
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
                placeholder={t.searchPlaceholder}
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
              <option value="">{t.allCategories}</option>
              <option value="dataset">{language === 'zh' ? '数据集' : 'Dataset'}</option>
              <option value="agent-run">{language === 'zh' ? 'Agent 运行' : 'Agent run'}</option>
              <option value="document">{language === 'zh' ? '文档' : 'Document'}</option>
              <option value="manifest">{language === 'zh' ? '清单' : 'Manifest'}</option>
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
              <option value="">{t.allSourceTypes}</option>
              <option value="web-scrape">{language === 'zh' ? '网页抓取' : 'Web scrape'}</option>
              <option value="api-export">{language === 'zh' ? 'API 导出' : 'API export'}</option>
              <option value="agent-output">{language === 'zh' ? 'Agent 输出' : 'Agent output'}</option>
              <option value="manual-upload">{language === 'zh' ? '手动上传' : 'Manual upload'}</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EvidencePack['status'] | '')}
              aria-label="Filter by status"
              className={selectClass}
            >
              <option value="">{t.allStatuses}</option>
              <option value="active">{language === 'zh' ? '活跃' : 'Active'}</option>
              <option value="archived">{language === 'zh' ? '归档' : 'Archived'}</option>
              <option value="pending">{language === 'zh' ? '待处理' : 'Pending'}</option>
            </select>

            {/* Data source filter */}
            <select
              value={filterDataSource}
              onChange={(e) => setFilterDataSource(e.target.value as DataSourceFilter)}
              aria-label="Filter by data source"
              className={selectClass}
            >
              <option value="">{t.allSources}</option>
              <option value="local">{language === 'zh' ? '本地 / 已上传' : 'Local / uploaded'}</option>
              <option value="shelby-testnet">Shelby {language === 'zh' ? '测试网' : 'testnet'}</option>
              <option value="demo">{language === 'zh' ? 'Demo 语料' : 'Demo corpus'}</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort packs"
              className={selectClass}
            >
              <option value="newest">{t.newest}</option>
              <option value="oldest">{t.oldest}</option>
              <option value="title-az">{t.titleAz}</option>
              <option value="blobs">{t.mostBlobs}</option>
            </select>

            {/* Clear filters */}
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="shelby-cut-sm flex items-center gap-1.5 border border-[#de8aff]/35 bg-[#de8aff]/10 px-3 py-2 text-xs font-semibold text-[#de8aff] transition hover:border-[#de8aff]/55 hover:bg-[#de8aff]/15"
              >
                <RotateCcw size={12} />
                {t.clear}
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {noResults && (
          <div className="mb-10 flex flex-col items-center gap-4 border border-white/10 bg-white/[0.025] px-6 py-12 text-center">
            <Search size={28} className="text-[#6f716d]" />
            <div>
              <p className="text-base font-semibold text-[#f4f0e8]">{t.noTitle}</p>
              <p className="mt-1 text-sm text-[#9d9a92]">
                {t.noBody}
              </p>
            </div>
            <button
              onClick={handleClearFilters}
              className="shelby-cut-sm flex items-center gap-1.5 border border-[#de8aff]/35 bg-[#de8aff]/10 px-4 py-2 text-xs font-semibold text-[#de8aff] transition hover:border-[#de8aff]/55 hover:bg-[#de8aff]/15"
            >
              <RotateCcw size={12} />
              {t.resetFilters}
            </button>
          </div>
        )}

        {showUserSection && (
          <section className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="ui-chip">
                  <Activity size={13} />
                  {t.userChip}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#f4f0e8]">{t.localWorkspace}</h2>
              </div>
              <div className="flex items-center gap-3">
                {isFiltered && (
                  <span className="font-mono text-xs font-semibold text-[#6f716d]">
                    {filteredUserPacks.length} / {allUserPacks.length} {t.shown}
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="shelby-cut-sm border border-white/12 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-[#9d9a92] transition hover:border-[#fd8565]/50 hover:text-[#ffc2ad]"
                >
                  {resetConfirm ? t.resetCacheConfirm : t.resetCache}
                </button>
              </div>
            </div>
            {filteredUserPacks.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredUserPacks.map((pack) => (
                  <EvidencePackCard
                    key={pack.id}
                    pack={pack}
                    primaryBlobId={primaryBlobByPackId.get(pack.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f716d]">
                {t.noLocal}
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
                  {t.demoChip}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[#f4f0e8]">{t.demoEvidence}</h2>
              </div>
              <div className="hidden items-center gap-2 font-mono text-xs font-semibold uppercase text-[#6f716d] sm:flex">
                <Layers3 size={14} />
                {isFiltered
                  ? `${filteredDemoPacks.length} / ${demoPacks.length} ${t.packs}`
                  : `${demoPacks.length} ${t.packs}`}
              </div>
            </div>
            {filteredDemoPacks.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredDemoPacks.map((pack) => (
                  <EvidencePackCard
                    key={pack.id}
                    pack={pack}
                    primaryBlobId={primaryBlobByPackId.get(pack.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6f716d]">
                {t.noDemo}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
