# Shelby Integration — M1B Guide

> **⚠ Historical document — M1B archive.** This file describes the M1B local-mock-only state of the project. It is preserved for reference but is superseded by the M4/M5 documents. For current integration facts, see:
> - `README.md` — product overview, modes, and env vars
> - `docs/architecture.md` — current code structure and browser-wallet upload path
> - `docs/c3-smoke-test-guide.md` — smoke harness and manual testnet verification
> - `docs/m4-read-receipt-binding.md` — read receipt BlobRecord identity binding
>
> In particular: real Shelby testnet upload is **no longer blocked** — a browser-wallet testnet path exists in `src/lib/shelby/use-shelby-upload.ts` (M3). Read receipts now bind to real BlobRecord identity (M4). The smoke harness verifies RPC connectivity and retrieval (C3).

## Overview

Shelby AI Evidence Vault integrates with Shelby through an adapter pattern. All Shelby-specific code lives in `src/lib/shelby/`. The rest of the app calls the adapter through a server action (`src/app/actions/upload.ts`) so API keys are never exposed to the browser.

**M1B is a local demo milestone only.** Real Shelby upload is not implemented. The app stores evidence packs in browser `localStorage` with deterministic mock Shelby references (`shelby://mock/blob/{id}`). No wallet signing, no network calls, no real Shelby blobs in M1B.

---

## M1B scope — what is and is not implemented

| Feature | M1B status |
|---|---|
| File select + drag-drop | ✅ Implemented |
| Browser SHA-256 hash preview | ✅ Implemented |
| Local EvidencePack creation | ✅ Implemented |
| Local BlobRecord creation | ✅ Implemented |
| Deterministic mock ref (`shelby://mock/blob/`) | ✅ Implemented |
| `localStorage` persistence | ✅ Implemented |
| Dashboard demo/local separation | ✅ Implemented |
| Blob detail demo/local resolution | ✅ Implemented |
| Reset local demo data | ✅ Implemented |
| Validation helpers | ✅ Implemented |
| Real Shelby SDK upload | ❌ Blocked until M2 |
| Wallet signing | ❌ Blocked until M2 |
| On-chain commitment registration | ❌ Blocked until M2 |
| Shelbynet network calls | ❌ Blocked until M2 |
| APT / ShelbyUSD token funding | ❌ Blocked until M2 |

---

## Network context (M2+ reference — verify at implementation time)

Shelby previously exposed **shelbynet** as a developer prototype network. Current M2/M3 real integration should target the official **testnet** endpoint family unless the latest SDK/docs say otherwise. Do not mix `shelbynet` and `testnet` endpoint values in one runtime config.

| Resource | URL |
|---|---|
| Shelby RPC (blob storage) | `https://api.testnet.shelby.xyz/shelby` |
| Aptos fullnode (testnet) | `https://api.testnet.aptoslabs.com/v1` |
| Indexer GraphQL (testnet) | `https://api.testnet.aptoslabs.com/v1/graphql` |
| Explorer | `https://explorer.shelby.xyz/testnet` |
| Coordination contract | Verify against official Shelby docs at M2 — do not hardcode unverified values |

---

## Two-plane architecture

Shelby integration spans two distinct network planes. These must not be conflated in environment variable naming, documentation, or code:

### Plane 1 — Shelby storage / RPC plane

Shelby's own blob storage and API layer. Responsible for:
- Blob upload and retrieval via `SHELBY_RPC_URL`
- account-address + blob-name identity after real upload (M2+)
- Storage-side read receipts and provenance

Environment variables:
```
SHELBY_NETWORK=testnet            # Network label for Shelby storage operations
SHELBY_RPC_URL=                   # https://api.testnet.shelby.xyz/shelby
SHELBY_API_KEY=                   # Authentication (server-side only)
SHELBY_ACCOUNT_ADDRESS=           # Your Shelby account address
SHELBY_BLOB_EXPIRATION_MICROS=    # Required for real uploads (e.g. 1800000000 = 30 min)
```

### Plane 2 — Aptos coordination plane

The Aptos-layer network connectivity for on-chain coordination. Responsible for:
- On-chain blob commitment registration (required before putBlob in M2+)
- Aptos transaction submission for Shelby coordination events
- Aptos account identity on the selected network

Environment variables:
```
APTOS_NETWORK=testnet                    # Current Shelby testnet coordination target
SHELBY_APTOS_FULLNODE_URL=               # https://api.testnet.aptoslabs.com/v1
SHELBY_INDEXER_URL=                      # https://api.testnet.aptoslabs.com/v1/graphql
SHELBY_FAUCET_URL=                       # Faucet/funding URL if documented
SHELBY_COORDINATION_ACCOUNT_ADDRESS=     # Your Aptos coordination account address
```

> **M1B scope:** All Plane 2 variables are defined and documented in M1B but not consumed by any adapter code yet. Aptos transaction signing and on-chain submission are deferred to M2. When required, signing must be handled server-side or via a secure wallet integration — **never** by committing private keys or seed phrases.

---

## Architecture

```
src/lib/shelby/
  adapter.ts          # ShelbyAdapter interface + payload/result types
  config.ts           # Reads SHELBY_MODE and related env vars (server-side only)
  mock-adapter.ts     # Deterministic mock: derives shelby://mock/blob/ ref from content hash
  testnet-adapter.ts  # Real testnet adapter (M1B blocked — see implementation notes)
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
- A `shelby://mock/blob/{id}` reference is derived deterministically from the first 32 hex characters of the SHA-256 hash.
- The same file always produces the same mock ref.
- No network calls are made to any external service.
- Uploaded evidence packs and blobs are stored in browser `localStorage`.
- Mock refs are clearly labeled as demo/local in the UI — not real Shelby blob identities.

---

## Configuring Shelby testnet mode (blocked until M2)

Setting `SHELBY_MODE=testnet` will cause uploads to fail with a clear blocked message. This is intentional — the real adapter is a documented placeholder until M2.

> **M1B:** The real testnet adapter (`src/lib/shelby/testnet-adapter.ts`) is blocked until M2. See the file for the full M2+ implementation guide, including the multi-step upload flow and signing/funding prerequisites.

If you want to prepare the environment for future M2 testing:

1. Copy `.env.example` to `.env.local` (never commit `.env.local`):

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` (values for reference only — uploads will still fail until M2):

   ```env
   SHELBY_MODE=testnet
   SHELBY_NETWORK=testnet
   SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
   SHELBY_API_KEY=your_api_key_here
   SHELBY_ACCOUNT_ADDRESS=0xYourAddress
   SHELBY_BLOB_EXPIRATION_MICROS=1800000000
   APTOS_NETWORK=testnet
   SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1
   SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
   ```

---

## What happens when SHELBY_MODE=testnet

The upload page shows a red/amber **"Real Shelby upload blocked until M2"** indicator. Any upload attempt returns:

```
Real Shelby upload is blocked until M2. Official integration requires commitment
generation, on-chain registration, RPC upload, network selection, signer/wallet
design, API key handling, and funding. Set SHELBY_MODE=mock to use the local demo adapter.
```

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
3. File content is read as chunked base64 (32 KB chunks) for future M2 use.
4. On submit, the client calls the `shelbyUploadAction` Server Action with the hash, size, metadata, and file content.
5. The server action calls `getAdapter()` (reads `SHELBY_MODE` env var) and calls `adapter.upload()`.
6. The server action returns a serialisable result to the client.
7. The client builds `EvidencePack` and `BlobRecord` objects using `buildEvidencePack()` / `buildBlobRecord()` from `src/lib/validation.ts`.
8. Records are saved to browser `localStorage` via `src/lib/store/local-store.ts`.
9. The upload page shows a success state labeled "Local Demo Upload Complete" with links to the new blob detail pages.

---

## BlobRecord — future-compatible fields

`BlobRecord` already carries optional fields reserved for M2+ real upload identity:

| Field | M1B value | M2+ value |
|---|---|---|
| `shelbyRef` | `shelby://mock/blob/{id}` (mock) | Real Shelby ref after on-chain registration |
| `mockRef` | Same as shelbyRef (mock ref copy) | undefined |
| `blobName` | Original file name | Shelby blobName (account namespace key) |
| `network` | `'mock'` | `'testnet'` |
| `accountAddress` | undefined | Shelby account address |
| `transactionHash` | undefined | Aptos tx hash from commitment registration |
| `expirationMicros` | undefined | Expiration set at upload time |
| `storageStatus` | undefined | Shelby RPC storage status after putBlob |
| `commitmentRoot` | undefined | Commitment root from Shelby commitment step |

> **Important:** `shelby://mock/blob/{id}` strings are demo/local references only — not confirmed official Shelby blob identities. Official Shelby identity uses account namespace + blob name (see `blobName` / `accountAddress`).

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
2. **Register the blob on-chain** via the Aptos coordination layer (requires testnet APT for gas; uses `@aptos-labs/ts-sdk` with `APTOS_NETWORK=testnet` and `SHELBY_APTOS_FULLNODE_URL`).
3. **Wait for the Aptos transaction** to be confirmed on the selected network.
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

Real uploads to Shelby testnet require:
- **Testnet APT**: for on-chain commitment registration gas fees.
- **ShelbyUSD or SHEL tokens**: for Shelby storage operations.
- Verify the current Shelby/testnet funding path before wiring any funding UI.

### Signing security (M2+ design decision)

Uploading requires an Aptos account signer on the selected network. This must be handled:
- Server-side using a funded account whose private key is stored as an env secret (never in source code).
- Or via a secure wallet/browser signing integration (e.g. `@shelby-protocol/react` for browser flows).

**Never commit private keys, seed phrases, or mnemonic phrases.** This is a M2+ security design decision outside M1B scope.

---

## M1B limitations

- Real Shelby testnet upload is not functional — it is a documented placeholder blocked until M2.
- Mock refs (`shelby://mock/blob/{id}`) are local demo identifiers only, not real Shelby blob identities.
- File size is capped at 5 MB per file for browser performance.
- Evidence packs persist in `localStorage` only — they are browser-specific and tab-private.
- No authentication or rate limiting on uploads.
- No search or filter on the dashboard.
- No read receipt generation from uploads.
