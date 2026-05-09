# Architecture — Shelby AI Evidence Vault

## System overview

```
┌──────────────────────────────────────────────────────────────────┐
│                            Browser                                │
│  /  /testnet  /dashboard  /upload  /blob  /read-receipt            │
│  localStorage: packs + blobs + receipts (M1/M4 — fallback)       │
│  Browser wallet: Aptos wallet extension (testnet mode only)       │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP / Server Actions
┌──────────────────────▼───────────────────────────────────────────┐
│                   Next.js App Router                              │
│  Server Components + Client Components                            │
│  Server Actions: upload.ts    (shelbyUploadAction — mock path)   │
│                  persist.ts   (persistUploadAction — C7 SQLite)  │
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
                         └─────────────┬──────────────────────────┘
                                       │ C7: persist after upload
                         ┌─────────────▼──────────────────────────┐
                         │  lib/server/  (server-only — C7)        │
                         │  db.ts             SQLite init/schema   │
                         │  evidence-store.ts CRUD helpers         │
                         └────────────────────────────────────────┘
                                       │
                         ┌─────────────▼──────────────────────────┐
                         │  data/shelby-vault.sqlite               │
                         │  (gitignored runtime file)              │
                         │  Override: SHELBY_DB_PATH env var       │
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
│   │   ├── upload.ts           Server Action: shelbyUploadAction + getShelbyModeAction
│   │   └── persist.ts          Server Actions: persistUploadAction + getPersistedX (C7)
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
│   ├── dashboard-client.tsx    Client: merges demo + browser cache + SQLite packs; C10 search/filter/sort
│   ├── blob-detail-client.tsx  Client: resolves demo / localStorage / SQLite blobs
│   └── read-receipt-client.tsx Client: resolves receipts from demo / localStorage / SQLite
└── lib/
    ├── demo-data/
    │   ├── evidence-packs.ts   5 demo packs + EvidencePack type
    │   ├── blobs.ts            6 demo blobs + BlobRecord type
    │   ├── read-receipts.ts    4 demo read receipts + ReadReceipt type (receiptMode field added M4)
    │   └── index.ts            Re-exports all
    ├── evidence/
    │   ├── types.ts            Re-exports types from demo-data
    │   └── service.ts          Service functions (read from demo-data)
    ├── server/                 Server-only SQLite persistence layer (C7)
    │   ├── db.ts               SQLite connection + schema init (better-sqlite3)
    │   └── evidence-store.ts   CRUD helpers: insertPack/Blob/Receipt + getters
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
    │   └── local-store.ts      Browser localStorage: packs, blobs, and receipts (fallback)
    ├── validation.ts           parseTags, isValidSHA256, buildEvidencePack, buildBlobRecord
    └── utils.ts                formatBytes, formatDate, formatDateTime

data/
└── shelby-vault.sqlite         SQLite database (gitignored, created at runtime)
                                Override path: SHELBY_DB_PATH env var

fixtures/
└── c8-agent-input.json         Public synthetic AI benchmark data (C8 agent-run input fixture)

scripts/
├── shelby-smoke.mjs                C3: opt-in Shelby testnet smoke harness
├── generate-agent-run.mjs          C8: deterministic agent-run example script
├── verify-community-demo.mjs       C9: zero-credential verification harness (35 assertions)
├── shelby-doctor.mjs               C11: zero-secret readiness doctor (mock + testnet config validation)
└── verify-release-candidate.mjs    C12: release-candidate acceptance harness (build + routes + doctor)

artifacts/
└── release-candidate/
    └── latest.json                 Machine-readable RC verification result (gitignored, runtime artifact)
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
testnet/page.tsx
  → UploadProviders
  → TestnetPageClient wallet readiness panel
      → useWallet() [@aptos-labs/wallet-adapter-react]
      → shows detected wallets, connected account, and Aptos Testnet status

upload/page.tsx (client component)
  → UploadProviders
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

The browser-wallet path is wrapped in `UploadProviders` (`src/app/upload/providers.tsx`), which sets up `QueryClientProvider` and `AptosWalletAdapterProvider`. The provider is used by `/testnet` for wallet readiness and by `/upload` for real Shelby upload signing.

---

## localStorage persistence (M1/M4 — fallback layer)

All three data types are persisted to browser localStorage as a compatibility/fallback layer:

| Key | Content |
|---|---|
| `shelby_vault_packs` | `EvidencePack[]` — local uploads |
| `shelby_vault_blobs` | `BlobRecord[]` — local uploads |
| `shelby_vault_receipts` | `ReadReceipt[]` — created automatically on upload (M4) |

`resetLocalData()` clears the browser-cache keys atomically. This is called by the "Reset browser cache" button on the dashboard. SQLite-persisted records remain until the local database files are removed.

Existing localStorage records continue to work unchanged. The SQLite layer (C7) is the primary cross-session persistence path; localStorage is retained as a low-latency in-browser fallback.

---

## SQLite persistence (C7)

After every successful upload (mock or testnet), `persistUploadAction` writes the pack, blob records, and read receipt to a local SQLite database via `better-sqlite3`.

**Database path:**
- Default: `data/shelby-vault.sqlite` (relative to project root, gitignored)
- Override: `SHELBY_DB_PATH` environment variable

**Schema:**
```sql
evidence_packs   (id PK, created_at, payload JSON)
blob_records     (id PK, evidence_pack_id INDEX, created_at, payload JSON)
read_receipts    (id PK, created_at, payload JSON)
```

The `payload` column stores the complete typed object as JSON so future model-field additions do not require schema migrations.

**Access pattern (C7 lookup chain):**

| Page | Lookup order |
|---|---|
| Dashboard | demo data (server) + localStorage (client) + SQLite via `getPersistedPacksAction` |
| Blob detail | demo data → localStorage → SQLite via `getPersistedBlobAction` |
| Read receipt | demo data → localStorage → SQLite via `getPersistedReceiptAction` (blobs resolved similarly) |

SQLite failures are non-fatal — the app degrades gracefully to localStorage-only mode.

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
  → persistUploadAction(pack, blobs, receipt) [SQLite — C7]
  → Upload success screen shows link to /read-receipt/{receiptId}
```

The read receipt page uses `ReadReceiptClient` (`src/components/read-receipt-client.tsx`) — a client component that resolves receipts from demo data, localStorage, or SQLite in `useEffect`. This pattern parallels `BlobDetailClient` and `DashboardClient`.

```
/read-receipt/[id] (thin server shell)
  → ReadReceiptClient (client component)
      1. getReadReceiptById(id)             — checks demo data (rr-001 to rr-004)
      2. getLocalReadReceiptById(id)        — checks localStorage
      3. getPersistedReceiptAction(id)      — checks SQLite (C7)
      4. Resolves referenced blobs: localStorage → demo → SQLite
      5. Renders full identity surface per blob: shelbyRef, hash, source,
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
Browser → Client Component → useEffect:
  1. Check demo-data (static arrays)
  2. Check localStorage (browser)
  3. Call SQLite Server Action (cross-session, survives localStorage reset)
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
  → persistUploadAction(pack, blobs, receipt) [SQLite — C7]
  → dashboard reads localStorage + SQLite on next mount
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
  → persistUploadAction(pack, blobs, receipt) [SQLite — C7]
  → storageStatus: 'registered' (promote to 'ready' after RPC retrieval check)
```

### Write flow (C8 agent-run script)
```
npm run generate-agent-run
  → reads fixtures/c8-agent-input.json (static public fixture)
  → SHA-256 hash computed in Node.js (crypto.createHash)
  → deterministic analysis output generated (no LLM — pure computation)
  → SHA-256 hash computed for output artifact
  → EvidencePack built    (category: agent-run, id: c8-pack-agent-sentinel-v1)
  → BlobRecord (input)    (id: c8-blob-input-v1,  shelbyRef: shelby://mock/blob/{hash-prefix})
  → BlobRecord (output)   (id: c8-blob-output-v1, shelbyRef: shelby://mock/blob/{hash-prefix})
  → ReadReceipt built     (id: c8-rr-agent-sentinel-v1, receiptMode: 'local')
  → All three persisted to SQLite via INSERT OR REPLACE (idempotent)
  → /read-receipt/c8-rr-agent-sentinel-v1 resolves via SQLite path in ReadReceiptClient
  → /dashboard shows c8-pack-agent-sentinel-v1 in the local/SQLite user-created evidence section
  → evidence card can deep-link to /blob/c8-blob-input-v1
```

### Verification flow (C9 harness)
```
npm run verify-community-demo
  → creates isolated temp SQLite database (OS tmpdir)
  → runs scripts/generate-agent-run.mjs [pass 1] (SHELBY_DB_PATH=<tmp>)
  → asserts: 1 pack, 2 blobs, 1 receipt — correct IDs and payload fields
  → asserts: blob→pack references, receipt→blob and receipt→pack references
  → runs scripts/generate-agent-run.mjs [pass 2 — idempotency]
  → asserts: row counts unchanged, payloads bit-for-bit identical
  → removes temp database
  → exits 0 on success, 1 on any assertion failure
```

### Dashboard read flow (C10 search/filter/sort)
```
/dashboard (DashboardClient — client component)
  → useEffect: loads localPacks (localStorage) + persistedPacks (SQLite via getPersistedPacksAction)
  → loads persistedBlobs for SQLite packs via getPersistedBlobsByPackAction
  → merges: allUserPacks = [localPacks..., dedupedPersistedPacks...]
  → merges: allPacks = [allUserPacks..., demoPacks...]
  → builds primaryBlobByPackId from demo, browser-local, and SQLite BlobRecord sources
  → search state: searchQuery, filterCategory, filterSourceType, filterStatus, filterDataSource, sortBy
  → applyFilters(packs): text search across title/description/category/sourceType/status/tags/dataSource
                          then category/sourceType/status/dataSource dropdown filters
                          then sortPacks() by selected sort key
  → filteredUserPacks = applyFilters(allUserPacks)
  → filteredDemoPacks = applyFilters(demoPacks)
  → local/SQLite user-created evidence section: visible when filteredUserPacks.length > 0 OR (no filter active AND allUserPacks.length > 0)
  → "Demo evidence" section: visible when filteredDemoPacks.length > 0 OR no filter active
  → card CTA opens the first Blob provenance page when a BlobRecord is available
  → empty state: shown when filter is active AND totalFiltered === 0
  → "Clear filters" button: resets all state to defaults; also shown in empty state as "Reset filters"
  → Metric bar "Packs indexed": shows "N / total" when filtered
  → Section count label: shows "N / total shown" when filtered
```

---

## Design decisions

- **Server Components by default.** Dashboard, blob detail, and read receipt pages are thin server wrappers that delegate to client components for localStorage access.
- **Server Actions for mock upload.** `SHELBY_API_KEY` stays server-side. The browser never sees it.
- **Browser-wallet for testnet upload.** No server signer — the user's wallet extension signs transactions. No private key custody anywhere in the app.
- **Adapter isolation.** All Shelby-specific code is behind the `ShelbyAdapter` interface or the `useShelbyUpload` hook. Neither path touches the other's internals.
- **SQLite plus browser cache for local persistence.** The local SQLite store is the durable source for generated and uploaded records. Browser localStorage remains a client-side cache/fallback for demo ergonomics and resettable browser state.
- **Tailwind v4.** Uses CSS-first configuration (`@import "tailwindcss"` in globals.css). No `tailwind.config.js` needed.
- **Conservative status mapping.** `status-map.ts` defines `registered → ready → failed → unknown`. The React SDK hook returns `void` on success, so `storageStatus` is `registered` until a retrieval check confirms `ready`.
- **C8 deterministic script.** `scripts/generate-agent-run.mjs` is the canonical agent-run example — runs with zero credentials, uses `better-sqlite3` directly (same schema as `lib/server/db.ts`), and is idempotent via `INSERT OR REPLACE`. Stable IDs (`c8-*`) ensure the generated receipt URL is predictable.
- **C10/X6 client-side search/filter/sort and evidence-card deep links.** Search, filter, and sort logic in `DashboardClient` is pure client-side state. `useMemo` wraps filter/sort computation and Blob deep-link lookup so it only recomputes when inputs change. Sorting uses `localeCompare` for deterministic, locale-aware ordering. The local/SQLite user-created evidence and built-in corpus section split is preserved; sections become invisible only when their filtered result set is empty. Evidence cards use localized category/source/status labels and open the first Blob provenance page when a BlobRecord is available.
