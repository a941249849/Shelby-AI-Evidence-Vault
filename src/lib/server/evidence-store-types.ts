import type { EvidencePack } from '../demo-data/evidence-packs';
import type { BlobRecord } from '../demo-data/blobs';
import type { ReadReceipt } from '../demo-data/read-receipts';

export type EvidenceStoreKind = 'sqlite' | 'postgres';

export interface EvidenceStoreHealth {
  ok: boolean;
  kind: EvidenceStoreKind;
  configured: boolean;
  error?: string;
}

export interface EvidenceStore {
  insertUploadTransaction(
    pack: EvidencePack,
    blobs: BlobRecord[],
    receipt: ReadReceipt
  ): Promise<void>;
  getPacks(): Promise<EvidencePack[]>;
  getPackById(id: string): Promise<EvidencePack | undefined>;
  getBlobs(): Promise<BlobRecord[]>;
  getBlobById(id: string): Promise<BlobRecord | undefined>;
  getBlobsByPackId(packId: string): Promise<BlobRecord[]>;
  getReceipts(): Promise<ReadReceipt[]>;
  getReceiptById(id: string): Promise<ReadReceipt | undefined>;
  health(): Promise<EvidenceStoreHealth>;
}
