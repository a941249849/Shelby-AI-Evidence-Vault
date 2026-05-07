'use server';

/**
 * Server Action: upload a blob payload to the Shelby adapter.
 *
 * The adapter is chosen based on SHELBY_MODE env var (defaults to "mock").
 * Returns a serialisable result object so it can be passed back to the client.
 */

import { getAdapter } from '@/lib/shelby';
import { getShelbyConfig } from '@/lib/shelby/config';
import type { ShelbyUploadResult } from '@/lib/shelby';

export interface UploadActionResult {
  success: true;
  result: ShelbyUploadResult;
  mode: 'mock' | 'testnet';
}

export interface UploadActionError {
  success: false;
  error: string;
  mode: 'mock' | 'testnet';
}

export type UploadActionResponse = UploadActionResult | UploadActionError;

export async function shelbyUploadAction(
  hash: string,
  size: number,
  metadata: Record<string, string>
): Promise<UploadActionResponse> {
  const config = getShelbyConfig();
  const adapter = getAdapter();

  try {
    const result = await adapter.upload({ hash, size }, metadata);
    return { success: true, result, mode: config.mode };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    return { success: false, error: message, mode: config.mode };
  }
}

/**
 * Returns the current Shelby mode so the client can display a status badge
 * without exposing the full config.
 */
export async function getShelbyModeAction(): Promise<'mock' | 'testnet'> {
  return getShelbyConfig().mode;
}
