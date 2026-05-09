import type { EvidenceStore, EvidenceStoreHealth, EvidenceStoreKind } from './evidence-store-types';
import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

export function getEvidenceStoreKind(): EvidenceStoreKind {
  const explicit = process.env.EVIDENCE_STORE;
  if (explicit === 'postgres' || explicit === 'sqlite') return explicit;
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL) {
    return 'postgres';
  }
  return 'sqlite';
}

async function getStore(): Promise<EvidenceStore> {
  if (getEvidenceStoreKind() === 'postgres') {
    const { postgresEvidenceStore } = await import('./evidence-store-postgres');
    return postgresEvidenceStore;
  }

  const { sqliteEvidenceStore } = await import('./evidence-store-sqlite');
  return sqliteEvidenceStore;
}

export async function insertUploadTransaction(
  pack: EvidencePack,
  blobs: BlobRecord[],
  receipt: ReadReceipt
): Promise<void> {
  return (await getStore()).insertUploadTransaction(pack, blobs, receipt);
}

export async function getPacks(): Promise<EvidencePack[]> {
  return (await getStore()).getPacks();
}

export async function getPackById(id: string): Promise<EvidencePack | undefined> {
  return (await getStore()).getPackById(id);
}

export async function getBlobs(): Promise<BlobRecord[]> {
  return (await getStore()).getBlobs();
}

export async function getBlobById(id: string): Promise<BlobRecord | undefined> {
  return (await getStore()).getBlobById(id);
}

export async function getBlobsByPackId(packId: string): Promise<BlobRecord[]> {
  return (await getStore()).getBlobsByPackId(packId);
}

export async function getReceipts(): Promise<ReadReceipt[]> {
  return (await getStore()).getReceipts();
}

export async function getReceiptById(id: string): Promise<ReadReceipt | undefined> {
  return (await getStore()).getReceiptById(id);
}

export async function getEvidenceStoreHealth(): Promise<EvidenceStoreHealth> {
  return (await getStore()).health();
}
