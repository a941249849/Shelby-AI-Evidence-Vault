/**
 * Shelby testnet adapter — M1 placeholder.
 *
 * This adapter stub fails fast with a clear error message so that:
 *   1. Mock mode continues to work without any code changes.
 *   2. A future implementer can drop the real SDK calls in here without
 *      touching any other layer (server action, UI, validation).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SHELBYNET NETWORK CONTEXT (M2+ reference)
 * ─────────────────────────────────────────────────────────────────────────────
 * Shelby runs on "shelbynet" — an isolated Aptos-derived network.
 * Do NOT use generic Aptos testnet URLs; they are incompatible with Shelby.
 *
 *   Shelby RPC endpoint:   https://api.shelbynet.shelby.xyz/shelby
 *   Aptos fullnode:        https://api.shelbynet.shelby.xyz/v1
 *   Indexer (GraphQL):     https://api.shelbynet.shelby.xyz/v1/graphql
 *   Explorer:              https://explorer.shelby.xyz/shelbynet
 *   Coordination contract: 0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REAL UPLOAD FLOW (M2+ implementation guide)
 * ─────────────────────────────────────────────────────────────────────────────
 * Shelby blob upload is a multi-step coordinated flow, not a single HTTP call.
 * Based on official Shelby Node SDK docs:
 *
 * OPTION A — Node SDK (high-level):
 *   import { ShelbyNodeClient } from '@shelby-protocol/sdk';
 *   import { Account } from '@aptos-labs/ts-sdk';
 *   // ShelbyNodeClient handles commitment generation, on-chain registration,
 *   // and the RPC putBlob call internally.
 *   const client = new ShelbyNodeClient({ rpcUrl: config.rpcUrl, ... });
 *   await client.upload({
 *     signer: account,          // Aptos Account — must be handled securely (M2+ design decision)
 *     blobData: blobBytes,      // Uint8Array — decoded from data.content (base64)
 *     blobName: data.fileName,  // original file name
 *     expirationMicros: BigInt(config.blobExpirationMicros ?? '0'),
 *   });
 *
 * OPTION B — Manual Node flow (low-level):
 *   1. Generate blob commitments from blobData.
 *   2. Register the blob via the coordination layer (on-chain Aptos tx on shelbynet).
 *      This uses @aptos-labs/ts-sdk with APTOS_NETWORK=shelbynet and the
 *      shelbynet fullnode URL. Requires APT on shelbynet for gas.
 *   3. Wait for the Aptos transaction to be confirmed.
 *   4. Call rpc.putBlob({ account, blobName, blobData }).
 *      This uses SHELBY_RPC_URL. Requires ShelbyUSD or SHEL tokens for storage.
 *      The RPC validates the registered commitment status before accepting.
 *
 * DATA ALREADY IN THE PAYLOAD (maps to SDK parameters):
 *   data.content  → blobData  (decode: Buffer.from(data.content, 'base64'))
 *   data.fileName → blobName
 *   data.hash     → content fingerprint (sha256:<hex>)
 *   data.size     → file size in bytes
 *   data.mimeType → MIME type
 *   config.blobExpirationMicros → expirationMicros (required; set SHELBY_BLOB_EXPIRATION_MICROS)
 *
 * FUNDING PREREQUISITES (M2+ setup):
 *   - APT on shelbynet: required for on-chain registration gas fees.
 *   - ShelbyUSD or SHEL tokens: required for Shelby storage operations.
 *   - Use the shelbynet faucet (SHELBYNET_FAUCET_URL) for test account funding.
 *
 * SIGNING SECURITY (M2+ design decision — NOT part of M1):
 *   Real upload requires an Aptos account signer on shelbynet. This must be
 *   handled server-side (e.g. via a funded server account whose private key is
 *   an env secret) or via a secure wallet integration. NEVER commit private
 *   keys, seed phrases, or mnemonic phrases to source code or env examples.
 *
 * SDK packages to install when implementing M2+:
 *   npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
 *   (Browser-specific: @shelby-protocol/react is available for browser flows.)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Remove this comment block once the real implementation is in place.
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
        'Shelby testnet adapter is not yet implemented. ' +
          'Set SHELBY_MODE=mock to use the deterministic mock adapter, ' +
          'or implement the real SDK calls in src/lib/shelby/testnet-adapter.ts. ' +
          'See the file header for the shelbynet upload flow and M2+ implementation guide.'
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
