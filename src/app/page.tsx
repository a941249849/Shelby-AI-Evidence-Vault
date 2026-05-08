import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Check,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
  ReceiptText,
  ShieldCheck,
  TerminalSquare,
  UploadCloud,
} from 'lucide-react';
import { evidencePacks } from '@/lib/demo-data';

const proofRows = [
  ['FILE_HASH', '8f1c7a2e...', 'SHA-256'],
  ['SHELBY_REF', 'shelby://testnet/{account}/{blob}', 'Blob identity'],
  ['RECEIPT_ID', 'rrpt_01HZX...', 'Verified'],
];

function FlowNode({
  index,
  title,
  eyebrow,
  icon: Icon,
  active = false,
}: {
  index: string;
  title: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <div className={`proof-node ${active ? 'proof-node-active' : ''}`}>
      <p className="font-mono text-xs font-bold text-[#ff4faf]">{index}</p>
      <div className="mt-4 grid h-14 w-14 place-items-center border border-[#f0bfd5] bg-[#fff7fb] text-[#352211]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-base font-black text-[#2f1f12]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#6d5f55]">{eyebrow}</p>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <article className="feature-tile">
      <div className="grid h-14 w-14 place-items-center border border-[#f0bfd5] bg-[#fff2f9] text-[#2f1f12]">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-xl font-black text-[#2f1f12]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#5f5148]">{body}</p>
        <p className="mt-6 inline-flex border border-[#f0bfd5] bg-white px-3 py-1 font-mono text-xs font-semibold text-[#6d4b36]">
          {meta}
        </p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const blobCount = evidencePacks.reduce((sum, pack) => sum + pack.blobCount, 0);

  return (
    <main className="shelby-home min-h-screen overflow-hidden text-[#2f1f12]">
      <section className="hero-shell relative px-5 pb-12 pt-16 sm:px-8 lg:px-12">
        <div className="brand-shard brand-shard-left" />
        <div className="brand-shard brand-shard-right" />
        <div className="brand-shard brand-shard-center" />

        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <div className="relative z-10 py-6 lg:py-10">
            <p className="font-mono text-sm font-bold uppercase text-[#ff4faf]">
              Shelby ecosystem
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.8rem,6.2vw,5.45rem)] font-black leading-[0.92] text-[#2f1f12]">
              AI evidence that can be traced.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f443c]">
              Turn datasets, documents, and agent outputs into Evidence Packs, bind them to Shelby
              Blob identity, and issue Read Receipts that show exactly what an AI workflow used.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/upload" className="shelby-primary-button">
                <UploadCloud size={19} />
                Create evidence pack
                <span className="button-arrow">
                  <ArrowRight size={20} />
                </span>
              </Link>
              <Link href="/dashboard" className="shelby-secondary-button">
                <Database size={18} />
                Browse registry
              </Link>
              <Link href="/read-receipt/rr-001" className="receipt-link">
                View receipt
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 border-y border-[#e4d5cc] bg-white/55">
              <div className="metric-cell">
                <p>Evidence packs</p>
                <strong>{evidencePacks.length}</strong>
              </div>
              <div className="metric-cell">
                <p>Tracked blobs</p>
                <strong>{blobCount}</strong>
              </div>
              <div className="metric-cell">
                <p>RC checks</p>
                <strong>20/20</strong>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="proof-board">
              <div className="mb-7 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold uppercase text-[#ff4faf]">
                    Evidence flow
                  </p>
                  <h2 className="mt-3 text-[1.7rem] font-black leading-tight text-[#2f1f12]">
                    From source file to verifiable receipt.
                  </h2>
                </div>
                <span className="hidden h-11 items-center gap-2 border border-[#e5cfc4] bg-white px-4 font-mono text-xs font-semibold text-[#3f3028] sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-[#3abe32]" />
                  testnet path ready
                </span>
              </div>

              <div className="flow-grid">
                <FlowNode index="01" title="Source file" eyebrow="Dataset, document, or agent output" icon={FileText} />
                <FlowNode index="02" title="Evidence pack" eyebrow="Structured bundle with metadata" icon={Box} active />
                <FlowNode index="03" title="Shelby Blob" eyebrow="Hash, ref, account, blob name" icon={Fingerprint} />
                <FlowNode index="04" title="Read receipt" eyebrow="Usage record and audit trail" icon={ReceiptText} />
              </div>

              <div className="proof-table">
                {proofRows.map(([label, value, status]) => (
                  <div key={label} className="proof-row">
                    <span>{label}</span>
                    <code>{value}</code>
                    <strong>{status}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="relative px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1220px] gap-6 lg:grid-cols-3">
          <FeatureTile
            icon={Box}
            title="Evidence Pack"
            body="A normalized package for source files, datasets, and agent artifacts with hashes, provenance, metadata, and category context."
            meta="PACK_HASH - ITEMS - CREATED_AT"
          />
          <FeatureTile
            icon={ShieldCheck}
            title="Shelby Blob"
            body="The protocol identity surface: Shelby reference, hash, network, account address, blob name, storage status, and retrieval links."
            meta="SHELBY_REF - NETWORK - STATUS"
          />
          <FeatureTile
            icon={ReceiptText}
            title="Read Receipt"
            body="A durable receipt tying an AI answer back to the exact BlobRecords and Evidence Packs that informed it."
            meta="RECEIPT_ID - BLOBS - VERIFIED"
          />
        </div>
      </section>

      <section id="developers" className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-6 border border-[#f0bfd5] bg-[#fff7fb]/75 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center border border-[#f0bfd5] bg-white text-[#ff4faf]">
              <TerminalSquare />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2f1f12]">Built for agent developers</h2>
              <p className="mt-1 text-sm text-[#5f5148]">
                Verify the local release candidate, then connect the browser-wallet Shelby testnet path.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="developer-pill">
              Registry
            </Link>
            <Link href="/upload" className="developer-pill">
              Upload
            </Link>
            <a
              href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="developer-pill"
            >
              <GitBranch size={15} />
              GitHub
            </a>
            <span className="developer-pill">
              <Check size={15} />
              C12 RC
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
