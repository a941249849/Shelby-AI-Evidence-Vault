/**
 * Shelby testnet server-side adapter — stub for server action path.
 *
 * The real M3 browser-wallet testnet upload runs entirely client-side via
 * src/lib/shelby/use-shelby-upload.ts (browser wallet + @shelby-protocol/react).
 * The server action is only used for mock mode.
 *
 * If SHELBY_MODE=testnet is set, this adapter throws immediately so that any
 * accidental server-side testnet call fails clearly rather than silently.
 *
 * Browser upload flow:
 *   1. User connects Aptos wallet in the browser.
 *   2. useShelbyUpload() hook creates a ShelbyClient (browser SDK).
 *   3. useUploadBlobs() from @shelby-protocol/react handles commitment generation,
 *      on-chain registration (wallet signs), and RPC upload.
 *   4. Result BlobRecord is stored in localStorage with real testnet metadata.
 *
 * Server signer (private key) path is intentionally NOT implemented.
 */

import { DEFAULT_SHELBY_NETWORK } from './config';
import type { ShelbyAdapter, ShelbyUploadPayload, ShelbyUploadResult } from './adapter';
import type { ShelbyConfig } from './config';

export function createTestnetAdapter(
  config: ShelbyConfig
): ShelbyAdapter {
  const network = config.network ?? DEFAULT_SHELBY_NETWORK;
  return {
    async upload(
      _data: ShelbyUploadPayload,   // eslint-disable-line @typescript-eslint/no-unused-vars
      _metadata: Record<string, string>  // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<ShelbyUploadResult> {
      throw new Error(
        'Shelby testnet upload is browser-wallet only. ' +
          'Use the useShelbyUpload() hook from src/lib/shelby/use-shelby-upload.ts ' +
          'to upload via a connected Aptos wallet. ' +
          'Set SHELBY_MODE=mock to use the local demo adapter.'
      );
    },

    getBlobRef(id: string): string {
      return `shelby://${network}/blob/${id}`;
    },

    isConnected(): boolean {
      return false;
    },

    getMode(): 'mock' | 'testnet' {
      return 'testnet';
    },
  };
}

