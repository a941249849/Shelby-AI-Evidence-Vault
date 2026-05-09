import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { getShelbyConfig } from '@/lib/shelby/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dbHealth() {
  try {
    getDb().prepare('SELECT 1 AS ok').get();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Unknown SQLite error',
    };
  }
}

export async function GET() {
  const config = getShelbyConfig();
  const db = dbHealth();
  const testnetApiKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TESTNET_API_KEY);
  const healthy = db.ok && (config.mode !== 'testnet' || testnetApiKeyConfigured);

  return NextResponse.json(
    {
      product: 'Shelby AI Evidence Vault',
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
        sqlite: db.ok ? 'ready' : 'unavailable',
        dbPathConfigured: Boolean(process.env.SHELBY_DB_PATH),
        error: db.ok ? undefined : db.error,
      },
      boundaries: [
        'public testnet candidate',
        'browser-wallet signing only',
        'no private-key custody',
        'no mainnet claim',
      ],
    },
    { status: healthy ? 200 : 503 }
  );
}
