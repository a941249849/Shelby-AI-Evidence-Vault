import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Database,
  Fingerprint,
  Network,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';

const demoPacks = evidencePacks.slice(0, 3);

function SystemMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-l border-white/10 px-4 py-3 first:border-l-0">
      <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function ProofStep({
  index,
  title,
  body,
  icon: Icon,
}: {
  index: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="trace-line grid grid-cols-[2.3rem_1fr] gap-4">
      <div className="grid h-9 w-9 place-items-center border border-[#9fe878]/35 bg-[#9fe878]/10 text-[#9fe878]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="border-b border-white/10 pb-5">
        <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">{index}</p>
        <h3 className="mt-1 text-base font-semibold text-[#f4f0e8]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#9d9a92]">{body}</p>
      </div>
    </div>
  );
}

function Capability({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="shelby-cut border border-white/10 bg-[#15161c] p-5">
      <div className={`mb-7 h-1.5 w-20 ${accent}`} />
      <h3 className="text-base font-semibold text-[#f4f0e8]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#9d9a92]">{body}</p>
    </div>
  );
}

export default function HomePage() {
  const blobCount = evidencePacks.reduce((sum, pack) => sum + pack.blobCount, 0);

  return (
    <div className="kinetic-grid min-h-screen text-[#f4f0e8]">
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9fe878]/60 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-between py-4">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <div className="shelby-mark h-16 w-16">
                  <span />
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold uppercase text-[#9fe878]">
                    Shelby proof interface
                  </p>
                  <p className="mt-1 text-sm text-[#9d9a92]">
                    Evidence packs, blob identity, read receipts
                  </p>
                </div>
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-[#f4f0e8] sm:text-6xl lg:text-7xl">
                Verifiable memory for AI systems.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#c7c1b8]">
                A product demo for storing AI evidence on a Shelby-shaped path: local mock by
                default, browser-wallet testnet upload when configured, and SQLite persistence for
                user-created records.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="ui-button shelby-cut-sm">
                  Open evidence index
                  <ArrowRight size={16} />
                </Link>
                <Link href="/upload" className="ui-button ui-button-secondary shelby-cut-sm">
                  Upload evidence
                  <UploadCloud size={16} />
                </Link>
                <Link
                  href="/read-receipt/rr-001"
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-[#9fe878] transition hover:text-[#de8aff]"
                >
                  Inspect receipt
                  <ReceiptText size={16} />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid border-y border-white/10 bg-white/[0.035] sm:grid-cols-3">
              <SystemMetric label="Demo packs" value={String(evidencePacks.length)} tone="text-[#f4f0e8]" />
              <SystemMetric label="Tracked blobs" value={String(blobCount)} tone="text-[#9fe878]" />
              <SystemMetric label="Runtime store" value="SQLite" tone="text-[#de8aff]" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-rows-[1fr_auto]">
            <div className="shelby-surface shelby-cut p-5 sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="ui-chip">
                    <Network size={13} />
                    Evidence chain
                  </div>
                  <h2 className="mt-4 max-w-xl text-2xl font-semibold text-[#f4f0e8]">
                    Every answer can point back to the data it touched.
                  </h2>
                </div>
                <div className="hidden border border-[#9fe878]/30 bg-[#9fe878]/10 p-3 text-[#9fe878] sm:block">
                  <ShieldCheck size={24} />
                </div>
              </div>

              <div className="space-y-5">
                <ProofStep
                  index="Stage 01"
                  title="Pack the source material"
                  body="Datasets, documents, exports, and agent outputs become evidence packs."
                  icon={Database}
                />
                <ProofStep
                  index="Stage 02"
                  title="Bind file identity"
                  body="Each blob carries hash, reference, source, size, mode, and network metadata."
                  icon={Fingerprint}
                />
                <ProofStep
                  index="Stage 03"
                  title="Persist the proof surface"
                  body="SQLite keeps user-created packs, blobs, and receipts beyond browser storage."
                  icon={CheckCircle2}
                />
                <ProofStep
                  index="Stage 04"
                  title="Resolve read receipts"
                  body="Receipts connect questions, responses, referenced blobs, and pack lineage."
                  icon={ReceiptText}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Capability
                title="Mock-first runtime"
                body="No wallet or key required for the default local flow."
                accent="bg-[#9fe878]"
              />
              <Capability
                title="Testnet path"
                body="Browser wallet upload path keeps signing material out of the app."
                accent="bg-[#de8aff]"
              />
              <Capability
                title="Receipt binding"
                body="Receipts resolve BlobRecord identity across demo, local, and SQLite records."
                accent="bg-[#fd8565]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="ui-chip">
                <Braces size={13} />
                Demo corpus
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[#f4f0e8]">
                Evidence packs ready to inspect.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#9fe878] transition hover:text-[#de8aff]"
            >
              Full index
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {demoPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
