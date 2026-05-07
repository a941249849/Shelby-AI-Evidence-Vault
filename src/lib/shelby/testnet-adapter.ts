/**
 * Shelby testnet adapter — M1 placeholder.
 *
 * The official Shelby SDK / testnet API specifics are not yet confirmed.
 * This adapter stub fails fast with a clear, actionable error message so that:
 *
 *   1. Mock mode continues to work without any code changes.
 *   2. A future implementer can drop the real SDK calls in here without
 *      touching any other layer.
 *
 * HOW TO IMPLEMENT THE REAL ADAPTER (M2+):
 * -----------------------------------------
 * Wait for the official Shelby documentation to confirm:
 *   a) The correct SDK package name and import path
 *   b) The Shelby storage/RPC endpoint format (SHELBY_RPC_URL)
 *   c) Whether Aptos on-chain coordination is needed and which Aptos APIs apply
 *      (APTOS_FULLNODE_URL, APTOS_INDEXER_URL — see config.ts Plane 2)
 *
 * When the SDK is confirmed:
 * 1. Install the official SDK using the package name from the Shelby docs.
 * 2. Initialise the SDK client using config.apiKey and config.rpcUrl
 *    (Plane 1 — Shelby storage/RPC, not Aptos fullnode URL).
 * 3. Replace the `upload` body below with the real SDK call.
 *    The `data` payload already carries all required fields:
 *      data.hash     — "sha256:<hex>" content fingerprint
 *      data.size     — file size in bytes
 *      data.content  — base64-encoded file bytes
 *      data.fileName — original file name
 *      data.mimeType — MIME type
 * 4. Update isConnected() to perform a live health-check.
 * 5. Remove this comment block once the real implementation is in place.
 *
 * NEVER commit API keys, private keys, seed phrases, or tokens.
 * Use SHELBY_API_KEY (server-side only). Aptos signing is NOT part of M1.
 */

import type { ShelbyAdapter, ShelbyUploadPayload, ShelbyUploadResult } from './adapter';
import type { ShelbyConfig } from './config';

export function createTestnetAdapter(
  _config: ShelbyConfig  // eslint-disable-line @typescript-eslint/no-unused-vars
): ShelbyAdapter {
  return {
    async upload(
      _data: ShelbyUploadPayload,   // eslint-disable-line @typescript-eslint/no-unused-vars
      _metadata: Record<string, string>  // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<ShelbyUploadResult> {
      throw new Error(
        'Shelby testnet adapter is not yet implemented. ' +
          'Set SHELBY_MODE=mock to use the deterministic mock adapter, ' +
          'or implement the real SDK calls in src/lib/shelby/testnet-adapter.ts. ' +
          'See the file header for implementation notes.'
      );
    },

    getBlobRef(id: string): string {
      return `shelby://testnet/blob/${id}`;
    },

    isConnected(): boolean {
      return false;
    },

    getMode(): 'mock' | 'testnet' {
      return 'testnet';
    },
  };
}
