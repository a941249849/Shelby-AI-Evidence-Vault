import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { EvidenceStore, EvidenceStoreHealth } from './evidence-store-types';
import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

type PayloadRow<T> = { payload: T | string };

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
}

function getSql(): NeonQueryFunction<false, false> {
  const url = databaseUrl();
  if (!url) {
    throw new Error('Postgres evidence store requires DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL.');
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

function parsePayload<T>(payload: T | string): T {
  return typeof payload === 'string' ? (JSON.parse(payload) as T) : payload;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS evidence_packs (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          payload JSONB NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS blob_records (
          id TEXT PRIMARY KEY,
          evidence_pack_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          payload JSONB NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_blob_pack
          ON blob_records (evidence_pack_id)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS read_receipts (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          payload JSONB NOT NULL
        )
      `;
    })();
  }
  await schemaReady;
}

export const postgresEvidenceStore: EvidenceStore = {
  async insertUploadTransaction(pack, blobs, receipt) {
    await ensureSchema();
    const sql = getSql();
    const queries = [
      sql`
        INSERT INTO evidence_packs (id, created_at, payload)
        VALUES (${pack.id}, ${pack.createdAt}, ${JSON.stringify(pack)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          created_at = EXCLUDED.created_at,
          payload = EXCLUDED.payload
      `,
      ...blobs.map(
        (blob) => sql`
          INSERT INTO blob_records (id, evidence_pack_id, created_at, payload)
          VALUES (${blob.id}, ${blob.evidencePackId}, ${blob.createdAt}, ${JSON.stringify(blob)}::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            evidence_pack_id = EXCLUDED.evidence_pack_id,
            created_at = EXCLUDED.created_at,
            payload = EXCLUDED.payload
        `
      ),
      sql`
        INSERT INTO read_receipts (id, created_at, payload)
        VALUES (${receipt.id}, ${receipt.timestamp}, ${JSON.stringify(receipt)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          created_at = EXCLUDED.created_at,
          payload = EXCLUDED.payload
      `,
    ];
    await sql.transaction(queries);
  },

  async getPacks() {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM evidence_packs ORDER BY created_at DESC
    `) as PayloadRow<EvidencePack>[];
    return rows.map((row) => parsePayload<EvidencePack>(row.payload));
  },

  async getPackById(id) {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM evidence_packs WHERE id = ${id} LIMIT 1
    `) as PayloadRow<EvidencePack>[];
    return rows[0] ? parsePayload<EvidencePack>(rows[0].payload) : undefined;
  },

  async getBlobs() {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM blob_records ORDER BY created_at DESC
    `) as PayloadRow<BlobRecord>[];
    return rows.map((row) => parsePayload<BlobRecord>(row.payload));
  },

  async getBlobById(id) {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM blob_records WHERE id = ${id} LIMIT 1
    `) as PayloadRow<BlobRecord>[];
    return rows[0] ? parsePayload<BlobRecord>(rows[0].payload) : undefined;
  },

  async getBlobsByPackId(packId) {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM blob_records WHERE evidence_pack_id = ${packId} ORDER BY created_at DESC
    `) as PayloadRow<BlobRecord>[];
    return rows.map((row) => parsePayload<BlobRecord>(row.payload));
  },

  async getReceipts() {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM read_receipts ORDER BY created_at DESC
    `) as PayloadRow<ReadReceipt>[];
    return rows.map((row) => parsePayload<ReadReceipt>(row.payload));
  },

  async getReceiptById(id) {
    await ensureSchema();
    const rows = (await getSql()`
      SELECT payload FROM read_receipts WHERE id = ${id} LIMIT 1
    `) as PayloadRow<ReadReceipt>[];
    return rows[0] ? parsePayload<ReadReceipt>(rows[0].payload) : undefined;
  },

  async health(): Promise<EvidenceStoreHealth> {
    try {
      const configured = Boolean(databaseUrl());
      if (!configured) {
        return {
          ok: false,
          kind: 'postgres',
          configured: false,
          error: 'DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL is required.',
        };
      }
      await ensureSchema();
      await getSql()`SELECT 1 AS ok`;
      return { ok: true, kind: 'postgres', configured: true };
    } catch (err) {
      return {
        ok: false,
        kind: 'postgres',
        configured: Boolean(databaseUrl()),
        error: err instanceof Error ? err.message : 'Unknown Postgres error',
      };
    }
  },
};
