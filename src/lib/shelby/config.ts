/**
 * Reads Shelby configuration from environment variables.
 *
 * All variables are server-side only (no NEXT_PUBLIC_ prefix).
 * The app runs in mock mode when SHELBY_MODE is unset or set to "mock".
 */

export type ShelbyMode = 'mock' | 'testnet';

export interface ShelbyConfig {
  mode: ShelbyMode;
  testnetRpcUrl?: string;
  apiKey?: string;
  accountAddress?: string;
}

export function getShelbyConfig(): ShelbyConfig {
  const raw = process.env.SHELBY_MODE ?? 'mock';
  const mode: ShelbyMode = raw === 'testnet' ? 'testnet' : 'mock';

  return {
    mode,
    testnetRpcUrl: process.env.SHELBY_TESTNET_RPC_URL,
    apiKey: process.env.SHELBY_API_KEY,
    accountAddress: process.env.SHELBY_ACCOUNT_ADDRESS,
  };
}
