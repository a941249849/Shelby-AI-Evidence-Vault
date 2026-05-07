import Link from 'next/link';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';

export default function HomePage() {
  const demoPacks = evidencePacks.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-[#0b0e14] border-b border-slate-800/50 py-24 px-4 overflow-hidden">
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono px-3 py-1.5 rounded mb-8">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            M1B · local mock upload · real Shelby integration blocked until M2
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight text-white">
            AI evidence.{' '}
            <span className="text-violet-400">Cryptographically traceable.</span>
          </h1>

          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Store AI agent outputs, datasets, and read receipts with SHA-256 verification and
            Shelby blob references. Every blob, every query, every answer — structured for
            auditability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto text-center text-sm"
            >
              Open Evidence Vault →
            </Link>
            <Link
              href="/upload"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-2.5 rounded-lg border border-slate-700 transition-colors w-full sm:w-auto text-center text-sm"
            >
              Upload Evidence Pack
            </Link>
            <a
              href="#docs"
              className="text-slate-400 hover:text-slate-200 font-medium px-6 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors w-full sm:w-auto text-center text-sm"
            >
              Developer Docs
            </a>
          </div>
        </div>
      </section>

      {/* Problem/solution strip */}
      <section className="py-16 px-4 bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center mb-10">
            The provenance gap in AI systems
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                id: '01',
                title: 'No Data Provenance',
                accent: 'border-l-slate-700',
                body: 'AI models are trained and run on datasets with no chain of custody. When outputs are wrong, there is no trail back to the source data.',
              },
              {
                id: '02',
                title: 'Unverifiable Sources',
                accent: 'border-l-amber-800',
                body: 'Web scrapes, API exports, and agent outputs are stored as raw files with no cryptographic proof of integrity or timestamp.',
              },
              {
                id: '03',
                title: 'Lost Context',
                accent: 'border-l-violet-800',
                body: 'Agent runs reference datasets at query time, but the link between question, evidence consumed, and answer is never durably recorded.',
              },
            ].map((card) => (
              <div
                key={card.id}
                className={`bg-slate-900 border border-slate-800 border-l-2 ${card.accent} rounded-lg p-5`}
              >
                <p className="text-xs font-mono text-slate-600 mb-2">{card.id}</p>
                <h3 className="font-semibold text-slate-200 text-sm mb-2">{card.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4 bg-[#0b0e14] border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center mb-10">
            What Shelby Evidence Vault provides
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                id: 'A',
                label: 'Evidence Packs',
                accent: 'text-violet-400',
                body: 'Group related blobs into evidence packs — datasets, agent runs, documents, manifests. Each pack carries metadata, tags, category, and status.',
              },
              {
                id: 'B',
                label: 'Blob References',
                accent: 'text-cyan-400',
                body: 'Every file receives a SHA-256 hash and a shelby:// reference. In M1B these are local mock refs; M2+ will register real Shelby blob identities on shelbynet.',
              },
              {
                id: 'C',
                label: 'Read Receipts',
                accent: 'text-emerald-400',
                body: 'Every agent query produces a structured receipt: run ID, query text, answer summary, and every blob and pack consulted — all linked and auditable.',
              },
            ].map((card) => (
              <div
                key={card.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5"
              >
                <p className={`text-xs font-mono font-bold mb-2 ${card.accent}`}>{card.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center mb-10">
            Upload → hash → reference → receipt
          </p>
          <ol className="space-y-5">
            {[
              {
                step: '01',
                title: 'Upload your data',
                body: 'Submit a dataset, agent output, document, or manifest via the Upload page. Provide a title, category, source type, tags, and description.',
              },
              {
                step: '02',
                title: 'SHA-256 computed in-browser, mock reference generated',
                body: 'The file is hashed client-side with crypto.subtle.digest. A deterministic shelby://mock/blob/{id} reference is derived from the hash and saved to localStorage. No wallet signing or network call in M1B.',
              },
              {
                step: '03',
                title: 'Agent runs consume evidence packs',
                body: 'AI agents query evidence packs at run time. The vault records which blobs were accessed, the query issued, and the answer summary in a structured receipt.',
              },
              {
                step: '04',
                title: 'Read receipts provide full auditability',
                body: 'Every agent run produces a durable read receipt linking the run ID, the evidence consumed, and the output produced — inspectable any time.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 bg-slate-800 border border-slate-700 text-slate-400 rounded flex items-center justify-center font-mono text-xs font-bold">
                  {item.step}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-slate-200 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample packs */}
      <section className="py-16 px-4 bg-[#0b0e14] border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
                Evidence vault · built-in demo data
              </p>
              <h2 className="text-lg font-bold text-slate-100">Sample evidence packs</h2>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex-shrink-0"
            >
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {demoPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>

      {/* M1B status */}
      <section className="py-10 px-4 bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0 flex items-start pt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1" />
            </div>
            <div>
              <p className="text-xs font-mono text-amber-400 mb-1">M1B status</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                This demo uses browser localStorage with deterministic{' '}
                <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 text-xs">
                  shelby://mock/blob/{'{id}'}
                </code>{' '}
                references — not real Shelby blob identities. Real on-chain registration via the
                official SDK (commitment generation → shelbynet coordination → RPC putBlob) is an
                M2 milestone.{' '}
                <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 text-xs">
                  SHELBY_MODE=testnet
                </code>{' '}
                fails closed with a clear blocked message.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer quickstart */}
      <section className="py-16 px-4 bg-[#0b0e14]" id="docs">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center mb-8">
            Developer quickstart
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="ml-2 text-xs font-mono text-slate-500">terminal</span>
            </div>
            <pre className="p-5 text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{`git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000`}</code>
            </pre>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed">
            No environment variables required for local demo mode.{' '}
            <code className="font-mono text-amber-400/80 text-xs">SHELBY_MODE=testnet</code> is
            blocked until M2 — real Shelby upload requires wallet signing, on-chain registration,
            and token funding.
          </p>
        </div>
      </section>
    </div>
  );
}
