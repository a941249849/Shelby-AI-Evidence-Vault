/**
 * Shared Shelby adapter interface and result types.
 * All adapters (mock, testnet) must implement ShelbyAdapter.
 */

export interface ShelbyUploadPayload {
  /** SHA-256 hash of the file content, prefixed with "sha256:" */
  hash: string;
  /** File size in bytes */
  size: number;
}

export interface ShelbyUploadResult {
  shelbyRef: string;
  hash: string;
  timestamp: string;
}

export interface ShelbyAdapter {
  upload(
    data: ShelbyUploadPayload,
    metadata: Record<string, string>
  ): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
  /** Returns the current operating mode for display purposes. */
  getMode(): 'mock' | 'testnet';
}
