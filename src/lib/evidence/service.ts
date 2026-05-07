import { evidencePacks, blobs, readReceipts } from '../demo-data';
import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

export function getEvidencePacks(): EvidencePack[] {
  return evidencePacks;
}

export function getEvidencePackById(id: string): EvidencePack | undefined {
  return evidencePacks.find((p) => p.id === id);
}

export function getBlobById(id: string): BlobRecord | undefined {
  return blobs.find((b) => b.id === id);
}

export function getBlobsByPackId(packId: string): BlobRecord[] {
  return blobs.filter((b) => b.evidencePackId === packId);
}

export function getReadReceiptById(id: string): ReadReceipt | undefined {
  return readReceipts.find((r) => r.id === id);
}

export function getReadReceipts(): ReadReceipt[] {
  return readReceipts;
}
