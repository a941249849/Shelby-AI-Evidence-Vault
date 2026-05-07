# Architecture — Shelby AI Evidence Vault

## System overview

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│  /  /dashboard  /upload  /blob  /read-receipt│
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│             Next.js App Router               │
│  Server Components + 1 Client Component      │
│  (upload page uses useState)                 │
└──────┬──────────────────────┬───────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────────┐
│  components/│    │   lib/evidence/service  │
│  nav        │    │  getEvidencePacks()      │
│  badge      │    │  getBlobById()           │
│  pack-card  │    │  getReadReceiptById()    │
│  page-header│    └──────────┬──────────────┘
└─────────────┘               │
                    ┌─────────▼─────────────┐
                    │  lib/demo-data/ (M0)   │
                    │  evidence-packs.ts     │
                    │  blobs.ts              │
                    │  read-receipts.ts      │
                    └─────────┬─────────────┘
                              │ M1: replace with real Shelby calls
                    ┌─────────▼─────────────┐
                    │  lib/shelby/adapter   │
                    │  mockShelbyAdapter    │
                    │  (M1: realShelbyAdapter)│
                    └───────────────────────┘
```

---

## Directory structure

```
src/
├── app/
│   ├── layout.tsx              Root layout: Nav, footer, fonts
│   ├── globals.css             Tailwind + custom utilities
│   ├── page.tsx                Landing page (server component)
│   ├── dashboard/
│   │   └── page.tsx            Evidence pack browser
│   ├── upload/
│   │   └── page.tsx            Upload form (client component)
│   ├── blob/
│   │   └── [id]/
│   │       └── page.tsx        Blob detail (server component)
│   └── read-receipt/
│       └── [id]/
│           └── page.tsx        Read receipt detail
├── components/
│   ├── nav.tsx                 Top navigation bar
│   ├── badge.tsx               Generic pill badge
│   ├── status-badge.tsx        Evidence pack status badge
│   ├── evidence-pack-card.tsx  Card for an evidence pack
│   └── page-header.tsx         Page title + subtitle
└── lib/
    ├── demo-data/
    │   ├── evidence-packs.ts   5 mock evidence packs + EvidencePack type
    │   ├── blobs.ts            6 mock blobs + BlobRecord type
    │   ├── read-receipts.ts    4 mock read receipts + ReadReceipt type
    │   └── index.ts            Re-exports all
    ├── evidence/
    │   ├── types.ts            Re-exports types from demo-data
    │   └── service.ts          Service functions (read from demo-data)
    └── shelby/
        ├── adapter.ts          ShelbyAdapter interface + mockShelbyAdapter
        └── index.ts            Re-exports adapter
```

---

## Service layer pattern

All data access goes through `src/lib/evidence/service.ts`. UI pages import service functions, never demo-data directly (except the landing page which uses the data array for convenience).

```ts
// pages use service:
import { getEvidencePacks, getBlobById } from '@/lib/evidence/service';

// service reads from demo-data (M0) or will call real storage (M1):
import { evidencePacks, blobs, readReceipts } from '../demo-data';
```

This pattern means the UI never changes when the data source changes in M1.

---

## Shelby adapter pattern

`src/lib/shelby/adapter.ts` defines:

```ts
interface ShelbyAdapter {
  upload(data: unknown, metadata: Record<string, string>): Promise<ShelbyUploadResult>;
  getBlobRef(id: string): string;
  isConnected(): boolean;
}
```

**M0:** `mockShelbyAdapter` — returns fake refs, `isConnected()` returns `false`.

**M1:** A `realShelbyAdapter` will implement the same interface with actual HTTP calls to Shelby testnet. The service layer will swap in the real adapter with no UI changes.

---

## Data flow

### Read flow (M0)
```
Browser → Server Component → service.getX() → demo-data array → return to component
```

### Write flow (M0 — mocked)
```
Upload form → submit (disabled) → would call service.createPack() 
→ service calls shelbyAdapter.upload() → mockShelbyAdapter returns fake ref
```

### Write flow (M1 — planned)
```
Upload form → submit → service.createPack(data) 
→ shelbyAdapter.upload(file, metadata) → Shelby testnet HTTP → real shelbyRef + hash
→ service stores pack + blob in local index
→ UI shows new pack immediately
```

---

## Design decisions

- **Server Components by default.** Only the upload form is a client component (needs `useState`).
- **No ORM/DB in M0.** Static TypeScript arrays are the "database". Simple, reproducible, no setup.
- **Adapter isolation.** All Shelby-specific code is behind the `ShelbyAdapter` interface. Zero blast radius when switching from mock to real.
- **Tailwind v4.** Uses CSS-first configuration (`@import "tailwindcss"` in globals.css). No `tailwind.config.js` needed.
