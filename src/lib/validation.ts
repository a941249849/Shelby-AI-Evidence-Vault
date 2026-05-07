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
    id: `local-pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  fileName: string;
  size: number;
  mimeType: string;
  tags: string[];
  uploadMode: 'mock' | 'testnet';
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
    id: `local-blob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    shelbyRef: input.shelbyRef,
    hash: input.hash,
    source: `local://upload/${input.fileName}`,
    tags: input.tags,
    evidencePackId: input.evidencePackId,
    createdAt: new Date().toISOString(),
    size: input.size,
    mimeType: input.mimeType || 'application/octet-stream',
    dataSource: 'local',
    uploadMode: input.uploadMode,
  };
}
