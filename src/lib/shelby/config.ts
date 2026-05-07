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
 *   These point to Shelby's own blob storage / API layer on shelbynet.
 *   The official shelbynet RPC endpoint: https://api.shelbynet.shelby.xyz/shelby
 *
 * PLANE 2 — Shelbynet / Aptos coordination plane:
 *   APTOS_NETWORK, SHELBYNET_APTOS_FULLNODE_URL, SHELBYNET_INDEXER_URL,
 *   SHELBYNET_FAUCET_URL, SHELBYNET_ACCOUNT_ADDRESS
 *   Shelbynet is an isolated Aptos-derived network — NOT generic Aptos testnet.
 *   Official shelbynet Aptos fullnode: https://api.shelbynet.shelby.xyz/v1
 *   Official shelbynet indexer:        https://api.shelbynet.shelby.xyz/v1/graphql
 *   These are not consumed in M1 — defined here for M2+ reference.
 *   Aptos signing/transactions are NOT part of M1.
 *
 * Shelby coordination contract/account:
 *   Must be verified against current official Shelby docs and explorer
 *   at M2 implementation time. Do not hardcode earlier audit values in M1B.
 *   Explorer: https://explorer.shelby.xyz/shelbynet (verify at M2)
 */

/** Default Shelby network. Shelbynet is the official Shelby testnet network. */
export const DEFAULT_SHELBY_NETWORK = 'shelbynet' as const;

export type ShelbyMode = 'mock' | 'testnet';

export interface ShelbyConfig {
  mode: ShelbyMode;
  /** Shelby network name. Official testnet network: "shelbynet". */
  network?: string;
  /** Shelby storage/API RPC endpoint (Plane 1). Official: https://api.shelbynet.shelby.xyz/shelby */
  rpcUrl?: string;
  apiKey?: string;
  accountAddress?: string;
  /**
   * Blob upload expiration in microseconds (required for real Shelby uploads).
   * Must be provided when wiring the real SDK in M2+.
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
 * Shelbynet / Aptos coordination plane configuration (Plane 2).
 * Read-only in M1 — not consumed by any adapter yet.
 * Defined here to make the architectural boundary explicit.
 *
 * Shelbynet is an isolated Aptos-derived network, not the public Aptos testnet.
 * Do NOT use generic Aptos testnet endpoints with Shelby.
 *
 * Aptos signing and transaction submission are NOT part of M1.
 * When required in M2+, signing must be handled server-side or via a secure
 * wallet integration — never by committing private keys.
 *
 * SDK packages needed for M2+ coordination:
 *   @shelby-protocol/sdk  — Shelby Node/browser SDK
 *   @aptos-labs/ts-sdk    — Aptos TypeScript SDK for shelbynet coordination
 */
export interface ShelbynetConfig {
  /** Aptos network label. Must be "shelbynet" for Shelby operations. */
  aptosNetwork?: string;
  /** Shelbynet Aptos fullnode REST URL. Official: https://api.shelbynet.shelby.xyz/v1 */
  aptosFullnodeUrl?: string;
  /** Shelbynet indexer GraphQL URL. Official: https://api.shelbynet.shelby.xyz/v1/graphql */
  indexerUrl?: string;
  faucetUrl?: string;
  accountAddress?: string;
}

export function getShelbynetCoordinationConfig(): ShelbynetConfig {
  return {
    aptosNetwork: process.env.APTOS_NETWORK ?? DEFAULT_SHELBY_NETWORK,
    aptosFullnodeUrl: process.env.SHELBYNET_APTOS_FULLNODE_URL,
    indexerUrl: process.env.SHELBYNET_INDEXER_URL,
    faucetUrl: process.env.SHELBYNET_FAUCET_URL,
    accountAddress: process.env.SHELBYNET_ACCOUNT_ADDRESS,
  };
}

/**
 * @deprecated Use getShelbynetCoordinationConfig() instead.
 * Kept as a re-export alias for callers using the old getAptosConfig() name.
 */
export const getAptosConfig: typeof getShelbynetCoordinationConfig = getShelbynetCoordinationConfig;
