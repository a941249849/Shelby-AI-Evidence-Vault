/**
 * Deterministic mock Shelby adapter.
 *
 * Uses the content hash to derive a stable local reference so the same
 * file always produces the same ref in mock mode. No network calls are made.
 *
 * The `shelby://mock/blob/{id}` scheme makes it unambiguous that this is a
 * local demo reference only — NOT a real Shelby blob.
 * Real Shelby identity uses account namespace + blob name (M2+).
 */

import type { ShelbyAdapter, ShelbyUploadPayload, ShelbyUploadResult } from './adapter';

export const mockShelbyAdapter: ShelbyAdapter = {
  async upload(
    data: ShelbyUploadPayload,
    _metadata: Record<string, string>  // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ShelbyUploadResult> {
    // Derive a deterministic 32-char hex ID from the content hash.
    const hashContent = data.hash.replace(/^sha256:/, '');
    const blobId = hashContent.slice(0, 32);
    const mockRef = `shelby://mock/blob/${blobId}`;

    return {
      shelbyRef: mockRef,
      mockRef,
      network: 'mock',
      hash: data.hash,
      timestamp: new Date().toISOString(),
    };
  },

  getBlobRef(id: string): string {
    return `shelby://mock/blob/${id}`;
  },

  isConnected(): boolean {
    return false;
  },

  getMode(): 'mock' | 'testnet' {
    return 'mock';
  },
};
