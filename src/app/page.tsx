import Link from 'next/link';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';

export default function HomePage() {
  const demoPacks = evidencePacks.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-mono px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            M1B Demo — Local mock upload · Real Shelby blocked until M2
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            AI agents need{' '}
            <span className="text-indigo-400">verifiable data memory.</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Shelby AI Evidence Vault stores the datasets, agent outputs, and read receipts that
            power your AI pipelines — with cryptographic hash verification and locally persisted
            mock Shelby references. Every blob, every query, every answer is auditable. Real
            Shelby testnet registration is deferred to M2.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto text-center"
            >
              Launch Demo →
            </Link>
            <a
              href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-3 rounded-lg border border-slate-700 transition-colors w-full sm:w-auto text-center"
            >
              View GitHub
            </a>
            <a
              href="#docs"
              className="text-slate-300 hover:text-white font-medium px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors w-full sm:w-auto text-center"
            >
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              The problem with AI data today
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              AI systems consume enormous amounts of data — but tracing what was used, when, and
              why is nearly impossible.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'No Data Provenance',
                icon: '🔍',
                body: 'AI models are trained and run on datasets with no chain of custody. When outputs are wrong, there is no trail to follow back to the source.',
              },
              {
                title: 'Unverifiable Sources',
                icon: '⚠️',
                body: 'Web scrapes, API exports, and agent outputs are stored as raw files. There is no cryptographic proof of when a blob was created or whether it was tampered with.',
              },
              {
                title: 'Lost Context',
                icon: '📭',
                body: 'Agent runs reference datasets at query time, but the link between a question, the evidence consumed, and the answer is never recorded in a structured, durable format.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-slate-50 border border-slate-200 rounded-lg p-6"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution section */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">How Shelby Evidence Vault solves it</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A structured, open layer for storing AI evidence with Shelby blob references,
              metadata, and read receipts.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Evidence Packs',
                icon: '📦',
                body: 'Group related blobs into evidence packs — datasets, agent runs, documents, or manifests. Each pack carries metadata, tags, and a status.',
              },
              {
                title: 'Shelby Blob References',
                icon: '🔗',
                body: 'Every stored file gets a SHA-256 hash and a mock shelby:// reference in M1B. In M2+, references will be real Shelby blob identities registered on shelbynet via the official SDK.',
              },
              {
                title: 'Read Receipts',
                icon: '🧾',
                body: 'When an agent queries evidence, a read receipt is created: run ID, query, answer summary, and every blob and pack consulted — all in one auditable record.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">Four steps from raw data to verified evidence.</p>
          </div>
          <ol className="space-y-6">
            {[
              {
                step: '01',
                title: 'Upload your data',
                body: 'Upload a dataset, agent output, document, or manifest via the Upload page. Tag it, categorize it, and describe its source.',
              },
              {
                step: '02',
                title: 'A mock Shelby reference is generated locally',
                body: 'The file is SHA-256 hashed in-browser and given a deterministic mock shelby://mock/blob/{id} reference. The pack and blobs are saved to browser localStorage. No wallet signing or network call in M1B.',
              },
              {
                step: '03',
                title: 'Agent runs consume evidence packs',
                body: 'AI agents query evidence packs at run time. The vault records which blobs were accessed, the query issued, and the answer summary.',
              },
              {
                step: '04',
                title: 'Read receipts provide full auditability',
                body: 'Every agent run produces a read receipt — a durable, structured record linking the run, the evidence consumed, and the output produced.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-mono text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Demo Objects */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Sample evidence packs</h2>
            <p className="text-slate-500">
              Explore the demo data. These are M0 mock objects — representative of real AI
              pipelines.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {demoPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
            >
              View all evidence packs →
            </Link>
          </div>
        </div>
      </section>

      {/* Built with Shelby */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Built toward Shelby — M1B status</h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto">
            Shelby is a content-addressable blob storage network designed for AI ecosystem
            tooling. In M1B this demo uses local browser storage and generates deterministic{' '}
            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700 text-xs">
              shelby://mock/blob/{'{id}'}
            </code>{' '}
            references — not real Shelby blob identities. Real on-chain registration via the
            official SDK (commitment generation → shelbynet coordination → RPC putBlob) is an M2
            milestone.
          </p>
        </div>
      </section>

      {/* Developer Quickstart */}
      <section className="py-20 px-4 bg-slate-900 text-white" id="docs">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">Developer quickstart</h2>
            <p className="text-slate-400">Run the demo locally in under a minute.</p>
          </div>
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-5 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <code>{`git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000`}</code>
          </pre>
          <p className="text-slate-400 text-sm mt-4 text-center">
            No environment variables required for local demo mode.{' '}
            <code className="font-mono text-emerald-300 text-xs">SHELBY_MODE=testnet</code> is
            blocked until M2 — real Shelby upload requires wallet signing, on-chain registration,
            and token funding.
          </p>
        </div>
      </section>
    </div>
  );
}
