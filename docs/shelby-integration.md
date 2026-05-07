# Shelby Integration — M1 Guide

## Overview

Shelby AI Evidence Vault integrates with Shelby testnet through an adapter pattern. All Shelby-specific code lives in `src/lib/shelby/`. The rest of the app calls the adapter through a server action (`src/app/actions/upload.ts`) so API keys are never exposed to the browser.

---

## Shelbynet network context

Shelby runs on **shelbynet** — an isolated Aptos-derived network. This is not the public Aptos testnet, and Aptos testnet URLs are incompatible with Shelby.

| Resource | URL |
|---|---|
| Shelby RPC (blob storage) | `https://api.shelbynet.shelby.xyz/shelby` |
| Aptos fullnode (shelbynet) | `https://api.shelbynet.shelby.xyz/v1` |
| Indexer GraphQL (shelbynet) | `https://api.shelbynet.shelby.xyz/v1/graphql` |
| Explorer | `https://explorer.shelby.xyz/shelbynet` |
| Coordination contract | `0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5` |

---

## Two-plane architecture

Shelby integration spans two distinct network planes. These must not be conflated in environment variable naming, documentation, or code:

### Plane 1 — Shelby storage / RPC plane

Shelby's own blob storage and API layer running on shelbynet. Responsible for:
- Blob upload and retrieval via `SHELBY_RPC_URL`
- `shelby://shelbynet/blob/{id}` reference generation
- Storage-side read receipts and provenance

Environment variables:
```
SHELBY_NETWORK=shelbynet          # Network label for Shelby storage operations
SHELBY_RPC_URL=                   # https://api.shelbynet.shelby.xyz/shelby
SHELBY_API_KEY=                   # Authentication (server-side only)
SHELBY_ACCOUNT_ADDRESS=           # Your Shelby account address
SHELBY_BLOB_EXPIRATION_MICROS=    # Required for real uploads (e.g. 1800000000 = 30 min)
```

### Plane 2 — Shelbynet / Aptos coordination plane

The Aptos-layer network connectivity on shelbynet for on-chain coordination. Responsible for:
- On-chain blob commitment registration (required before putBlob in M2+)
- Aptos transaction submission for Shelby coordination events
- Aptos account identity on shelbynet

Environment variables:
```
APTOS_NETWORK=shelbynet                  # Must be "shelbynet", not "testnet"
SHELBYNET_APTOS_FULLNODE_URL=            # https://api.shelbynet.shelby.xyz/v1
SHELBYNET_INDEXER_URL=                   # https://api.shelbynet.shelby.xyz/v1/graphql
SHELBYNET_FAUCET_URL=                    # Shelbynet faucet for test account funding
SHELBYNET_ACCOUNT_ADDRESS=               # Your Aptos account address on shelbynet
```

> **M1 scope:** Plane 2 variables are defined and documented in M1 but not consumed by any adapter code yet. Aptos transaction signing and on-chain submission are deferred to a future milestone. When required, signing must be handled server-side or via a secure wallet integration — **never** by committing private keys or seed phrases.

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
- A `shelby://shelbynet/blob/{id}` reference is derived deterministically from the first 32 hex characters of the SHA-256 hash.
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
   SHELBY_NETWORK=shelbynet
   SHELBY_RPC_URL=https://api.shelbynet.shelby.xyz/shelby
   SHELBY_API_KEY=your_api_key_here
   SHELBY_ACCOUNT_ADDRESS=0xYourAddress
   SHELBY_BLOB_EXPIRATION_MICROS=1800000000
   APTOS_NETWORK=shelbynet
   SHELBYNET_APTOS_FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1
   SHELBYNET_INDEXER_URL=https://api.shelbynet.shelby.xyz/v1/graphql
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

The upload page will show a green **"Shelby testnet mode"** indicator.

> **M1 note:** The real testnet adapter (`src/lib/shelby/testnet-adapter.ts`) is a documented placeholder in M1. Setting `SHELBY_MODE=testnet` will return an error on upload. See the file for the full M2+ implementation guide, including the multi-step upload flow and signing/funding prerequisites.

---

## What happens if testnet config is missing?

If `SHELBY_MODE=testnet` is set but `SHELBY_RPC_URL` or `SHELBY_API_KEY` is not provided, the testnet adapter will fail at upload time with a clear error message. The upload page will display this error. Mock mode is unaffected.

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

See `src/lib/shelby/testnet-adapter.ts` for the full implementation guide. The interface to implement is:

```typescript
interface ShelbyAdapter {
  upload(data: ShelbyUploadPayload, metadata: Record<string, string>): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
  getMode(): 'mock' | 'testnet';
}
```

### Real upload flow

Shelby blob upload is a coordinated multi-step flow, not a single HTTP call:

1. **Generate blob commitments** from the file bytes.
2. **Register the blob on-chain** via the Aptos coordination layer on shelbynet (requires APT for gas; uses `@aptos-labs/ts-sdk` with `APTOS_NETWORK=shelbynet` and `SHELBYNET_APTOS_FULLNODE_URL`).
3. **Wait for the Aptos transaction** to be confirmed on shelbynet.
4. **Call `rpc.putBlob()`** via `SHELBY_RPC_URL`. The Shelby RPC validates the commitment status before accepting the upload (requires ShelbyUSD or SHEL tokens).

The Node SDK (`@shelby-protocol/sdk`) provides a `ShelbyNodeClient.upload()` method that handles all four steps internally.

### SDK packages

```bash
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
# Browser flows:
npm install @shelby-protocol/react
```

### Payload fields already available

The `ShelbyUploadPayload` in `adapter.ts` already carries all fields the SDK needs:

| Field | SDK parameter |
|---|---|
| `data.content` | `blobData` (decode: `Buffer.from(data.content, 'base64')`) |
| `data.fileName` | `blobName` |
| `data.hash` | content fingerprint reference |
| `data.size` | file size in bytes |
| `data.mimeType` | MIME type |
| `config.blobExpirationMicros` | `expirationMicros` (required — set `SHELBY_BLOB_EXPIRATION_MICROS`) |

### Funding prerequisites

Real uploads to shelbynet require:
- **APT** on shelbynet: for on-chain commitment registration gas fees.
- **ShelbyUSD or SHEL tokens**: for Shelby storage operations.
- Use `SHELBYNET_FAUCET_URL` for test account funding during development.

### Signing security (M2+ design decision)

Uploading requires an Aptos account signer on shelbynet. This must be handled:
- Server-side using a funded account whose private key is stored as an env secret (never in source code).
- Or via a secure wallet/browser signing integration (e.g. `@shelby-protocol/react` for browser flows).

**Never commit private keys, seed phrases, or mnemonic phrases.** This is a M2+ security design decision outside M1 scope.

---

## M1 limitations

- Real Shelby testnet upload is not functional — it is a documented placeholder.
- File size is capped at 5 MB per file for browser performance.
- Evidence packs persist in `localStorage` only — they are browser-specific and tab-private.
- No authentication or rate limiting on uploads.
- No search or filter on the dashboard.
- No read receipt generation from uploads.
