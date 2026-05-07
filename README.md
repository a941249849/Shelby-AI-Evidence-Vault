# Shelby AI Evidence Vault

![M1B Status](https://img.shields.io/badge/milestone-M1B%20Local%20Demo%20%2B%20Future--correct%20Adapter-indigo?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

**A verifiable evidence storage and read-receipt demo for AI agents. M1B: local mock upload with a future-correct Shelby adapter boundary. Real Shelby testnet upload is blocked until M2.**

---

## What is this?

Shelby AI Evidence Vault is a public demo showing how AI pipelines can store datasets, agent run outputs, and documents with:

- **Cryptographic blob references** — every file gets a SHA-256 hash and a `shelby://mock/blob/{id}` local mock reference in M1B; real Shelby registration is M2+
- **Evidence packs** — structured groups of related blobs with metadata, tags, provenance, and status
- **Read receipts** — auditable records of agent queries: what was asked, what evidence was consulted, and what was answered
- **Working local upload flow** — select files, compute SHA-256 in-browser, create evidence packs, persist to `localStorage` — no wallet signing, no network calls in M1B

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Fonts | System fonts (no `next/font` dependency) |
| Demo data | Static mock data |
| Upload adapter | Mock (deterministic `shelby://mock/blob/`) / Testnet blocked until M2 |
| Persistence | Browser localStorage (M1B) |

---

## Quick start

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000
```

No environment variables required. Mock mode is the default — uploads work immediately with deterministic SHA-256-derived local mock references (`shelby://mock/blob/{id}`). Real Shelby upload is blocked until M2.

---

## Environment variables

Copy `.env.example` to `.env.local` (never commit `.env.local`):

```bash
cp .env.example .env.local
```

Shelby integration spans two distinct planes. See `.env.example` for full comments.

**Plane 1 — Shelby storage / RPC plane (shelbynet)**

| Variable | Default | Description |
|---|---|---|
| `SHELBY_MODE` | `mock` | Set to `testnet` to see the blocked-until-M2 error message |
| `SHELBY_NETWORK` | `shelbynet` | Shelby network name — use `shelbynet` for Shelby operations |
| `SHELBY_RPC_URL` | — | Shelby blob API endpoint — `https://api.shelbynet.shelby.xyz/shelby` |
| `SHELBY_API_KEY` | — | Shelby API key — **server-side only, never commit** |
| `SHELBY_ACCOUNT_ADDRESS` | — | Your Shelby account address on shelbynet |
| `SHELBY_BLOB_EXPIRATION_MICROS` | — | Blob expiration (microseconds) required for real uploads (M2+) |

**Plane 2 — Shelbynet / Aptos coordination plane** (documented for M2+, not consumed in M1B)

| Variable | Default | Description |
|---|---|---|
| `APTOS_NETWORK` | `shelbynet` | Must be `shelbynet` — not generic Aptos testnet |
| `SHELBYNET_APTOS_FULLNODE_URL` | — | Shelbynet Aptos fullnode — `https://api.shelbynet.shelby.xyz/v1` |
| `SHELBYNET_INDEXER_URL` | — | Shelbynet indexer — `https://api.shelbynet.shelby.xyz/v1/graphql` |
| `SHELBYNET_FAUCET_URL` | — | Shelbynet faucet for test account funding |
| `SHELBYNET_ACCOUNT_ADDRESS` | — | Your Aptos account address on shelbynet |

> **M1B note:** Real Shelby upload is not implemented. `SHELBY_MODE=testnet` shows a "blocked until M2" error on any upload attempt. Mock mode always works with zero env vars. Wallet signing, APT gas funding, and ShelbyUSD/SHEL token requirements are M2+ prerequisites. Contract address and network details must be verified at M2 implementation time.

---

## Page overview

| Route | Description |
|---|---|
| `/` | Landing page — hero, problem/solution, demo objects, quickstart |
| `/dashboard` | Browse all evidence packs; shows built-in + uploaded local packs |
| `/upload` | Local demo upload form with SHA-256, file drop, mode indicator |
| `/blob/[id]` | Blob detail: mock/real ref, hash, source, metadata, data-source badge |
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
    │   ├── testnet-adapter.ts  # Testnet placeholder blocked until M2
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

## M1B features

- Working local demo file upload with SHA-256 computed in-browser (Web Crypto API)
- Dual-mode Shelby adapter: mock (deterministic `shelby://mock/blob/`) + testnet blocked until M2
- Evidence packs and blobs persisted to browser `localStorage`
- Dashboard shows built-in demo data + local uploaded packs (separated)
- Blob detail page resolves both demo and locally uploaded blobs
- Data-source badge on blob detail (Demo data / Local demo upload / Real Shelby upload blocked until M2)
- Reset local demo data button on dashboard
- Mode indicator on upload page (local demo / testnet blocked)
- Future-compatible blob model with M2+ fields (blobName, accountAddress, mockRef, network, etc.)
- `.env.example` with documented placeholders for Shelby RPC + shelbynet coordination planes

---

## M1B limitations / M2 roadmap

### M1B (current)
- Real Shelby testnet upload is blocked — adapter returns a clear error when `SHELBY_MODE=testnet`
- Mock refs (`shelby://mock/blob/{id}`) are local demo identifiers only — not real Shelby blob identities
- File size capped at 5 MB per file for browser performance
- Uploads persist in `localStorage` only — browser-specific, not shared
- No wallet signing, no network calls, no APT/ShelbyUSD requirements in M1B
- No authentication
- No search or filtering on the dashboard
- No read receipt generation from uploads

### M2 (planned backlog)
- Wire real Shelby SDK (`@shelby-protocol/sdk`) into `testnet-adapter.ts`
- Verify contract address and network details against official Shelby docs
- Implement wallet/signer design (server-side funded account or secure wallet integration)
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
- No private keys, seed phrases, or mnemonic phrases anywhere in the codebase
- Real Shelby upload signing is a M2+ security design decision — see `testnet-adapter.ts`

---

## License

MIT
