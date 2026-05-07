# Shelby AI Evidence Vault

![M1 Status](https://img.shields.io/badge/milestone-M1%20Upload%20%2B%20Persistence-indigo?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

**A verifiable evidence storage and read-receipt demo for AI agents, built on Shelby testnet.**

---

## What is this?

Shelby AI Evidence Vault is a public demo showing how AI pipelines can store datasets, agent run outputs, and documents with:

- **Cryptographic blob references** — every file gets a `shelby://testnet/blob/{id}` reference and SHA-256 hash
- **Evidence packs** — structured groups of related blobs with metadata, tags, provenance, and status
- **Read receipts** — auditable records of agent queries: what was asked, what evidence was consulted, and what was answered
- **Working upload flow** — select files, compute SHA-256 in-browser, create evidence packs, persist locally

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Fonts | System fonts (no `next/font` dependency) |
| Demo data | Static mock data |
| Upload adapter | Mock (deterministic) / Testnet placeholder |
| Persistence | Browser localStorage (M1) |

---

## Quick start

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000
```

No environment variables required. Mock mode is the default — uploads work immediately with deterministic SHA-256-derived Shelby references.

---

## Environment variables

Copy `.env.example` to `.env.local` (never commit `.env.local`):

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|---|---|---|
| `SHELBY_MODE` | `mock` | Set to `testnet` to use the Shelby testnet adapter |
| `SHELBY_TESTNET_RPC_URL` | — | Testnet RPC endpoint (testnet mode only) |
| `SHELBY_API_KEY` | — | API key — **server-side only, never commit** |
| `SHELBY_ACCOUNT_ADDRESS` | — | Your Shelby testnet account address |

> **M1 note:** The real testnet adapter is a documented placeholder. `SHELBY_MODE=testnet` will show an error on upload until the SDK is wired in. Mock mode always works.

---

## Page overview

| Route | Description |
|---|---|
| `/` | Landing page — hero, problem/solution, demo objects, quickstart |
| `/dashboard` | Browse all evidence packs; shows built-in + uploaded local packs |
| `/upload` | Working upload form with SHA-256, file drop, mode indicator |
| `/blob/[id]` | Blob detail: Shelby ref, hash, source, metadata, data-source badge |
| `/read-receipt/[id]` | Read receipt: run ID, query, answer, blob/pack links |

---

## Architecture overview

```
src/
├── app/                     # Next.js App Router pages
│   ├── actions/upload.ts    # Server Action: shelbyUploadAction
│   ├── dashboard/           # Evidence pack browser (server → DashboardClient)
│   ├── upload/              # Full upload flow (client component)
│   ├── blob/[id]/           # Blob detail (server → BlobDetailClient)
│   └── read-receipt/[id]/   # Read receipt detail page
├── components/              # Shared UI components
│   ├── dashboard-client.tsx # Merges demo + localStorage packs
│   └── blob-detail-client.tsx # Resolves demo + localStorage blobs
└── lib/
    ├── demo-data/           # Static demo data (5 packs, 6 blobs, 4 receipts)
    ├── evidence/            # Service layer (reads demo-data)
    ├── shelby/              # Shelby adapter layer
    │   ├── adapter.ts       # Interface + types
    │   ├── config.ts        # Env var reader
    │   ├── mock-adapter.ts  # Deterministic mock
    │   ├── testnet-adapter.ts  # Testnet placeholder (M1)
    │   └── index.ts         # getAdapter() factory
    ├── store/
    │   └── local-store.ts   # Browser localStorage persistence
    └── validation.ts        # parseTags, isValidSHA256, buildEvidencePack, buildBlobRecord
```

---

## Validation utilities (`src/lib/validation.ts`)

No test framework is installed. Validation logic lives in `src/lib/validation.ts` and can be imported anywhere, including in Node.js test runners if added later.

| Utility | What it validates / builds |
|---|---|
| `parseTags(raw)` | Splits comma-separated tags, trims, lowercases, removes duplicates and empty entries |
| `isValidSHA256(hash)` | Returns `true` if the string matches `sha256:[0-9a-f]{64}` exactly |
| `buildEvidencePack(input)` | Constructs a new `EvidencePack` with `crypto.randomUUID()`-based ID; throws if title is empty |
| `buildBlobRecord(input)` | Constructs a new `BlobRecord`; throws if `hash` fails `isValidSHA256` check |

All four are pure functions with no side-effects. `buildEvidencePack` and `buildBlobRecord` call `crypto.randomUUID()`, which requires Node.js ≥ 19 or any modern browser (Chrome 92+, Firefox 95+, Safari 15.4+). Next.js 16 satisfies this requirement for both server-side and client-side usage.

---

## Demo data

Built-in demo data lives in `src/lib/demo-data/`:

- **`evidence-packs.ts`** — 5 evidence packs (dataset, agent-run, document, manifest)
- **`blobs.ts`** — 6 blobs with Shelby refs, hashes, MIME types, sizes
- **`read-receipts.ts`** — 4 read receipts with queries, answer summaries, blob/pack links

---

## M1 features

- Working file upload with SHA-256 computed in-browser (Web Crypto API)
- Dual-mode Shelby adapter: mock (deterministic) + testnet placeholder
- Evidence packs and blobs persisted to browser `localStorage`
- Dashboard shows built-in demo data + local uploaded packs (separated)
- Blob detail page resolves both demo and locally uploaded blobs
- Data-source badge on blob detail (Demo data / Local (mock) / Testnet upload)
- Reset local demo data button on dashboard
- Mode indicator on upload page (mock / testnet / misconfigured)
- `.env.example` with documented placeholders

---

## M1 limitations / M2 roadmap

### M1 (current)
- Real Shelby testnet upload is a documented placeholder — adapter will return an error when `SHELBY_MODE=testnet` until the real SDK is wired in
- File size capped at 5 MB per file for browser performance
- Uploads persist in `localStorage` only — browser-specific, not shared
- No authentication
- No search or filtering on the dashboard
- No read receipt generation from uploads

### M2 (planned backlog)
- Wire real Shelby SDK into `testnet-adapter.ts`
- Optional: server-side storage with SQLite for cross-browser persistence
- Search and filter on evidence packs
- Read receipt generation from live agent runs
- Agent run integration examples

---

## Security

- `SHELBY_API_KEY` is read exclusively in the Server Action (`src/app/actions/upload.ts`) — never exposed to the browser
- No `NEXT_PUBLIC_SHELBY_API_KEY` usage
- No secrets committed to this repository
- SHA-256 hashes are computed client-side — file contents never leave the browser in mock mode

---

## License

MIT
