/**
 * Deterministic mock Shelby adapter.
 *
 * Uses the content hash to derive a stable shelby:// reference so the same
 * file always produces the same ref in mock mode. No network calls are made.
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

    return {
      shelbyRef: `shelby://testnet/blob/${blobId}`,
      hash: data.hash,
      timestamp: new Date().toISOString(),
    };
  },

  getBlobRef(id: string): string {
    return `shelby://testnet/blob/${id}`;
  },

  isConnected(): boolean {
    return false;
  },

  getMode(): 'mock' | 'testnet' {
    return 'mock';
  },
};
