'use client';

/**
 * Client-side providers for Shelby browser-wallet surfaces.
 *
 * Wraps children with:
 *  - QueryClientProvider (@tanstack/react-query) — required by useUploadBlobs
 *  - AptosWalletAdapterProvider — required by useWallet for browser wallet signing
 *    Pinned to Network.TESTNET so only testnet-aligned wallets are accepted.
 *
 * These providers are scoped to wallet-aware routes so the rest of the app does
 * not carry wallet adapter overhead.
 */

import { useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

export default function UploadProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={false}
        dappConfig={{
          network: Network.TESTNET,
          aptosApiKeys: process.env.NEXT_PUBLIC_TESTNET_API_KEY
            ? { testnet: process.env.NEXT_PUBLIC_TESTNET_API_KEY }
            : undefined,
        }}
        disableTelemetry
      >
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
