/**
 * Reads Shelby configuration from environment variables.
 *
 * All variables are server-side only (no NEXT_PUBLIC_ prefix).
 * The app runs in mock mode when SHELBY_MODE is unset or set to "mock".
 *
 * Architecture note — two distinct planes:
 *
 * PLANE 1 — Shelby storage / RPC plane:
 *   SHELBY_NETWORK, SHELBY_RPC_URL, SHELBY_API_KEY,
 *   SHELBY_ACCOUNT_ADDRESS, SHELBY_BLOB_EXPIRATION_MICROS
 *   These point to Shelby's own blob storage / API layer.
 *   Official testnet RPC endpoint: https://api.testnet.shelby.xyz/shelby
 *
 * PLANE 2 — Aptos coordination plane:
 *   APTOS_NETWORK, SHELBY_APTOS_FULLNODE_URL, SHELBY_INDEXER_URL,
 *   SHELBY_FAUCET_URL, SHELBY_ACCOUNT_ADDRESS
 *   Official Shelby testnet uses Aptos testnet fullnode/indexer URLs plus
 *   Shelby's own testnet RPC URL. Do not mix testnet and shelbynet endpoint
 *   families in a single runtime config.
 *   Official testnet Aptos fullnode: https://api.testnet.aptoslabs.com/v1
 *   Official testnet indexer:        https://api.testnet.aptoslabs.com/v1/graphql
 *   The browser-wallet testnet path consumes the browser-safe side of this
 *   configuration through src/lib/shelby/browser-client.ts. Server-side private
 *   key custody is intentionally not implemented.
 *
 * Shelby coordination contract/account:
 *   Must be verified against current official Shelby docs and explorer
 *   before operator testnet use. Do not hardcode earlier audit values without
 *   checking the current official docs/explorer.
 *   Explorer: https://explorer.shelby.xyz/testnet
 */

/** Default real-integration target for the browser-wallet testnet path. */
export const DEFAULT_SHELBY_NETWORK = 'testnet' as const;

export type ShelbyMode = 'mock' | 'testnet';

export interface ShelbyConfig {
  mode: ShelbyMode;
  /** Shelby network name. Official current real-integration target: "testnet". */
  network?: string;
  /** Shelby storage/API RPC endpoint (Plane 1). Official: https://api.testnet.shelby.xyz/shelby */
  rpcUrl?: string;
  apiKey?: string;
  accountAddress?: string;
  /**
   * Blob upload expiration in microseconds (required for real Shelby uploads).
   * Must be provided for real Shelby testnet uploads.
   * Not used by the mock adapter.
   */
  blobExpirationMicros?: string;
}

export function getShelbyConfig(): ShelbyConfig {
  const raw = process.env.SHELBY_MODE ?? 'mock';
  const mode: ShelbyMode = raw === 'testnet' ? 'testnet' : 'mock';

  return {
    mode,
    network: process.env.SHELBY_NETWORK ?? DEFAULT_SHELBY_NETWORK,
    rpcUrl: process.env.SHELBY_RPC_URL,
    apiKey: process.env.SHELBY_API_KEY,
    accountAddress: process.env.SHELBY_ACCOUNT_ADDRESS,
    blobExpirationMicros: process.env.SHELBY_BLOB_EXPIRATION_MICROS,
  };
}

/**
 * Aptos coordination plane configuration (Plane 2).
 * Defined here to make the architectural boundary explicit.
 *
 * Current Shelby testnet uses Aptos testnet fullnode/indexer URLs alongside
 * Shelby's own testnet RPC URL. Older shelbynet endpoints are legacy prototype
 * context and must not be mixed with testnet endpoint values.
 *
 * Aptos signing and transaction submission happen through the browser-wallet
 * path. Server-side private key custody is intentionally not implemented.
 *
 * SDK packages used for coordination:
 *   @shelby-protocol/sdk  — Shelby Node/browser SDK
 *   @aptos-labs/ts-sdk    — Aptos TypeScript SDK for testnet coordination
 */
export interface ShelbyCoordinationConfig {
  /** Aptos network label. Use "testnet" for the current Shelby testnet target. */
  aptosNetwork?: string;
  /** Aptos fullnode REST URL. Official testnet: https://api.testnet.aptoslabs.com/v1 */
  aptosFullnodeUrl?: string;
  /** Aptos indexer GraphQL URL. Official testnet: https://api.testnet.aptoslabs.com/v1/graphql */
  indexerUrl?: string;
  faucetUrl?: string;
  accountAddress?: string;
}

export function getShelbyCoordinationConfig(): ShelbyCoordinationConfig {
  return {
    aptosNetwork: process.env.APTOS_NETWORK ?? DEFAULT_SHELBY_NETWORK,
    aptosFullnodeUrl:
      process.env.SHELBY_APTOS_FULLNODE_URL ?? process.env.SHELBYNET_APTOS_FULLNODE_URL,
    indexerUrl: process.env.SHELBY_INDEXER_URL ?? process.env.SHELBYNET_INDEXER_URL,
    faucetUrl: process.env.SHELBY_FAUCET_URL ?? process.env.SHELBYNET_FAUCET_URL,
    accountAddress: process.env.SHELBY_COORDINATION_ACCOUNT_ADDRESS ?? process.env.SHELBYNET_ACCOUNT_ADDRESS,
  };
}

/**
 * @deprecated Use getShelbyCoordinationConfig() instead.
 * Kept as a compatibility alias for the earlier shelbynet-specific name.
 */
export const getShelbynetCoordinationConfig: typeof getShelbyCoordinationConfig =
  getShelbyCoordinationConfig;

/**
 * @deprecated Use getShelbyCoordinationConfig() instead.
 * Kept as a re-export alias for callers using the old getAptosConfig() name.
 */
export const getAptosConfig: typeof getShelbyCoordinationConfig = getShelbyCoordinationConfig;
