import Link from 'next/link';
import {
  ArrowLeft,
  Braces,
  CalendarClock,
  Cpu,
  Database,
  Fingerprint,
  MessageSquareText,
  ReceiptText,
} from 'lucide-react';
import { getReadReceiptById, getEvidencePackById } from '@/lib/evidence/service';
import { formatDateTime } from '@/lib/utils';

interface ReadReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadReceiptPage({ params }: ReadReceiptPageProps) {
  const { id } = await params;
  const receipt = getReadReceiptById(id);

  if (!receipt) {
    return (
      <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#4f192a]">
            Read receipt not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">
            No read receipt with ID{' '}
            <code className="rounded bg-[#fcfaf8] px-1 font-mono">{id}</code> exists in demo data.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 shelby-cut bg-[#4f192a] px-4 py-2.5 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#322312]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to index
          </Link>
        </div>
      </div>
    );
  }

  const packs = receipt.evidencePackIds
    .map((pid) => getEvidencePackById(pid))
    .filter(Boolean);

  return (
    <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-1 rounded-full border border-[#161008]/15 bg-[#fcfaf8] px-3 py-1 text-xs font-semibold text-[#6f6258] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#de8aff]/25 bg-[#eee2ff] px-3 py-1 text-xs font-semibold text-[#470b64]">
                <ReceiptText className="h-3.5 w-3.5" />
                AI read receipt
              </span>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#4f192a]">
                Answer provenance and evidence usage.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
                A compact receipt for one agent response: prompt, answer summary, run metadata,
                referenced blobs, and evidence packs.
              </p>
            </div>
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                Receipt ID
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#161008]">
                {receipt.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                    Query
                  </p>
                  <h2 className="text-lg font-semibold text-[#4f192a]">User question</h2>
                </div>
              </div>
              <p className="text-base leading-7 text-[#161008]">{receipt.query}</p>
            </div>

            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#4f192a] text-[#ff77c9]">
                  <Braces className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                    Answer summary
                  </p>
                  <h2 className="text-lg font-semibold text-[#4f192a]">Generated response</h2>
                </div>
              </div>
              <p className="text-sm leading-7 text-[#161008]">{receipt.answerSummary}</p>
            </div>

            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                <Fingerprint className="h-4 w-4 text-[#de8aff]" />
                Referenced blobs
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {receipt.referencedBlobIds.map((blobId) => (
                  <Link
                    key={blobId}
                    href={`/blob/${blobId}`}
                    className="group shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-3 py-3 transition hover:border-[#de8aff]/40 hover:bg-[#fcfaf8]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
                      Blob
                    </p>
                    <p className="mt-1 truncate font-mono text-xs font-semibold text-[#161008] group-hover:text-[#de8aff]">
                      {blobId}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={Cpu} label="Run ID">
              <code className="font-mono text-xs">{receipt.runId}</code>
            </Fact>
            <Fact icon={CalendarClock} label="Timestamp">
              {formatDateTime(receipt.timestamp)}
            </Fact>
            <Fact icon={Braces} label="Agent version">
              <code className="font-mono text-xs">{receipt.agentVersion}</code>
            </Fact>
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
                <Database className="h-3.5 w-3.5 text-[#de8aff]" />
                Evidence packs
              </div>
              <div className="space-y-2">
                {packs.map(
                  (pack) =>
                    pack && (
                      <Link
                        key={pack.id}
                        href={`/dashboard?pack=${pack.id}`}
                        className="block rounded-md border border-[#161008]/15 bg-[#fcfaf8] px-3 py-2 text-sm font-semibold text-[#161008] transition hover:border-[#de8aff]/40 hover:bg-[#fcfaf8] hover:text-[#de8aff]"
                      >
                        {pack.title}
                      </Link>
                    )
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
        <Icon className="h-3.5 w-3.5 text-[#de8aff]" />
        {label}
      </div>
      <div className="break-all text-sm leading-6 text-[#161008]">{children}</div>
    </div>
  );
}
