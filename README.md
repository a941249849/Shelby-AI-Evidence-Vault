# Shelby AI Evidence Vault

![Milestone](https://img.shields.io/badge/milestone-X3%20Product%20Closeout-violet?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

**An AI evidence and read-receipt layer built for Shelby: evidence packs, Shelby Blob identity, and auditable receipts for agent workflows. Local mock is a zero-credential preview path; Shelby testnet is the real protocol proof path.**

---

## What is this?

Shelby AI Evidence Vault is a Shelby ecosystem application layer for AI provenance. It shows how datasets, agent outputs, and documents can become verifiable evidence records instead of loose files:

- **Cryptographic blob references** — every file gets a SHA-256 hash and a Shelby reference (`shelby://mock/blob/{id}` in local mode, `shelby://testnet/{account}/{blobName}` in testnet mode)
- **Evidence packs** — structured groups of related blobs with metadata, tags, provenance, and status
- **Read receipts** — auditable records of agent activity: what was uploaded, what evidence was consulted, and what was answered; bound to real `BlobRecord` identity
- **Local/mock preview flow** — SHA-256 computed in-browser, evidence packs and receipts persisted locally, no wallet or API keys required; this is a community preview and development fallback, not the product endpoint
- **Browser-wallet Shelby testnet path** — a testnet upload path is available behind a `SHELBY_MODE=testnet` gate using `@shelby-protocol/react`; requires operator prerequisites (funded Aptos testnet wallet, Shelby storage credits) and manual verification — no automated CI upload
- **Opt-in smoke harness** — `npm run smoke` verifies Shelby RPC connectivity and retrieval for a blob uploaded via the browser wallet path
- **Release-candidate gate** — `npm run verify-release-candidate` verifies the zero-credential product loop, build, and key routes in one command
- **Shelby-first product UI** — Chinese-first, English-toggleable product surface across landing, registry, upload, Blob detail, and read receipt pages

---

## Modes at a glance

| Mode | How to activate | What it does |
|---|---|---|
| **Local mock (default)** | No env vars needed | Zero-credential preview: SHA-256 in-browser, `shelby://mock/blob/{id}` refs, local persistence, read receipt created automatically |
| **Testnet browser-wallet** | `SHELBY_MODE=testnet` + `NEXT_PUBLIC_SHELBY_NETWORK=testnet` + funded Aptos wallet | Real Shelby testnet upload via `@shelby-protocol/react` hook + browser wallet signing; requires operator prerequisites |
| **Smoke harness** | `SHELBY_SMOKE=true` + `SHELBY_RPC_URL` + optional prior-upload address/blobName | Validates config, checks RPC connectivity, and verifies retrieval of a previously uploaded blob |

> **Security boundary:** No private keys, no server signer, no real LLM calls, no production database, no trading or marketplace features. `SHELBY_API_KEY` stays server-side only. Browser wallet signing is handled by the user's wallet extension — the app never has custody of signing material.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Fonts | System fonts |
| Demo data | Static mock data (5 packs, 6 blobs, 4 receipts) |
| Upload adapter | Mock (default) / Shelby testnet browser-wallet path |
| Shelby SDK | `@shelby-protocol/sdk` + `@shelby-protocol/react` |
| Wallet adapter | `@aptos-labs/wallet-adapter-react` |
| Persistence | Local SQLite (server-side records) + browser localStorage fallback/cache |

---

## Quick start

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000
```

No environment variables required. Mock mode is the default preview path — uploads work immediately with deterministic SHA-256-derived local mock references (`shelby://mock/blob/{id}`). Real Shelby proof uses the testnet browser-wallet mode.

---

## Verification commands

```bash
npm run lint                    # ESLint check — must pass before any PR
npm run build                   # Next.js production build — must pass
npm run shelby-doctor           # C11: mock-mode readiness check (zero credentials, always passes)
npm run verify-community-demo   # C9: 35 DB-level assertions, zero credentials
npm run verify-release-candidate # C12: full release-candidate gate (build + routes + doctor)
npm run smoke                   # Opt-in Shelby testnet smoke harness (requires SHELBY_SMOKE=true)
```

The `verify-release-candidate` command (C12) is the one-command release-candidate gate. It runs from a clean checkout with zero Shelby credentials. See `docs/release-candidate-checklist.md` for the full checklist.

---

## Environment variables

Copy `.env.example` to `.env.local` (never commit `.env.local`):

```bash
cp .env.example .env.local
```

Shelby integration spans two distinct planes plus browser-side public config. See `.env.example` for full comments.

**Plane 1 — Shelby storage / RPC plane (server-side)**

| Variable | Default | Description |
|---|---|---|
| `SHELBY_MODE` | `mock` | `mock` = local demo; `testnet` = browser-wallet Shelby testnet upload |
| `SHELBY_NETWORK` | `testnet` | Shelby network name |
| `SHELBY_RPC_URL` | — | Shelby blob API endpoint — `https://api.testnet.shelby.xyz/shelby` |
| `SHELBY_API_KEY` | — | Shelby API key — **server-side only, never commit** |
| `SHELBY_ACCOUNT_ADDRESS` | — | Your Shelby account address on the selected network |
| `SHELBY_BLOB_EXPIRATION_MICROS` | — | Blob expiration (microseconds) required for real uploads |

**Plane 2 — Aptos coordination plane (server-side)**

| Variable | Default | Description |
|---|---|---|
| `APTOS_NETWORK` | `testnet` | Aptos network for the current Shelby testnet target |
| `SHELBY_APTOS_FULLNODE_URL` | — | Aptos testnet fullnode — `https://api.testnet.aptoslabs.com/v1` |
| `SHELBY_INDEXER_URL` | — | Aptos testnet indexer — `https://api.testnet.aptoslabs.com/v1/graphql` |
| `SHELBY_FAUCET_URL` | — | Faucet/funding URL, if documented for the selected network |
| `SHELBY_COORDINATION_ACCOUNT_ADDRESS` | — | Your Aptos coordination account address |

**Browser-side (NEXT_PUBLIC_) config — no secrets here**

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SHELBY_NETWORK` | `testnet` | Shelby network for browser wallet path |
| `NEXT_PUBLIC_SHELBY_RPC_URL` | — | Optional RPC override for browser SDK |
| `NEXT_PUBLIC_SHELBY_INDEXER_URL` | — | Optional indexer override for browser SDK |
| `NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS` | `24` | Blob lifetime in hours for browser wallet uploads |

**Smoke harness (opt-in)**

| Variable | Default | Description |
|---|---|---|
| `SHELBY_SMOKE` | `false` | Set to `true` to enable smoke script |
| `SHELBY_SMOKE_ACCOUNT_ADDRESS` | — | Aptos account address from a prior manual upload |
| `SHELBY_SMOKE_BLOB_NAME` | — | Shelby blob name from a prior manual upload |

> **Testnet operator prerequisites:** Real Shelby testnet upload requires a connected Aptos browser wallet (e.g. Petra), testnet APT for gas fees, and Shelby storage credits (ShelbyUSD or SHEL). CI does not perform real uploads — the browser-wallet path requires an interactive browser session. See `docs/c3-smoke-test-guide.md` for manual verification steps.

---

## Page overview

| Route | Description |
|---|---|
| `/` | Product home — Chinese-first Shelby ecosystem narrative, evidence flow, core capabilities, preview cards |
| `/dashboard` | Evidence registry: browse, search, and filter built-in, local, SQLite, and testnet records |
| `/upload` | Evidence intake: create Evidence Packs, compute SHA-256, drop files, show mode boundary and wallet connect in testnet mode |
| `/blob/[id]` | Blob provenance inspector: Shelby ref, hash, source, metadata, data-source badge |
| `/read-receipt/[id]` | Read receipt: run ID, query, answer, resolved Blob identity and pack links |

---

## Architecture overview

```
src/
├── app/                          # Next.js App Router pages
│   ├── actions/upload.ts         # Server Action: shelbyUploadAction (API key stays server-side)
│   ├── actions/persist.ts        # Server Actions: SQLite persistence for packs/blobs/receipts
│   ├── dashboard/                # Evidence registry (server → DashboardClient)
│   ├── upload/
│   │   ├── page.tsx              # Full upload flow (client component — mock + testnet paths)
│   │   └── providers.tsx         # QueryClient + AptosWalletAdapterProvider (testnet path)
│   ├── blob/[id]/                # Blob detail (server → BlobDetailClient)
│   └── read-receipt/[id]/        # Thin server shell → ReadReceiptClient
├── components/                   # Shared UI components
│   ├── dashboard-client.tsx      # Merges demo + localStorage + SQLite packs
│   ├── blob-detail-client.tsx    # Resolves demo + localStorage + SQLite blobs
│   └── read-receipt-client.tsx   # Resolves receipts from demo/local/SQLite data
└── lib/
    ├── demo-data/                # Static demo data (5 packs, 6 blobs, 4 receipts)
    ├── evidence/                 # Service layer (reads demo-data)
    ├── shelby/                   # Shelby adapter + browser-wallet layer
    │   ├── adapter.ts            # ShelbyAdapter interface + types
    │   ├── config.ts             # Env var reader (server-side)
    │   ├── mock-adapter.ts       # Deterministic mock (shelby://mock/blob/{id})
    │   ├── testnet-adapter.ts    # Legacy server-side testnet placeholder
    │   ├── browser-client.ts     # Browser-side Shelby client (NEXT_PUBLIC_ vars only)
    │   ├── use-shelby-upload.ts  # React hook: browser wallet + useUploadBlobs
    │   ├── status-map.ts         # Conservative evidence storage status utilities
    │   └── index.ts              # getAdapter() factory
    ├── store/
    │   └── local-store.ts        # localStorage: packs, blobs, and receipts
    ├── server/
    │   ├── db.ts                 # SQLite schema and connection
    │   └── evidence-store.ts     # Server-side pack/blob/receipt CRUD
    └── validation.ts             # parseTags, isValidSHA256, buildEvidencePack, buildBlobRecord
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

---

## Demo data

Built-in demo data lives in `src/lib/demo-data/`:

- **`evidence-packs.ts`** — 5 evidence packs (dataset, agent-run, document, manifest)
- **`blobs.ts`** — 6 blobs with Shelby refs, hashes, MIME types, sizes
- **`read-receipts.ts`** — 4 read receipts with queries, answer summaries, blob/pack links

---

## Current features (X3 product closeout)

- Shelby-first evidence model: EvidencePack, BlobRecord identity, and ReadReceipt lineage
- Chinese-first / English-toggleable product UI across the main routes
- Shelby brand-aligned visual system for the home page, evidence registry, upload flow, Blob detail, read receipt, and footer
- Working local preview upload: SHA-256 in-browser, mock Shelby refs, local persistence
- Browser-wallet Shelby testnet upload path via `useShelbyUpload` hook (operator-funded wallets only)
- Dual-mode adapter: mock (default) / testnet (browser-wallet)
- Evidence packs, blobs, and read receipts persisted to local SQLite, with browser localStorage retained as fallback/cache
- Read receipt created automatically after upload (mock or testnet); link shown on success screen
- Read receipt page resolves blob identity from demo data, localStorage, or SQLite
- BlobRecord identity fields surfaced on receipt page: shelbyRef, hash, source, accountAddress, blobName, network, storageStatus, explorerUrl, retrievalUrl
- Data-source badge on blob/receipt detail (Demo / Local mock / Shelby testnet)
- Opt-in Node.js smoke harness (`npm run smoke`) for RPC connectivity and retrieval verification
- Conservative storage status mapping (`status-map.ts`): registered → ready → failed → unknown
- Dashboard shows built-in demo data + locally uploaded packs; reset button clears all local data
- Mode indicator and wallet connect UI on upload page
- C12 release-candidate verifier: doctor checks, isolated SQLite, production build, and route smoke checks
- X3 product closeout status: release-candidate gate remains green after the UI/product pass
- X4 final acceptance package: manual product QA path, demo route checklist, and boundary review

---

## Known operator prerequisites for testnet upload

The following are required for a real Shelby testnet upload — they are **not** provided by this demo:

- A connected Aptos browser wallet (e.g. [Petra](https://petra.app/)) on Aptos Testnet
- Testnet APT for transaction gas fees (from [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet))
- Shelby storage credits (ShelbyUSD or SHEL) on the connected account
- `NEXT_PUBLIC_SHELBY_NETWORK=testnet` set in `.env.local`

CI does not run real uploads. All real-upload paths are operator-dependent and documented in `docs/c3-smoke-test-guide.md`.

---

## Security

- `SHELBY_API_KEY` is read exclusively in the Server Action (`src/app/actions/upload.ts`) — never exposed to the browser
- No `NEXT_PUBLIC_SHELBY_API_KEY` usage anywhere
- No private keys, seed phrases, or mnemonic phrases in this codebase
- Browser wallet signing is handled by the user's wallet extension — the app never has custody of signing material
- SHA-256 hashes are computed client-side — file contents never leave the browser in mock mode
- No secrets committed to this repository
- See `docs/architecture.md` for full security boundary documentation

---

## Documentation

| File | Purpose |
|---|---|
| `docs/architecture.md` | System design, data flow, security boundaries |
| `docs/demo-script.md` | Step-by-step demo walkthrough for stakeholders |
| `docs/ecosystem-submission-pack.md` | Public-facing product positioning and milestone matrix |
| `docs/final-product-acceptance.md` | X4 final manual acceptance path for community experiment review |
| `docs/production-queue.md` | Stage gates and Copilot/Codex task queue |
| `docs/release-candidate-checklist.md` | C12 release-candidate verification gate |
| `docs/c3-smoke-test-guide.md` | Smoke harness setup and manual testnet verification |
| `docs/m4-read-receipt-binding.md` | Read receipt model and BlobRecord identity binding |
| `docs/m2-m4-product-architecture-plan.md` | M2–M4 frozen architecture plan |
| `docs/m2-shelby-testnet-integration-design.md` | M2 Shelby testnet integration design spike |

---

## License

MIT
