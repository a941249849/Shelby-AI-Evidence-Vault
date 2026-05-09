'use client';

/**
 * useShelbyUpload — React hook for browser-wallet Shelby testnet blob upload.
 *
 * Wraps @shelby-protocol/react's useUploadBlobs with wallet adapter integration.
 * Handles fail-closed states:
 *   - Wallet not connected    → throws with clear message
 *   - Wrong wallet network    → throws with clear message before upload
 *   - Config missing          → throws with clear message
 *   - SDK upload fails        → re-throws SDK error
 *
 * Returns void from useUploadBlobs (SDK v0.3.0 does not expose txHash/commitmentRoot
 * from the React hook). storageStatus is set to 'registered' on success.
 * transactionHash and commitmentRoot remain undefined until a lower-level SDK
 * integration is added in a future milestone.
 */

import { useMemo } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { AdapterWallet, AdapterNotDetectedWallet } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useUploadBlobs } from '@shelby-protocol/react';
import type { WalletAdapterSigner } from '@shelby-protocol/react';
import {
  getBrowserShelbyConfig,
  createBrowserShelbyClient,
  buildBlobName,
  buildExplorerUrl,
  buildRetrievalUrl,
  computeExpirationMicros,
} from './browser-client';

export interface TestnetUploadInput {
  /** Evidence pack ID (used to namespace the blob name). */
  packId: string;
  /** Original file name. */
  fileName: string;
  /** Raw file bytes as a Uint8Array. */
  blobData: Uint8Array;
  /** SHA-256 hash prefixed with "sha256:". */
  hash: string;
}

export interface TestnetUploadResult {
  /** Shelby blob name (account namespace key). */
  blobName: string;
  /** Aptos account address that owns the blob. */
  accountAddress: string;
  /** Canonical shelby:// reference. */
  shelbyRef: string;
  /** Storage status (always 'registered' for a successful upload via this hook). */
  storageStatus: string;
  /** Blob expiration in microseconds. */
  expirationMicros: string;
  /** Shelby explorer URL for this blob. */
  explorerUrl?: string;
  /** RPC retrieval URL for this blob. */
  retrievalUrl?: string;
}

export interface UseShelbyUploadReturn {
  /** Whether browser-side Shelby testnet config is complete. */
  configReady: boolean;
  /** Whether an Aptos wallet is currently connected. */
  walletConnected: boolean;
  /** The connected wallet account address, or null if not connected. */
  walletAddress: string | null;
  /** Network name reported by the connected wallet, or null if not connected. */
  walletNetwork: Network | null;
  /** The name of the currently connected wallet (e.g. "Petra"), or null. */
  walletName: string | null;
  /** Whether the upload path is fully ready (wallet connected + testnet + config valid). */
  isReady: boolean;
  /** Whether an upload is currently in progress. */
  isPending: boolean;
  /** The last upload error, or null if none. */
  error: Error | null;
  /** Available wallets detected by the adapter. */
  wallets: ReadonlyArray<AdapterWallet>;
  /** Wallets that were detected as installed but not available. */
  notDetectedWallets: ReadonlyArray<AdapterNotDetectedWallet>;
  /** Connect to the named wallet. */
  connect(walletName: string): void;
  /** Disconnect the current wallet. */
  disconnect(): void;
  /**
   * Uploads a single blob to Shelby testnet using the connected browser wallet.
   * Fails closed with a descriptive error if wallet or config requirements are unmet,
   * or if the wallet is on the wrong network.
   */
  uploadBlob(input: TestnetUploadInput): Promise<TestnetUploadResult>;
}

/**
 * React hook for browser-wallet Shelby testnet blob upload.
 * Must be used inside AptosWalletAdapterProvider and QueryClientProvider.
 */
export function useShelbyUpload(): UseShelbyUploadReturn {
  const wallet = useWallet();

  const browserConfig = useMemo(() => getBrowserShelbyConfig(), []);

  const shelbyClient = useMemo(
    () => createBrowserShelbyClient(browserConfig),
    [browserConfig]
  );

  const uploadBlobsMutation = useUploadBlobs({
    client: shelbyClient ?? undefined,
  });

  const walletAddress = useMemo(() => {
    if (!wallet.account) return null;
    const addr = wallet.account.address;
    return typeof addr === 'string' ? addr : String(addr);
  }, [wallet.account]);

  const walletNetwork = wallet.network?.name ?? null;

  const isReady =
    wallet.connected &&
    !!shelbyClient &&
    browserConfig.isReady &&
    walletNetwork === Network.TESTNET;

  async function uploadBlob(input: TestnetUploadInput): Promise<TestnetUploadResult> {
    if (!wallet.connected || !wallet.account) {
      throw new Error(
        'Wallet not connected. Please connect your Aptos wallet to upload to Shelby testnet.'
      );
    }

    // Fail closed if the wallet is on the wrong network.
    if (walletNetwork !== null && walletNetwork !== Network.TESTNET) {
      throw new Error(
        `Wrong network: wallet is on "${walletNetwork}", but Shelby upload requires Aptos testnet. ` +
          'Please switch your wallet to Aptos Testnet and try again.'
      );
    }

    if (!shelbyClient) {
      throw new Error(
        'Shelby testnet client could not be initialised. ' +
          'Set NEXT_PUBLIC_TESTNET_API_KEY to a Shelby/Geomi client API key and restart the app.'
      );
    }

    if (!browserConfig.isReady) {
      throw new Error(
        'Shelby testnet upload is missing NEXT_PUBLIC_TESTNET_API_KEY. ' +
          'Create a Shelby/Geomi frontend client API key, set it in .env.local, and restart the app.'
      );
    }

    const accountAddress = walletAddress ?? wallet.account.address.toString();
    const blobName = buildBlobName(input.packId, input.hash, input.fileName);
    const expirationMicros = computeExpirationMicros(browserConfig.expirationHours);

    // Build a WalletAdapterSigner-compatible object.
    // Use a string address to satisfy the AccountAddressInput type from
    // @shelby-protocol/react regardless of @aptos-labs/ts-sdk version differences.
    const signer: WalletAdapterSigner = {
      account: { address: accountAddress },
      signAndSubmitTransaction: wallet.signAndSubmitTransaction as WalletAdapterSigner['signAndSubmitTransaction'],
    };

    // Use mutateAsync so we can await the upload and surface errors.
    await uploadBlobsMutation.mutateAsync({
      signer,
      blobs: [{ blobName, blobData: input.blobData }],
      expirationMicros,
    });

    const rpcBase =
      browserConfig.rpcUrl ?? 'https://api.testnet.shelby.xyz/shelby';

    const explorerUrl = buildExplorerUrl(browserConfig.network, accountAddress, blobName);
    const retrievalUrl = buildRetrievalUrl(rpcBase, accountAddress, blobName);

    return {
      blobName,
      accountAddress,
      shelbyRef: `shelby://testnet/${accountAddress}/${blobName}`,
      storageStatus: 'registered',
      expirationMicros: String(expirationMicros),
      explorerUrl,
      retrievalUrl,
    };
  }

  return {
    configReady: browserConfig.isReady,
    walletConnected: wallet.connected,
    walletAddress,
    walletNetwork,
    walletName: wallet.wallet?.name ?? null,
    isReady,
    isPending: uploadBlobsMutation.isPending,
    error: uploadBlobsMutation.error,
    wallets: wallet.wallets,
    notDetectedWallets: wallet.notDetectedWallets,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    uploadBlob,
  };
}
