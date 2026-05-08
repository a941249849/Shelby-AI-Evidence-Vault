/**
 * Server-only evidence store — CRUD helpers that read and write to SQLite.
 *
 * This module is the single place where all database access lives for the
 * three core record types: EvidencePack, BlobRecord, and ReadReceipt.
 *
 * Import pattern (server-side only):
 *   import { insertPack, getPacks, ... } from '@/lib/server/evidence-store';
 */

import { getDb } from './db';
import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

// ---------------------------------------------------------------------------
// Evidence packs
// ---------------------------------------------------------------------------

export function insertPack(pack: EvidencePack): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO evidence_packs (id, created_at, payload)
     VALUES (?, ?, ?)`
  ).run(pack.id, pack.createdAt, JSON.stringify(pack));
}

export function getPacks(): EvidencePack[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT payload FROM evidence_packs ORDER BY created_at DESC`)
    .all() as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as EvidencePack);
}

export function getPackById(id: string): EvidencePack | undefined {
  const db = getDb();
  const row = db
    .prepare(`SELECT payload FROM evidence_packs WHERE id = ?`)
    .get(id) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as EvidencePack) : undefined;
}

// ---------------------------------------------------------------------------
// Blob records
// ---------------------------------------------------------------------------

export function insertBlob(blob: BlobRecord): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO blob_records (id, evidence_pack_id, created_at, payload)
     VALUES (?, ?, ?, ?)`
  ).run(blob.id, blob.evidencePackId, blob.createdAt, JSON.stringify(blob));
}

export function getBlobById(id: string): BlobRecord | undefined {
  const db = getDb();
  const row = db
    .prepare(`SELECT payload FROM blob_records WHERE id = ?`)
    .get(id) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as BlobRecord) : undefined;
}

export function getBlobsByPackId(packId: string): BlobRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT payload FROM blob_records WHERE evidence_pack_id = ? ORDER BY created_at DESC`
    )
    .all(packId) as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as BlobRecord);
}

// ---------------------------------------------------------------------------
// Read receipts
// ---------------------------------------------------------------------------

export function insertReceipt(receipt: ReadReceipt): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO read_receipts (id, created_at, payload)
     VALUES (?, ?, ?)`
  ).run(receipt.id, receipt.timestamp, JSON.stringify(receipt));
}

export function getReceiptById(id: string): ReadReceipt | undefined {
  const db = getDb();
  const row = db
    .prepare(`SELECT payload FROM read_receipts WHERE id = ?`)
    .get(id) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as ReadReceipt) : undefined;
}

export function getReceipts(): ReadReceipt[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT payload FROM read_receipts ORDER BY created_at DESC`)
    .all() as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as ReadReceipt);
}
