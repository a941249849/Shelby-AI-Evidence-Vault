/**
 * Validation and construction utilities for EvidencePack and BlobRecord.
 * Used by the upload flow and can be imported in tests.
 */

import type { EvidencePack } from './demo-data/evidence-packs';
import type { BlobRecord } from './demo-data/blobs';

// ---------------------------------------------------------------------------
// Tag utilities
// ---------------------------------------------------------------------------

/**
 * Parses a comma-separated tag string into a trimmed, de-duplicated array.
 * Empty entries are removed.
 *
 * @example parseTags("nlp, training-data , 2024") → ["nlp", "training-data", "2024"]
 */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
}

// ---------------------------------------------------------------------------
// SHA-256 validation
// ---------------------------------------------------------------------------

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;

/**
 * Returns true if the string is a valid SHA-256 hex digest prefixed with "sha256:".
 *
 * @example isValidSHA256("sha256:" + "a".repeat(64)) → true
 */
export function isValidSHA256(hash: string): boolean {
  return SHA256_RE.test(hash);
}

// ---------------------------------------------------------------------------
// Record builders
// ---------------------------------------------------------------------------

export interface BuildPackInput {
  title: string;
  category: EvidencePack['category'];
  sourceType: EvidencePack['sourceType'];
  tags: string[];
  description: string;
  blobCount: number;
}

/**
 * Constructs a new local EvidencePack record with a generated ID.
 * Validates required fields and throws a descriptive error on failure.
 */
export function buildEvidencePack(input: BuildPackInput): EvidencePack {
  const title = input.title.trim();
  if (!title) throw new Error('Pack title is required.');

  return {
    id: `local-pack-${crypto.randomUUID()}`,
    title,
    category: input.category,
    sourceType: input.sourceType,
    tags: input.tags,
    description: input.description.trim(),
    blobCount: input.blobCount,
    status: 'active',
    createdAt: new Date().toISOString(),
    dataSource: 'local',
  };
}

export interface BuildBlobInput {
  evidencePackId: string;
  hash: string;
  shelbyRef: string;
  mockRef?: string;
  fileName: string;
  size: number;
  mimeType: string;
  tags: string[];
  uploadMode: 'mock' | 'testnet';
  /** Network context: populated for local uploads. */
  network?: 'mock' | 'testnet';
  /** Shelby account address (real testnet uploads). */
  accountAddress?: string;
  /** Shelby blob name key (real testnet uploads). */
  blobName?: string;
  /** Aptos transaction hash (real testnet uploads, if available). */
  transactionHash?: string;
  /** Commitment merkle root (real testnet uploads, if available). */
  commitmentRoot?: string;
  /** Blob expiration in microseconds (real testnet uploads). */
  expirationMicros?: string;
  /** Storage status from Shelby RPC (real testnet uploads). */
  storageStatus?: string;
  /** Explorer URL for the blob (real testnet uploads). */
  explorerUrl?: string;
  /** RPC retrieval URL for the blob (real testnet uploads). */
  retrievalUrl?: string;
  /** Data source label: 'local' for mock, 'shelby-testnet' for real uploads. */
  dataSource?: 'local' | 'shelby-testnet';
}

/**
 * Constructs a new local BlobRecord.
 * Validates the SHA-256 hash and throws on invalid input.
 */
export function buildBlobRecord(input: BuildBlobInput): BlobRecord {
  if (!isValidSHA256(input.hash)) {
    throw new Error(`Invalid SHA-256 hash: ${input.hash}`);
  }

  return {
    id: `local-blob-${crypto.randomUUID()}`,
    shelbyRef: input.shelbyRef,
    mockRef: input.mockRef ?? (input.uploadMode === 'mock' ? input.shelbyRef : undefined),
    hash: input.hash,
    source: `local://upload/${input.fileName}`,
    tags: input.tags,
    evidencePackId: input.evidencePackId,
    createdAt: new Date().toISOString(),
    size: input.size,
    mimeType: input.mimeType || 'application/octet-stream',
    dataSource: input.dataSource ?? 'local',
    uploadMode: input.uploadMode,
    blobName: input.blobName ?? input.fileName,
    network: input.network ?? (input.uploadMode === 'mock' ? 'mock' : undefined),
    accountAddress: input.accountAddress,
    transactionHash: input.transactionHash,
    commitmentRoot: input.commitmentRoot,
    expirationMicros: input.expirationMicros,
    storageStatus: input.storageStatus,
    explorerUrl: input.explorerUrl,
    retrievalUrl: input.retrievalUrl,
  };
}
