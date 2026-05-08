/**
 * Browser-side localStorage persistence for user-uploaded evidence packs
 * and blob records.
 *
 * Demo data is NOT stored here — it remains in src/lib/demo-data/ and is
 * always present. This store only holds records created through the upload
 * page during the current browser session (survives page refresh).
 *
 * Data is serialised as JSON under two keys:
 *   shelby_vault_packs  — EvidencePack[]
 *   shelby_vault_blobs  — BlobRecord[]
 */

import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';

const PACKS_KEY = 'shelby_vault_packs';
const BLOBS_KEY = 'shelby_vault_blobs';

function safeRead<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function safeWrite<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private-mode restriction — fail silently.
  }
}

// ---------------------------------------------------------------------------
// Evidence packs
// ---------------------------------------------------------------------------

export function getLocalPacks(): EvidencePack[] {
  return safeRead<EvidencePack>(PACKS_KEY);
}

export function addLocalPack(pack: EvidencePack): void {
  const packs = getLocalPacks();
  packs.unshift(pack); // newest first
  safeWrite(PACKS_KEY, packs);
}

export function getLocalPackById(id: string): EvidencePack | undefined {
  return getLocalPacks().find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Blobs
// ---------------------------------------------------------------------------

export function getLocalBlobs(): BlobRecord[] {
  return safeRead<BlobRecord>(BLOBS_KEY);
}

export function addLocalBlob(blob: BlobRecord): void {
  const blobs = getLocalBlobs();
  blobs.unshift(blob);
  safeWrite(BLOBS_KEY, blobs);
}

export function getLocalBlobById(id: string): BlobRecord | undefined {
  return getLocalBlobs().find((b) => b.id === id);
}

export function getLocalBlobsByPackId(packId: string): BlobRecord[] {
  return getLocalBlobs().filter((b) => b.evidencePackId === packId);
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

export function resetLocalData(): void {
  try {
    localStorage.removeItem(PACKS_KEY);
    localStorage.removeItem(BLOBS_KEY);
  } catch {
    // ignore
  }
}
