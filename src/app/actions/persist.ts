'use server';

/**
 * Server Actions for SQLite persistence of upload results.
 *
 * These actions form the bridge between the client-side upload flow and the
 * server-side SQLite evidence store.  They are intentionally thin — validation
 * and record construction happen on the client; these actions only receive
 * already-built, serialisable typed records and persist them.
 *
 * Client usage:
 *   import { persistUploadAction, getPersistedPacksAction, ... } from '@/app/actions/persist';
 */

import {
  insertPack,
  insertBlob,
  insertReceipt,
  getPacks,
  getBlobById as dbGetBlobById,
  getBlobsByPackId as dbGetBlobsByPackId,
  getReceiptById as dbGetReceiptById,
} from '@/lib/server/evidence-store';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';

// ---------------------------------------------------------------------------
// Write actions
// ---------------------------------------------------------------------------

/**
 * Persist a completed upload atomically: one EvidencePack, its BlobRecord(s),
 * and the generated ReadReceipt.  Called from the upload page after a
 * successful mock or testnet upload.
 */
export async function persistUploadAction(
  pack: EvidencePack,
  blobs: BlobRecord[],
  receipt: ReadReceipt
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    insertPack(pack);
    for (const blob of blobs) {
      insertBlob(blob);
    }
    insertReceipt(receipt);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown persistence error';
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Read actions
// ---------------------------------------------------------------------------

/**
 * Returns all user-uploaded EvidencePack records from SQLite (newest first).
 * Does NOT include built-in demo data — those are served from static arrays.
 */
export async function getPersistedPacksAction(): Promise<EvidencePack[]> {
  try {
    return getPacks();
  } catch {
    return [];
  }
}

/**
 * Looks up a BlobRecord by ID in SQLite.
 * Returns null if not found — demo data is NOT included.
 */
export async function getPersistedBlobAction(id: string): Promise<BlobRecord | null> {
  try {
    return dbGetBlobById(id) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns all blob records for a given evidence pack from SQLite.
 */
export async function getPersistedBlobsByPackAction(packId: string): Promise<BlobRecord[]> {
  try {
    return dbGetBlobsByPackId(packId);
  } catch {
    return [];
  }
}

/**
 * Looks up a ReadReceipt by ID in SQLite.
 * Returns null if not found — demo data is NOT included.
 */
export async function getPersistedReceiptAction(id: string): Promise<ReadReceipt | null> {
  try {
    return dbGetReceiptById(id) ?? null;
  } catch {
    return null;
  }
}
