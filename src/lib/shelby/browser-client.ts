/**
 * Browser-side Shelby client configuration and factory.
 *
 * Reads only NEXT_PUBLIC_ environment variables — safe to use in client components.
 * Server-only variables (SHELBY_API_KEY, SHELBY_MODE, etc.) must never be accessed here.
 *
 * Testnet mode requires wallet signing. No private keys or server secrets are used.
 * If the frontend client API key is missing, `isReady` is false and upload
 * fails closed with a clear error message.
 *
 * Public env vars consumed (safe — no secrets):
 *   NEXT_PUBLIC_SHELBY_NETWORK           testnet | shelbynet (default: testnet)
 *   NEXT_PUBLIC_SHELBY_RPC_URL           optional override for Shelby RPC base URL
 *   NEXT_PUBLIC_SHELBY_INDEXER_URL       optional override for Shelby indexer URL
 *   NEXT_PUBLIC_TESTNET_API_KEY          Shelby/Geomi client API key for browser DApp use
 *   NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS  blob lifetime in hours (default: 24)
 */

import { Network } from '@aptos-labs/ts-sdk';
import { ShelbyClient } from '@shelby-protocol/sdk/browser';
import type { ShelbyNetwork } from '@shelby-protocol/sdk/browser';

export interface BrowserShelbyConfig {
  /** Whether all required configuration is present and valid. */
  isReady: boolean;
  /** The resolved Shelby network (e.g. Network.TESTNET). */
  network: ShelbyNetwork;
  /** Optional RPC URL override. Falls back to SDK default for the network. */
  rpcUrl?: string;
  /** Optional indexer URL override. Falls back to SDK default for the network. */
  indexerUrl?: string;
  /** Browser-safe Shelby/Geomi client API key for public testnet DApp usage. */
  apiKey?: string;
  /** Blob expiration offset in hours (defaults to 24). */
  expirationHours: number;
}

const SUPPORTED_NETWORKS: Record<string, ShelbyNetwork> = {
  testnet: Network.TESTNET,
  shelbynet: Network.SHELBYNET,
};

/**
 * Reads browser-safe Shelby configuration from NEXT_PUBLIC_ env vars.
 * Always returns a config object — `isReady` indicates whether the config is usable.
 */
export function getBrowserShelbyConfig(): BrowserShelbyConfig {
  const rawNetwork =
    process.env.NEXT_PUBLIC_SHELBY_NETWORK ?? 'testnet';

  const network: ShelbyNetwork = SUPPORTED_NETWORKS[rawNetwork] ?? Network.TESTNET;

  const rpcUrl = process.env.NEXT_PUBLIC_SHELBY_RPC_URL || undefined;
  const indexerUrl = process.env.NEXT_PUBLIC_SHELBY_INDEXER_URL || undefined;
  const apiKey = process.env.NEXT_PUBLIC_TESTNET_API_KEY || undefined;

  const rawHours = process.env.NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS;
  const expirationHours = rawHours ? Math.max(1, parseInt(rawHours, 10)) : 24;

  return {
    isReady: Boolean(apiKey),
    network,
    rpcUrl,
    indexerUrl,
    apiKey,
    expirationHours,
  };
}

/**
 * Creates a browser-side ShelbyClient instance configured for the selected network.
 * Returns a Shelby client instance. Callers should still check `config.isReady`
 * before allowing a real upload.
 *
 * The client is constructed with wallet-auth signer support. The wallet signs
 * on-chain transactions, while the frontend client API key authorizes public
 * Shelby RPC/indexer access.
 */
export function createBrowserShelbyClient(
  config: BrowserShelbyConfig
): ShelbyClient | null {
  return new ShelbyClient({
    network: config.network,
    apiKey: config.apiKey,
    rpc: config.rpcUrl ? { baseUrl: config.rpcUrl } : undefined,
    indexer: config.indexerUrl
      ? { baseUrl: config.indexerUrl, apiKey: config.apiKey }
      : undefined,
  });
}

/**
 * Generates an explorer URL for a blob on the Shelby network explorer.
 * Returns undefined if required params are missing.
 */
export function buildExplorerUrl(
  network: ShelbyNetwork,
  accountAddress: string,
  blobName: string
): string {
  const networkLabel = network === Network.SHELBYNET ? 'shelbynet' : 'testnet';
  return `https://explorer.shelby.xyz/${networkLabel}/account/${accountAddress}/blob/${encodeBlobNamePath(blobName)}`;
}

/**
 * Encodes a Shelby blob name for use in a URL path.
 * Blob names may contain slash separators (e.g. "evidence/{packId}/{hash}-{file}").
 * Each path segment is percent-encoded individually while preserving the
 * slashes — matching the Shelby SDK's encodeURIComponentKeepSlashes behaviour.
 */
export function encodeBlobNamePath(blobName: string): string {
  return blobName.split('/').map(encodeURIComponent).join('/');
}

/**
 * Generates an RPC retrieval URL for a blob.
 * Returns undefined if required params are missing.
 */
export function buildRetrievalUrl(
  rpcBaseUrl: string,
  accountAddress: string,
  blobName: string
): string {
  const base = rpcBaseUrl.replace(/\/$/, '');
  return `${base}/v1/blobs/${accountAddress}/${encodeBlobNamePath(blobName)}`;
}

/**
 * Generates a safe Shelby blob name from file metadata.
 * Format: evidence/{packId}/{sha256-prefix}-{safe-file-name}
 */
export function buildBlobName(packId: string, hash: string, fileName: string): string {
  const hashPrefix = hash.replace(/^sha256:/, '').slice(0, 8);
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
  return `evidence/${packId}/${hashPrefix}-${safeName}`;
}

/**
 * Computes the blob expiration timestamp in microseconds from now.
 */
export function computeExpirationMicros(expirationHours: number): number {
  return Date.now() * 1000 + expirationHours * 3_600_000_000;
}
