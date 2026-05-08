'use client';

/**
 * Client-side providers for the upload page.
 *
 * Wraps children with:
 *  - QueryClientProvider (@tanstack/react-query) — required by useUploadBlobs
 *  - AptosWalletAdapterProvider — required by useWallet for browser wallet signing
 *
 * These providers are scoped to the upload page only to avoid unnecessary overhead
 * in the rest of the application.
 */

import { useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

export default function UploadProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider autoConnect={false} disableTelemetry>
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
