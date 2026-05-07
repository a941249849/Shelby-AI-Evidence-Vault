import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Braces, FileWarning, Fingerprint, Network, ShieldCheck } from 'lucide-react';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';

const demoPacks = evidencePacks.slice(0, 3);

function ShelbyGlyph() {
  return (
    <div className="shelby-hex relative h-28 w-28 bg-[#4f192a] shadow-[0_28px_80px_rgba(79,25,42,0.18)]">
      <div className="shelby-hex absolute inset-3 bg-[#fd8565]" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="h-9 w-9 rounded-full bg-[#fcfaf8] shadow-[inset_0_0_0_8px_rgba(222,138,255,0.45)]" />
      </div>
    </div>
  );
}

function ProofRow({
  step,
  title,
  body,
  tone,
}: {
  step: string;
  title: string;
  body: string;
  tone: 'violet' | 'green' | 'pink' | 'coral';
}) {
  const tones = {
    violet: 'bg-[#eee2ff] text-[#470b64] border-[#de8aff]/45',
    green: 'bg-[#dfffcc] text-[#21351a] border-[#9fe878]/55',
    pink: 'bg-[#ffdfef] text-[#4f192a] border-[#ff77c9]/45',
    coral: 'bg-[#ffdcd9] text-[#4f192a] border-[#fd8565]/45',
  };

  return (
    <div className="shelby-cut-sm grid gap-3 border border-[#161008]/12 bg-[#fcfaf8] p-4 sm:grid-cols-[72px_1fr]">
      <div className={`shelby-hex grid h-12 w-12 place-items-center border font-mono text-xs ${tones[tone]}`}>
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#161008]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#6f6258]">{body}</p>
      </div>
    </div>
  );
}

function ProblemCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8] p-5 shadow-[0_18px_54px_rgba(22,16,8,0.045)]">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded bg-[#ffdcd9] text-[#4f192a]">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-[#161008]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#6f6258]">{body}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[#fcfaf8] text-[#161008]">
      <section className="relative overflow-hidden px-4">
        <div className="absolute inset-0 ledger-line opacity-80" />
        <div className="absolute right-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rotate-[60deg] rounded-[44px] bg-[#eee2ff]" />
        <div className="absolute bottom-[-18rem] left-[-10rem] h-[30rem] w-[30rem] rotate-[60deg] rounded-[44px] bg-[#dfffcc]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <div className="mb-7 flex items-center gap-4">
              <ShelbyGlyph />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#4f192a]">
                  Built to hold, made to move
                </p>
                <p className="mt-2 text-sm text-[#6f6258]">
                  M1B local demo. Real Shelby upload remains blocked until M2.
                </p>
              </div>
            </div>

            <h1 className="max-w-5xl text-[3.35rem] font-semibold leading-[0.94] tracking-tight text-[#161008] sm:text-[4.5rem] lg:text-[6.8rem]">
              Verifiable memory for AI evidence.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#4f192a] sm:text-lg">
              Evidence packs, hash fingerprints, mock Shelby references, and read receipts in one
              inspectable trail. Warm product surface, strict protocol boundary.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="shelby-cut-sm inline-flex items-center justify-center gap-2 bg-[#161008] px-5 py-3 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#4f192a]"
              >
                Open evidence vault
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/upload"
                className="shelby-cut-sm inline-flex items-center justify-center gap-2 border border-[#161008]/18 bg-[#fcfaf8] px-5 py-3 text-sm font-semibold text-[#161008] transition hover:border-[#fd8565] hover:bg-[#ffdcd9]"
              >
                Upload local pack
              </Link>
              <Link
                href="/read-receipt/rr-001"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#470b64] transition hover:text-[#ff77c9]"
              >
                Read receipt demo
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 h-20 w-20 rotate-[60deg] rounded-[14px] bg-[#ff77c9]" />
            <div className="absolute -bottom-5 left-10 h-28 w-28 rotate-[60deg] rounded-[18px] bg-[#9fe878]" />
            <div className="shelby-cut relative border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-[0_34px_120px_rgba(22,16,8,0.14)] backdrop-blur">
              <div className="mb-6 grid gap-4 border-b border-[#161008]/10 pb-5 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#6f6258]">
                    Evidence chain
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#161008]">
                    Query to proof, visible at every step.
                  </h2>
                </div>
                <div className="shelby-hex grid h-14 w-14 place-items-center bg-[#4f192a] text-[#dfffcc]">
                  <ShieldCheck size={22} />
                </div>
              </div>

              <div className="grid gap-3">
                <ProofRow
                  step="01"
                  title="Evidence pack"
                  body="Dataset, document, or agent output grouped with metadata."
                  tone="violet"
                />
                <ProofRow
                  step="02"
                  title="Blob fingerprint"
                  body="SHA-256 hash plus illustrative shelby://demo or local mock reference."
                  tone="green"
                />
                <ProofRow
                  step="03"
                  title="Agent usage"
                  body="The answer run records exactly which blobs were referenced."
                  tone="pink"
                />
                <ProofRow
                  step="04"
                  title="Read receipt"
                  body="Query, evidence references, and answer summary become inspectable."
                  tone="coral"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#4f192a]">
              Why this exists
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#161008]">
              AI output needs a proof surface, not just a file list.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ProblemCard
              icon={<Fingerprint size={20} />}
              title="Untracked provenance"
              body="Models consume datasets, exports, and agent outputs without a durable chain of custody."
            />
            <ProblemCard
              icon={<FileWarning size={20} />}
              title="Weak source proof"
              body="Files may carry names and folders, but not a compact trail of hash, origin, and reference."
            />
            <ProblemCard
              icon={<Network size={20} />}
              title="Lost answer context"
              body="A query can produce an answer without preserving the evidence it actually referenced."
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="shelby-cut bg-[#4f192a] p-6 text-[#fcfaf8]">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffc2ad]">
              Product model
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              A vault for evidence, not another upload folder.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#ffdfef]">
              M1B proves the workflow locally. M2 wires the official Shelby path once SDK, wallet,
              funding, commitment, and RPC details are ready.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Evidence Packs', 'Datasets, documents, and agent runs grouped with metadata.'],
              ['Mock References', 'Deterministic local refs plus SHA-256 fingerprints.'],
              ['Read Receipts', 'A query, its evidence, and the answer summary in one trail.'],
            ].map(([title, body], index) => (
              <div key={title} className="shelby-cut-sm border border-[#161008]/12 bg-[#fcfaf8] p-5">
                <div className="mb-8 font-mono text-xs text-[#470b64]">0{index + 1}</div>
                <h3 className="font-semibold text-[#161008]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6f6258]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff77c9]">
                Demo evidence
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#161008]">
                Sample evidence packs
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6258]">
                Built-in demo objects use illustrative references. Local uploads create mock
                references in this browser only.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#470b64] transition hover:text-[#ff77c9]"
            >
              View evidence index
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

      <section className="border-t border-[#161008]/10 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="shelby-hex inline-flex h-12 w-12 items-center justify-center bg-[#eee2ff] text-[#470b64]">
                <Braces size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[#161008]">Developer quickstart</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6258]">
                Run the M1B local demo with no env vars. Real Shelby upload remains blocked until
                the M2 SDK/wallet design is approved.
              </p>
            </div>
            <pre className="shelby-cut overflow-x-auto bg-[#161008] p-5 text-sm leading-7 text-[#dfffcc]">
              <code>{`git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
