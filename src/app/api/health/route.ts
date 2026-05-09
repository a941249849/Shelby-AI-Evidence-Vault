import { NextResponse } from 'next/server';
import { getEvidenceStoreHealth } from '@/lib/server/evidence-store';
import { getShelbyConfig } from '@/lib/shelby/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getShelbyConfig();
  const store = await getEvidenceStoreHealth();
  const testnetApiKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TESTNET_API_KEY);
  const healthy = store.ok && (config.mode !== 'testnet' || testnetApiKeyConfigured);

  return NextResponse.json(
    {
      product: 'Shelby AI Evidence Vault',
      positioning: 'builder-demo',
      ok: healthy,
      generatedAt: new Date().toISOString(),
      runtime: {
        mode: config.mode,
        network: config.network ?? 'testnet',
        node: 'nodejs',
      },
      browserTestnet: {
        network: process.env.NEXT_PUBLIC_SHELBY_NETWORK ?? 'testnet',
        apiKeyConfigured: testnetApiKeyConfigured,
        rpcUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SHELBY_RPC_URL),
        indexerUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SHELBY_INDEXER_URL),
      },
      persistence: {
        kind: store.kind,
        ready: store.ok,
        configured: store.configured,
        error: store.ok ? undefined : store.error,
      },
      boundaries: [
        'Shelby testnet builder demo',
        'browser-wallet signing only',
        'no private-key custody',
        'no mainnet claim',
        'not a production hosted database claim',
      ],
    },
    { status: healthy ? 200 : 503 }
  );
}
