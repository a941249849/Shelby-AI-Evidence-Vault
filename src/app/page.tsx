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

function ProofStep({
  index,
  title,
  body,
  tone,
  dark = false,
}: {
  index: string;
  title: string;
  body: string;
  tone: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[3rem_1fr] gap-4 border-b pb-5 last:border-b-0 ${
        dark ? 'border-white/10' : 'border-[#2d211c]/10'
      }`}
    >
      <div className={`grid h-12 w-12 place-items-center rounded-full border ${tone}`}>
        <span className="font-mono text-xs font-semibold">{index}</span>
      </div>
      <div>
        <h3 className={`text-base font-semibold ${dark ? 'text-[#fff8ea]' : 'text-[#2d211c]'}`}>
          {title}
        </h3>
        <p className={`mt-1 text-sm leading-6 ${dark ? 'text-[#cfc4b4]' : 'text-[#6f6258]'}`}>
          {body}
        </p>
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  className: string;
}) {
  return (
    <div className={`shelby-cut p-5 ${className}`}>
      <div className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-[#2d211c]/12 bg-[#fff8ea]/72 text-[#2d211c]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[#2d211c]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#4d433c]">{body}</p>
    </div>
  );
}

function ProductPanel() {
  return (
    <div className="shelby-cut relative overflow-hidden border border-[#2d211c]/12 bg-[#fff8ea] p-4 shadow-[0_30px_90px_rgba(80,48,24,0.18)]">
      <div className="hex-field absolute inset-0 opacity-30" />
      <div className="relative grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="shelby-cut bg-[#2d211c] p-5 text-[#fff8ea]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="ui-chip border-white/15 bg-white/10 text-[#fff8ea]">
              <Network size={13} />
              Live proof path
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dff2c8] text-[#157a4c]">
              <ShieldCheck size={19} />
            </div>
          </div>
          <div className="space-y-4">
            <ProofStep
              index="01"
              title="Pack"
              body="Gather source material into an evidence pack with typed metadata."
              tone="border-[#f0c846]/45 bg-[#f0c846]/16 text-[#f0c846]"
              dark
            />
            <ProofStep
              index="02"
              title="Bind"
              body="Hash files and bind them to Shelby-ready blob identity."
              tone="border-[#ef6f4d]/45 bg-[#ef6f4d]/16 text-[#ffb49e]"
              dark
            />
            <ProofStep
              index="03"
              title="Resolve"
              body="Receipts reconnect an answer to packs, blobs, hashes, and runtime state."
              tone="border-[#9fe878]/45 bg-[#9fe878]/16 text-[#b9f39d]"
              dark
            />
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="shelby-cut duotone-green p-5">
            <p className="font-mono text-xs font-semibold uppercase text-[#157a4c]">
              Runtime store
            </p>
            <p className="mt-5 text-5xl font-semibold text-[#2d211c]">SQLite</p>
            <p className="mt-2 text-sm text-[#4d433c]">Uploads survive browser resets.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="shelby-cut duotone-lilac p-4">
              <p className="font-mono text-xs font-semibold uppercase text-[#6a3ea1]">Packs</p>
              <p className="mt-3 text-3xl font-semibold text-[#2d211c]">{evidencePacks.length}</p>
            </div>
            <div className="shelby-cut duotone-coral p-4">
              <p className="font-mono text-xs font-semibold uppercase text-[#a33f2d]">Blobs</p>
              <p className="mt-3 text-3xl font-semibold text-[#2d211c]">
                {evidencePacks.reduce((sum, pack) => sum + pack.blobCount, 0)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="kinetic-grid min-h-screen text-[#2d211c]">
      <section className="px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-18">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div className="py-4">
            <div className="mb-8 flex items-center gap-4">
              <div className="shelby-mark h-16 w-16">
                <span />
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#157a4c]">
                  Built to hold. Made to move.
                </p>
                <p className="mt-1 text-sm text-[#6f6258]">
                  Evidence packs, Shelby blobs, read receipts
                </p>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] text-[#2d211c] sm:text-6xl lg:text-7xl">
              Verifiable memory for AI agents.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#5f554d]">
              A warmer Shelby-shaped product surface for packaging source files, resolving blob
              identity, and proving which evidence an answer used.
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[#157a4c] transition hover:text-[#6a3ea1]"
              >
                Inspect receipt
                <ReceiptText size={16} />
              </Link>
            </div>
          </div>

          <ProductPanel />
        </div>
      </section>

      <section className="border-y border-[#2d211c]/10 bg-[#fff8ea]/55 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <FeatureTile
            icon={Database}
            title="Structured packs"
            body="Source material is packaged with category, tags, hashes, and persistence state."
            className="duotone-green"
          />
          <FeatureTile
            icon={Fingerprint}
            title="Blob identity"
            body="Demo, mock, and testnet records stay visually distinct without hiding protocol truth."
            className="duotone-lilac"
          />
          <FeatureTile
            icon={CheckCircle2}
            title="Receipt proof"
            body="Each receipt becomes a compact trace from answer back to evidence and storage."
            className="duotone-coral"
          />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="ui-chip">
                <Braces size={13} />
                Demo corpus
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[#2d211c]">
                Evidence packs ready to inspect.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#157a4c] transition hover:text-[#6a3ea1]"
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
