/**
 * Reads Shelby configuration from environment variables.
 *
 * All variables are server-side only (no NEXT_PUBLIC_ prefix).
 * The app runs in mock mode when SHELBY_MODE is unset or set to "mock".
 *
 * Architecture note — two distinct planes:
 *
 * PLANE 1 — Shelby storage / RPC plane:
 *   SHELBY_RPC_URL, SHELBY_API_KEY, SHELBY_ACCOUNT_ADDRESS
 *   These point to Shelby's own blob storage / API layer.
 *
 * PLANE 2 — Aptos testnet coordination plane:
 *   APTOS_NETWORK, APTOS_FULLNODE_URL, APTOS_INDEXER_URL,
 *   APTOS_FAUCET_URL, APTOS_ACCOUNT_ADDRESS
 *   These point to the Aptos blockchain nodes used for on-chain coordination.
 *   Not consumed in M1 — defined here for M2+ reference and kept separate
 *   from the Shelby storage config intentionally.
 *   Aptos signing/transactions are NOT part of M1.
 */

export type ShelbyMode = 'mock' | 'testnet';

export interface ShelbyConfig {
  mode: ShelbyMode;
  /** Shelby storage/API RPC endpoint (Plane 1). */
  rpcUrl?: string;
  apiKey?: string;
  accountAddress?: string;
}

export function getShelbyConfig(): ShelbyConfig {
  const raw = process.env.SHELBY_MODE ?? 'mock';
  const mode: ShelbyMode = raw === 'testnet' ? 'testnet' : 'mock';

  return {
    mode,
    rpcUrl: process.env.SHELBY_RPC_URL,
    apiKey: process.env.SHELBY_API_KEY,
    accountAddress: process.env.SHELBY_ACCOUNT_ADDRESS,
  };
}

/**
 * Aptos coordination plane configuration (Plane 2).
 * Read-only in M1 — not consumed by any adapter yet.
 * Defined here to make the architectural boundary explicit.
 * Aptos signing and transaction submission are NOT part of M1.
 */
export interface AptosCoordinationConfig {
  network?: string;
  fullnodeUrl?: string;
  indexerUrl?: string;
  faucetUrl?: string;
  accountAddress?: string;
}

export function getAptosConfig(): AptosCoordinationConfig {
  return {
    network: process.env.APTOS_NETWORK,
    fullnodeUrl: process.env.APTOS_FULLNODE_URL,
    indexerUrl: process.env.APTOS_INDEXER_URL,
    faucetUrl: process.env.APTOS_FAUCET_URL,
    accountAddress: process.env.APTOS_ACCOUNT_ADDRESS,
  };
}
