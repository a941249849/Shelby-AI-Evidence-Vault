/**
 * Shared Shelby adapter interface and result types.
 * All adapters (mock, testnet) must implement ShelbyAdapter.
 */

export interface ShelbyUploadPayload {
  /** SHA-256 hash of the file content, prefixed with "sha256:" */
  hash: string;
  /** File size in bytes */
  size: number;
  /**
   * Base64-encoded file content.
   *
   * Optional in M1: the mock adapter derives a deterministic ref from `hash`
   * alone and ignores this field. A real testnet adapter (M2+) must use
   * `content` to actually upload the file bytes to the Shelby network.
   *
   * When present on the client, read the file as ArrayBuffer and convert:
   *   const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
   */
  content?: string;
  /** Original file name, used by the testnet adapter as a metadata hint. */
  fileName?: string;
  /** MIME type of the uploaded file. */
  mimeType?: string;
}

export interface ShelbyUploadResult {
  shelbyRef: string;
  /** Deterministic mock reference for local mock uploads. Same as shelbyRef in mock mode. */
  mockRef?: string;
  /** Network context: 'mock' for local demo, 'testnet' for real uploads. */
  network?: 'mock' | 'testnet';
  hash: string;
  timestamp: string;
  /** Shelby blob name (account namespace key). Populated for real testnet uploads. */
  blobName?: string;
  /** Aptos account address that owns this blob. Populated for real testnet uploads. */
  accountAddress?: string;
  /** Aptos transaction hash from on-chain commitment registration. */
  transactionHash?: string;
  /** Commitment merkle root from the Shelby commitment generation step. */
  commitmentRoot?: string;
  /** Blob expiration in microseconds as set at upload time. */
  expirationMicros?: string;
  /** Storage status from the Shelby RPC after putBlob. */
  storageStatus?: string;
  /** Explorer URL for the blob on the Shelby network explorer. */
  explorerUrl?: string;
  /** RPC retrieval URL for the blob. */
  retrievalUrl?: string;
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
