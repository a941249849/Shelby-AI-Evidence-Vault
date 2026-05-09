import { getDb } from './db';
import type { EvidenceStore, EvidenceStoreHealth } from './evidence-store-types';
import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

export const sqliteEvidenceStore: EvidenceStore = {
  async insertUploadTransaction(pack, blobs, receipt) {
    const db = getDb();
    db.transaction(() => {
      db.prepare(
        `INSERT OR REPLACE INTO evidence_packs (id, created_at, payload) VALUES (?, ?, ?)`
      ).run(pack.id, pack.createdAt, JSON.stringify(pack));

      for (const blob of blobs) {
        db.prepare(
          `INSERT OR REPLACE INTO blob_records (id, evidence_pack_id, created_at, payload) VALUES (?, ?, ?, ?)`
        ).run(blob.id, blob.evidencePackId, blob.createdAt, JSON.stringify(blob));
      }

      db.prepare(
        `INSERT OR REPLACE INTO read_receipts (id, created_at, payload) VALUES (?, ?, ?)`
      ).run(receipt.id, receipt.timestamp, JSON.stringify(receipt));
    })();
  },

  async getPacks() {
    const rows = getDb()
      .prepare(`SELECT payload FROM evidence_packs ORDER BY created_at DESC`)
      .all() as { payload: string }[];
    return rows.map((r) => JSON.parse(r.payload) as EvidencePack);
  },

  async getPackById(id) {
    const row = getDb()
      .prepare(`SELECT payload FROM evidence_packs WHERE id = ?`)
      .get(id) as { payload: string } | undefined;
    return row ? (JSON.parse(row.payload) as EvidencePack) : undefined;
  },

  async getBlobs() {
    const rows = getDb()
      .prepare(`SELECT payload FROM blob_records ORDER BY created_at DESC`)
      .all() as { payload: string }[];
    return rows.map((r) => JSON.parse(r.payload) as BlobRecord);
  },

  async getBlobById(id) {
    const row = getDb()
      .prepare(`SELECT payload FROM blob_records WHERE id = ?`)
      .get(id) as { payload: string } | undefined;
    return row ? (JSON.parse(row.payload) as BlobRecord) : undefined;
  },

  async getBlobsByPackId(packId) {
    const rows = getDb()
      .prepare(`SELECT payload FROM blob_records WHERE evidence_pack_id = ? ORDER BY created_at DESC`)
      .all(packId) as { payload: string }[];
    return rows.map((r) => JSON.parse(r.payload) as BlobRecord);
  },

  async getReceipts() {
    const rows = getDb()
      .prepare(`SELECT payload FROM read_receipts ORDER BY created_at DESC`)
      .all() as { payload: string }[];
    return rows.map((r) => JSON.parse(r.payload) as ReadReceipt);
  },

  async getReceiptById(id) {
    const row = getDb()
      .prepare(`SELECT payload FROM read_receipts WHERE id = ?`)
      .get(id) as { payload: string } | undefined;
    return row ? (JSON.parse(row.payload) as ReadReceipt) : undefined;
  },

  async health(): Promise<EvidenceStoreHealth> {
    try {
      getDb().prepare('SELECT 1 AS ok').get();
      return { ok: true, kind: 'sqlite', configured: true };
    } catch (err) {
      return {
        ok: false,
        kind: 'sqlite',
        configured: true,
        error: err instanceof Error ? err.message : 'Unknown SQLite error',
      };
    }
  },
};
