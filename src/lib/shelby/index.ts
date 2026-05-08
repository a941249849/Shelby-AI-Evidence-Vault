import { getShelbyConfig } from './config';
import { mockShelbyAdapter } from './mock-adapter';
import { createTestnetAdapter } from './testnet-adapter';

export type { ShelbyAdapter, ShelbyUploadResult, ShelbyUploadPayload } from './adapter';
export type { ShelbyConfig, ShelbyMode } from './config';

/**
 * Returns the appropriate adapter based on the current SHELBY_MODE env var.
 * Defaults to mock when the env var is absent.
 *
 * Must be called from server-side code only (Server Actions, Route Handlers)
 * because it reads process.env.
 */
export function getAdapter() {
  const config = getShelbyConfig();
  if (config.mode === 'testnet') {
    return createTestnetAdapter(config);
  }
  return mockShelbyAdapter;
}

/** Re-export mock adapter for tests and utilities that need it directly. */
export { mockShelbyAdapter } from './mock-adapter';
