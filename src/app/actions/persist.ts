'use server';

/**
 * Server Actions for persistence of upload results.
 *
 * These actions form the bridge between the client-side upload flow and the
 * server-side evidence store. They are intentionally thin — validation
 * and record construction happen on the client; these actions only receive
 * already-built, serialisable typed records and persist them.
 *
 * Client usage:
 *   import { persistUploadAction, getPersistedPacksAction, ... } from '@/app/actions/persist';
 */

import {
  insertUploadTransaction,
  getPacks,
  getBlobs,
  getReceipts,
  getPackById as dbGetPackById,
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
 * and the generated ReadReceipt.
 * Called from the upload page after a successful mock or testnet upload.
 */
export async function persistUploadAction(
  pack: EvidencePack,
  blobs: BlobRecord[],
  receipt: ReadReceipt
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await insertUploadTransaction(pack, blobs, receipt);
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
 * Returns all user-uploaded EvidencePack records from the configured store.
 * Does NOT include built-in demo data — those are served from static arrays.
 */
export async function getPersistedPacksAction(): Promise<EvidencePack[]> {
  try {
    return await getPacks();
  } catch {
    return [];
  }
}

/**
 * Looks up a single EvidencePack by ID in the configured store.
 * Returns null if not found — demo data is NOT included.
 */
export async function getPersistedPackAction(id: string): Promise<EvidencePack | null> {
  try {
    return (await dbGetPackById(id)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Looks up a BlobRecord by ID in the configured store.
 * Returns null if not found — demo data is NOT included.
 */
export async function getPersistedBlobAction(id: string): Promise<BlobRecord | null> {
  try {
    return (await dbGetBlobById(id)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns all BlobRecord rows from the configured store.
 */
export async function getPersistedBlobsAction(): Promise<BlobRecord[]> {
  try {
    return await getBlobs();
  } catch {
    return [];
  }
}

/**
 * Returns all blob records for a given evidence pack from SQLite.
 */
export async function getPersistedBlobsByPackAction(packId: string): Promise<BlobRecord[]> {
  try {
    return await dbGetBlobsByPackId(packId);
  } catch {
    return [];
  }
}

/**
 * Looks up a ReadReceipt by ID in the configured store.
 * Returns null if not found — demo data is NOT included.
 */
export async function getPersistedReceiptAction(id: string): Promise<ReadReceipt | null> {
  try {
    return (await dbGetReceiptById(id)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns all ReadReceipt rows from the configured store.
 */
export async function getPersistedReceiptsAction(): Promise<ReadReceipt[]> {
  try {
    return await getReceipts();
  } catch {
    return [];
  }
}
