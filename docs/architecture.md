# Architecture — Shelby AI Evidence Vault

## System overview

```
┌──────────────────────────────────────────────────────────────────┐
│                            Browser                                │
│  /  /dashboard  /upload  /blob  /read-receipt                     │
│  localStorage: packs + blobs + receipts (M1/M4)                   │
│  Browser wallet: Aptos wallet extension (testnet mode only)       │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP / Server Actions
┌──────────────────────▼───────────────────────────────────────────┐
│                   Next.js App Router                              │
│  Server Components + Client Components                            │
│  Server Actions: upload.ts (shelbyUploadAction — mock path)      │
└──────┬───────────────────────────────┬────────────────────────────┘
       │                               │
┌──────▼──────┐          ┌─────────────▼──────────────────────────┐
│ components/ │          │  lib/evidence/service                   │
│  nav        │          │  getEvidencePacks()                     │
│  badge      │          │  getBlobById()                          │
│  pack-card  │          │  getReadReceiptById()                   │
│  page-header│          └─────────────┬──────────────────────────┘
│  dashboard- │                        │
│   client    │          ┌─────────────▼──────────────────────────┐
│  blob-      │          │  lib/demo-data/                         │
│   detail-   │          │  evidence-packs.ts                      │
│   client    │          │  blobs.ts                               │
│  read-      │          │  read-receipts.ts                       │
│   receipt-  │          └─────────────┬──────────────────────────┘
│   client    │                        │ upload writes via
└─────────────┘          ┌─────────────▼──────────────────────────┐
                         │  lib/shelby/                            │
                         │  adapter.ts       (interface)           │
                         │  config.ts        (env vars, server)    │
                         │  mock-adapter.ts                        │
                         │  testnet-adapter.ts (legacy placeholder) │
                         │  browser-client.ts  (NEXT_PUBLIC_ only) │
                         │  use-shelby-upload.ts (React hook)      │
                         │  status-map.ts    (status utilities)    │
                         │  index.ts         (getAdapter)          │
                         └────────────────────────────────────────┘
```

---

## Directory structure

```
src/
├── app/
│   ├── layout.tsx              Root layout: Nav, footer, fonts
│   ├── globals.css             Tailwind + custom utilities
│   ├── page.tsx                Landing page (server component)
│   ├── actions/
│   │   └── upload.ts           Server Action: shelbyUploadAction + getShelbyModeAction
│   ├── dashboard/
│   │   └── page.tsx            Server component → DashboardClient
│   ├── upload/
│   │   ├── page.tsx            Full upload flow (client component — mock + testnet paths)
│   │   └── providers.tsx       QueryClient + AptosWalletAdapterProvider (testnet path)
│   ├── blob/
│   │   └── [id]/
│   │       └── page.tsx        Server component → BlobDetailClient
│   └── read-receipt/
│       └── [id]/
│           └── page.tsx        Thin server shell → ReadReceiptClient
├── components/
│   ├── nav.tsx                 Top navigation bar
│   ├── badge.tsx               Generic pill badge
│   ├── status-badge.tsx        Evidence pack status badge
│   ├── evidence-pack-card.tsx  Card for an evidence pack
│   ├── page-header.tsx         Page title + subtitle
│   ├── dashboard-client.tsx    Client: merges demo + localStorage packs
│   ├── blob-detail-client.tsx  Client: resolves demo + localStorage blobs
│   └── read-receipt-client.tsx Client: resolves receipts from demo data or localStorage
└── lib/
    ├── demo-data/
    │   ├── evidence-packs.ts   5 demo packs + EvidencePack type
    │   ├── blobs.ts            6 demo blobs + BlobRecord type
    │   ├── read-receipts.ts    4 demo read receipts + ReadReceipt type (receiptMode field added M4)
    │   └── index.ts            Re-exports all
    ├── evidence/
    │   ├── types.ts            Re-exports types from demo-data
    │   └── service.ts          Service functions (read from demo-data)
    ├── shelby/
    │   ├── adapter.ts          ShelbyAdapter interface + payload/result types
    │   ├── config.ts           getShelbyConfig() — reads SHELBY_MODE etc. (server-side only)
    │   ├── mock-adapter.ts     Deterministic mock adapter (shelby://mock/blob/{id})
    │   ├── testnet-adapter.ts  Legacy server-side testnet placeholder
    │   ├── browser-client.ts   Browser-side Shelby client (NEXT_PUBLIC_ vars only, no secrets)
    │   ├── use-shelby-upload.ts React hook: browser wallet + useUploadBlobs (testnet path)
    │   ├── status-map.ts       Conservative evidence storage status mapping utilities
    │   └── index.ts            getAdapter() factory + re-exports
    ├── store/
    │   └── local-store.ts      Browser localStorage: packs, blobs, and receipts
    ├── validation.ts           parseTags, isValidSHA256, buildEvidencePack, buildBlobRecord
    └── utils.ts                formatBytes, formatDate, formatDateTime
```

---

## Service layer pattern

All demo-data access goes through `src/lib/evidence/service.ts`. UI pages import service functions, never demo-data directly (except the landing page which uses the data array for convenience).

```ts
// pages use service:
import { getEvidencePacks, getBlobById } from '@/lib/evidence/service';

// service reads from demo-data static arrays:
import { evidencePacks, blobs, readReceipts } from '../demo-data';
```

For uploaded data, client components read directly from `lib/store/local-store.ts` after hydration.

---

## Shelby adapter pattern

`src/lib/shelby/adapter.ts` defines:

```ts
interface ShelbyAdapter {
  upload(data: ShelbyUploadPayload, metadata: Record<string, string>): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
  getMode(): 'mock' | 'testnet';
}
```

**Mock:** `mockShelbyAdapter` — derives `shelby://mock/blob/{id}` ref from content hash; deterministic; no network calls.

**Testnet (legacy server-side placeholder):** `createTestnetAdapter()` — used if `SHELBY_MODE=testnet` is set without a browser session. Falls back to a descriptive error. The real upload path is the browser-wallet hook.

`getAdapter()` in `index.ts` reads `process.env.SHELBY_MODE` and returns the appropriate adapter. It must only be called from server-side code.

---

## Browser-wallet upload path (M3+)

The testnet upload path uses a React hook and is browser-only:

```
upload/page.tsx (client component)
  → useShelbyUpload() [src/lib/shelby/use-shelby-upload.ts]
      → useWallet() [@aptos-labs/wallet-adapter-react]
      → getBrowserShelbyConfig() [browser-client.ts — NEXT_PUBLIC_ vars only]
      → createBrowserShelbyClient() [browser-client.ts — ShelbyClient from SDK]
      → useUploadBlobs() [@shelby-protocol/react]
  → On success: returns { blobName, accountAddress, shelbyRef, storageStatus, explorerUrl, retrievalUrl }
```

**Security boundary:**
- `browser-client.ts` reads only `NEXT_PUBLIC_*` variables — safe in the browser.
- No `NEXT_PUBLIC_SHELBY_API_KEY` exists or is consumed anywhere.
- `SHELBY_API_KEY` stays in the Server Action on the server.
- Browser wallet signing is handled by the user's wallet extension (e.g. Petra) — no private key custody.

The browser-wallet path is wrapped in `UploadProviders` (`src/app/upload/providers.tsx`), which sets up `QueryClientProvider` and `AptosWalletAdapterProvider`. This provider wrapping is required by the SDK hooks and is isolated to the upload route.

---

## localStorage persistence (M1/M4)

All three data types are persisted to browser localStorage:

| Key | Content |
|---|---|
| `shelby_vault_packs` | `EvidencePack[]` — local uploads |
| `shelby_vault_blobs` | `BlobRecord[]` — local uploads |
| `shelby_vault_receipts` | `ReadReceipt[]` — created automatically on upload (M4) |

`resetLocalData()` clears all three keys atomically. This is called by the "Reset local data" button on the dashboard.

---

## Read receipt pattern (M4)

Read receipts now bind to real `BlobRecord` identity. A receipt is created automatically after every successful upload (mock or testnet).

```
Upload form submit
  → buildEvidencePack() + buildBlobRecord()
  → addLocalPack() + addLocalBlob()
  → ReadReceipt constructed:
      id:               local-rr-{uuid}
      referencedBlobIds: [blob.id, ...]
      evidencePackIds:  [pack.id]
      receiptMode:      'local' | 'shelby-testnet'
  → addLocalReadReceipt()
  → Upload success screen shows link to /read-receipt/{receiptId}
```

The read receipt page uses `ReadReceiptClient` (`src/components/read-receipt-client.tsx`) — a client component that resolves receipts from demo data or localStorage in `useEffect`. This pattern parallels `BlobDetailClient` and `DashboardClient`.

```
/read-receipt/[id] (thin server shell)
  → ReadReceiptClient (client component)
      1. getReadReceiptById(id)      — checks demo data (rr-001 to rr-004)
      2. getLocalReadReceiptById(id) — checks localStorage
      3. Resolves referenced blobs and evidence packs from both sources
      4. Renders full identity surface per blob: shelbyRef, hash, source,
         accountAddress, blobName, network, storageStatus, explorerUrl, retrievalUrl
```

---

## Two-plane architecture

Shelby integration is planned against the official **testnet** endpoint family. Two distinct planes are kept separate in `config.ts`, `.env.example`, and docs:

- **Plane 1 — Shelby storage/RPC** (`SHELBY_NETWORK`, `SHELBY_RPC_URL`, `SHELBY_API_KEY`, `SHELBY_ACCOUNT_ADDRESS`, `SHELBY_BLOB_EXPIRATION_MICROS`): Shelby's own blob storage and API layer. Official testnet RPC: `https://api.testnet.shelby.xyz/shelby`
- **Plane 2 — Aptos coordination** (`APTOS_NETWORK=testnet`, `SHELBY_APTOS_FULLNODE_URL`, `SHELBY_INDEXER_URL`, etc.): The Aptos coordination layer for on-chain metadata, commitments, and payment. Official testnet fullnode: `https://api.testnet.aptoslabs.com/v1`.

---

## Data flow

### Read flow
```
Browser → Server Component → service.getX() → demo-data array → return to component
Browser → Client Component → useEffect → localStorage.getItem() → merge with demo data
```

### Write flow (mock)
```
Upload form
  → SHA-256 computed in-browser (Web Crypto API)
  → shelbyUploadAction(hash, size, metadata) [Server Action]
    → getAdapter() → mockShelbyAdapter.upload()
    → returns { shelbyRef, hash, timestamp }
  → buildEvidencePack() + buildBlobRecord() [lib/validation.ts]
  → addLocalPack() + addLocalBlob() [lib/store/local-store.ts]
  → ReadReceipt constructed → addLocalReadReceipt()
  → dashboard reads localStorage on next mount
```

### Write flow (testnet browser-wallet)
```
Upload form (testnet mode)
  → SHA-256 computed in-browser
  → useShelbyUpload().uploadBlob({ blobData, blobName, ... })
    → useUploadBlobs() mutateAsync({ signer, blobs, expirationMicros })
    → @shelby-protocol/react handles on-chain registration + RPC upload
    → returns void on success (transactionHash not available from React hook)
  → buildEvidencePack() + buildBlobRecord() [with real accountAddress, blobName, network]
  → addLocalPack() + addLocalBlob() + addLocalReadReceipt()
  → storageStatus: 'registered' (promote to 'ready' after RPC retrieval check)
```

---

## Design decisions

- **Server Components by default.** Dashboard, blob detail, and read receipt pages are thin server wrappers that delegate to client components for localStorage access.
- **Server Actions for mock upload.** `SHELBY_API_KEY` stays server-side. The browser never sees it.
- **Browser-wallet for testnet upload.** No server signer — the user's wallet extension signs transactions. No private key custody anywhere in the app.
- **Adapter isolation.** All Shelby-specific code is behind the `ShelbyAdapter` interface or the `useShelbyUpload` hook. Neither path touches the other's internals.
- **localStorage for demo persistence.** No server database is needed. Uploads, receipts, and blob records survive page refresh but are browser-specific.
- **Tailwind v4.** Uses CSS-first configuration (`@import "tailwindcss"` in globals.css). No `tailwind.config.js` needed.
- **Conservative status mapping.** `status-map.ts` defines `registered → ready → failed → unknown`. The React SDK hook returns `void` on success, so `storageStatus` is `registered` until a retrieval check confirms `ready`.
