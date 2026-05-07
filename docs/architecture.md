# Architecture — Shelby AI Evidence Vault

## System overview

```
┌─────────────────────────────────────────────────────┐
│                       Browser                        │
│  /  /dashboard  /upload  /blob  /read-receipt        │
│  localStorage: uploaded packs + blobs (M1)           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / Server Actions
┌──────────────────────▼──────────────────────────────┐
│                Next.js App Router                     │
│  Server Components + Client Components               │
│  Server Actions: upload.ts (shelbyUploadAction)      │
└──────┬────────────────────────────┬─────────────────┘
       │                            │
┌──────▼──────┐         ┌──────────▼──────────────────┐
│ components/ │         │   lib/evidence/service       │
│  nav        │         │  getEvidencePacks()          │
│  badge      │         │  getBlobById()               │
│  pack-card  │         │  getReadReceiptById()        │
│  page-header│         └──────────┬──────────────────┘
│  dashboard- │                    │
│   client    │         ┌──────────▼──────────────────┐
│  blob-      │         │  lib/demo-data/             │
│   detail-   │         │  evidence-packs.ts          │
│   client    │         │  blobs.ts                   │
└─────────────┘         │  read-receipts.ts           │
                        └──────────┬──────────────────┘
                                   │ upload writes via
                        ┌──────────▼──────────────────┐
                        │  lib/shelby/                │
                        │  adapter.ts   (interface)   │
                        │  config.ts    (env vars)    │
                        │  mock-adapter.ts            │
                        │  testnet-adapter.ts         │
                        │  index.ts     (getAdapter)  │
                        └─────────────────────────────┘
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
│   │   └── upload.ts           Server Action: shelbyUploadAction
│   ├── dashboard/
│   │   └── page.tsx            Server component → DashboardClient
│   ├── upload/
│   │   └── page.tsx            Full upload flow (client component)
│   ├── blob/
│   │   └── [id]/
│   │       └── page.tsx        Server component → BlobDetailClient
│   └── read-receipt/
│       └── [id]/
│           └── page.tsx        Read receipt detail
├── components/
│   ├── nav.tsx                 Top navigation bar
│   ├── badge.tsx               Generic pill badge
│   ├── status-badge.tsx        Evidence pack status badge
│   ├── evidence-pack-card.tsx  Card for an evidence pack
│   ├── page-header.tsx         Page title + subtitle
│   ├── dashboard-client.tsx    Client: merges demo + localStorage packs
│   └── blob-detail-client.tsx  Client: resolves demo + localStorage blobs
└── lib/
    ├── demo-data/
    │   ├── evidence-packs.ts   5 demo packs + EvidencePack type
    │   ├── blobs.ts            6 demo blobs + BlobRecord type
    │   ├── read-receipts.ts    4 demo read receipts + ReadReceipt type
    │   └── index.ts            Re-exports all
    ├── evidence/
    │   ├── types.ts            Re-exports types from demo-data
    │   └── service.ts          Service functions (read from demo-data)
    ├── shelby/
    │   ├── adapter.ts          ShelbyAdapter interface + payload/result types
    │   ├── config.ts           getShelbyConfig() — reads SHELBY_MODE etc.
    │   ├── mock-adapter.ts     Deterministic mock adapter
    │   ├── testnet-adapter.ts  Testnet adapter (M1 placeholder)
    │   └── index.ts            getAdapter() factory + re-exports
    ├── store/
    │   └── local-store.ts      Browser localStorage for uploaded packs/blobs
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

For uploaded data (M1), client components read directly from `lib/store/local-store.ts` after hydration.

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

**Mock:** `mockShelbyAdapter` — derives `shelby://` ref from content hash; deterministic; no network calls.

**Testnet (M1 placeholder):** `createTestnetAdapter()` — always throws with an actionable error message describing how to implement the real SDK calls (M2+).

`getAdapter()` in `index.ts` reads `process.env.SHELBY_MODE` and returns the appropriate adapter. It must only be called from server-side code.

---

## Data flow

### Read flow
```
Browser → Server Component → service.getX() → demo-data array → return to component
Browser → Client Component → useEffect → localStorage.getItem() → merge with demo data
```

### Write flow (M1)
```
Upload form
  → SHA-256 computed in-browser (Web Crypto API)
  → shelbyUploadAction(hash, size, metadata) [Server Action]
    → getAdapter() → mockShelbyAdapter.upload()
    → returns { shelbyRef, hash, timestamp }
  → buildEvidencePack() + buildBlobRecord() [lib/validation.ts]
  → addLocalPack() + addLocalBlob() [lib/store/local-store.ts]
  → dashboard reads localStorage on next mount
```

---

## Design decisions

- **Server Components by default.** Dashboard and blob detail pages are server components that delegate to client components only for localStorage access.
- **Server Actions for uploads.** `SHELBY_API_KEY` stays server-side. The browser never sees it.
- **Adapter isolation.** All Shelby-specific code is behind the `ShelbyAdapter` interface. The real SDK can be wired in `testnet-adapter.ts` without touching any other layer.
- **localStorage for M1.** No server database is needed for the demo. Uploads survive page refresh but are browser-specific.
- **Tailwind v4.** Uses CSS-first configuration (`@import "tailwindcss"` in globals.css). No `tailwind.config.js` needed.

