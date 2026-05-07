# Shelby Integration — M1 Guide

## Overview

Shelby AI Evidence Vault integrates with Shelby testnet through an adapter pattern. All Shelby-specific code lives in `src/lib/shelby/`. The rest of the app calls the adapter through a server action (`src/app/actions/upload.ts`) so API keys are never exposed to the browser.

---

## Architecture

```
src/lib/shelby/
  adapter.ts          # ShelbyAdapter interface + payload/result types
  config.ts           # Reads SHELBY_MODE and related env vars (server-side only)
  mock-adapter.ts     # Deterministic mock: derives shelby:// ref from content hash
  testnet-adapter.ts  # Real testnet adapter (M1 placeholder — see implementation notes)
  index.ts            # getAdapter() factory + re-exports
```

`getAdapter()` reads `SHELBY_MODE` from `process.env` at call time and returns either the mock adapter or the testnet adapter. It must only be called from server-side code (Server Actions, Route Handlers) because it reads `process.env`.

---

## Running in mock mode (default)

No environment variables are required. Mock mode is the default when `SHELBY_MODE` is absent or set to `mock`.

```bash
npm run dev
# or
SHELBY_MODE=mock npm run dev
```

In mock mode:
- SHA-256 hash is computed in-browser using the Web Crypto API.
- A `shelby://testnet/blob/{id}` reference is derived deterministically from the first 32 hex characters of the SHA-256 hash.
- The same file always produces the same shelby ref.
- No network calls are made to any external service.
- Uploaded evidence packs and blobs are stored in browser `localStorage`.

---

## Configuring Shelby testnet mode

1. Copy `.env.example` to `.env.local` (never commit `.env.local`):

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local`:

   ```env
   SHELBY_MODE=testnet
   SHELBY_TESTNET_RPC_URL=https://testnet.shelby.example.com
   SHELBY_API_KEY=your_api_key_here
   SHELBY_ACCOUNT_ADDRESS=0xYourAddress
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

The upload page will show a green **"Shelby testnet mode"** indicator.

> **M1 note:** The real testnet adapter (`src/lib/shelby/testnet-adapter.ts`) is a documented placeholder in M1. Setting `SHELBY_MODE=testnet` will return an error on upload because the official Shelby TypeScript SDK was not available at M1 implementation time. See the file for implementation notes on wiring in the real SDK (M2+).

---

## What happens if testnet config is missing?

If `SHELBY_MODE=testnet` is set but no `SHELBY_API_KEY` or `SHELBY_TESTNET_RPC_URL` is provided, the testnet adapter will fail at upload time with a clear error message. The upload page will display this error. Mock mode is unaffected.

---

## Security rules

- **Never** set `NEXT_PUBLIC_SHELBY_API_KEY` or expose the API key via any `NEXT_PUBLIC_*` variable.
- **Never** commit `.env.local` or any file containing real secrets.
- `SHELBY_API_KEY` is read exclusively server-side inside the server action.
- Only `SHELBY_MODE` is safe to set as `NEXT_PUBLIC_*` if you need the mode badge to appear on first render (optional, not required).

---

## Upload flow

1. User selects files on the upload page (up to 5 MB each).
2. SHA-256 hash is computed in-browser for each file using `crypto.subtle.digest`.
3. On submit, the client calls the `shelbyUploadAction` Server Action with the hash, size, and metadata.
4. The server action calls `getAdapter()` (reads `SHELBY_MODE` env var) and calls `adapter.upload()`.
5. The server action returns a serialisable result to the client.
6. The client builds `EvidencePack` and `BlobRecord` objects using `buildEvidencePack()` / `buildBlobRecord()` from `src/lib/validation.ts`.
7. Records are saved to browser `localStorage` via `src/lib/store/local-store.ts`.
8. The upload page shows a success state with links to the new blob detail pages.

---

## Local persistence

Uploaded evidence packs and blobs are stored in browser `localStorage` under two keys:

| Key | Contents |
|---|---|
| `shelby_vault_packs` | `EvidencePack[]` uploaded by the user |
| `shelby_vault_blobs` | `BlobRecord[]` uploaded by the user |

Built-in demo data is **not** stored in localStorage — it is always imported from `src/lib/demo-data/`.

The dashboard merges both sources:
1. User-uploaded packs (from localStorage) appear at the top with a green indicator.
2. Built-in demo packs appear below.

To clear local data, use the **"Reset local demo data"** button on the dashboard.

---

## Implementing the real testnet adapter (M2+)

See `src/lib/shelby/testnet-adapter.ts` for step-by-step implementation notes. The interface to implement is:

```typescript
interface ShelbyAdapter {
  upload(data: ShelbyUploadPayload, metadata: Record<string, string>): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
  getMode(): 'mock' | 'testnet';
}
```

Once the real SDK is available:
1. `npm install @shelby/sdk` (use actual package name from official docs)
2. Fill in `createTestnetAdapter()` in `testnet-adapter.ts`
3. No changes needed in the adapter interface, server action, or UI

---

## M1 limitations

- Real Shelby testnet upload is not functional — it is a documented placeholder.
- File size is capped at 5 MB per file for browser performance.
- Evidence packs persist in `localStorage` only — they are browser-specific and tab-private.
- No authentication or rate limiting on uploads.
- No search or filter on the dashboard.
- No read receipt generation from uploads.
