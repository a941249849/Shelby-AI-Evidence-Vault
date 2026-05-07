/**
 * Shelby testnet adapter — M1 placeholder.
 *
 * The official Shelby TypeScript SDK / testnet API was not available in the
 * current build environment at M1 implementation time. This adapter stub
 * fails fast with a clear, actionable error message so that:
 *
 *   1. Mock mode continues to work without any code changes.
 *   2. A future implementer can drop the real SDK calls in here without
 *      touching any other layer.
 *
 * HOW TO IMPLEMENT THE REAL ADAPTER (M2+):
 * -----------------------------------------
 * 1. Install the official Shelby SDK:
 *      npm install @shelby/sdk   (replace with actual package name)
 * 2. Import the SDK client and initialise it with config.apiKey and
 *    config.testnetRpcUrl.
 * 3. Replace the `upload` body below with the real SDK call:
 *      const result = await client.blobs.upload({ data, metadata });
 *      return { shelbyRef: result.ref, hash: result.hash, timestamp: result.createdAt };
 * 4. Update isConnected() to perform a live health-check.
 * 5. Remove this comment block once the real implementation is in place.
 *
 * NEVER commit API keys, private keys, seed phrases, or tokens.
 * Use the SHELBY_API_KEY environment variable (server-side only).
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
