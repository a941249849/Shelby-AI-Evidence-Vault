# Shelby AI Evidence Vault

![Milestone](https://img.shields.io/badge/milestone-M5%20Public%20Ecosystem%20Package-violet?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

**A verifiable evidence storage and read-receipt demo for AI agents, with a browser-wallet Shelby testnet upload path. Local mock works out of the box — no wallet, no API keys required. Real testnet upload requires operator prerequisites and manual verification.**

---

## What is this?

Shelby AI Evidence Vault is a public demo showing how AI pipelines can store datasets, agent run outputs, and documents with verifiable provenance:

- **Cryptographic blob references** — every file gets a SHA-256 hash and a Shelby reference (`shelby://mock/blob/{id}` in local mode, `shelby://testnet/{account}/{blobName}` in testnet mode)
- **Evidence packs** — structured groups of related blobs with metadata, tags, provenance, and status
- **Read receipts** — auditable records of agent activity: what was uploaded, what evidence was consulted, and what was answered; bound to real `BlobRecord` identity in M4
- **Working local upload flow** — SHA-256 computed in-browser, evidence packs and receipts persisted to `localStorage`, no wallet or API keys required
- **Browser-wallet Shelby testnet path** — a testnet upload path is available behind a `SHELBY_MODE=testnet` gate using `@shelby-protocol/react`; requires operator prerequisites (funded Aptos testnet wallet, Shelby storage credits) and manual verification — no automated CI upload
- **Opt-in smoke harness** — `npm run smoke` verifies Shelby RPC connectivity and retrieval for a blob uploaded via the browser wallet path

---

## Modes at a glance

| Mode | How to activate | What it does |
|---|---|---|
| **Local mock (default)** | No env vars needed | SHA-256 in-browser, `shelby://mock/blob/{id}` refs, localStorage persistence, read receipt created automatically |
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
| Persistence | Browser localStorage (packs, blobs, receipts) |

---

## Quick start

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000
```

No environment variables required. Mock mode is the default — uploads work immediately with deterministic SHA-256-derived local mock references (`shelby://mock/blob/{id}`).

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
| `/` | Landing page — hero, problem/solution, demo objects, quickstart |
| `/dashboard` | Browse all evidence packs; shows built-in + uploaded local packs |
| `/upload` | Upload form: SHA-256, file drop, mode indicator, wallet connect (testnet mode) |
| `/blob/[id]` | Blob detail: Shelby ref, hash, source, metadata, data-source badge |
| `/read-receipt/[id]` | Read receipt: run ID, query, answer, resolved blob identity and pack links |

---

## Architecture overview

```
src/
├── app/                          # Next.js App Router pages
│   ├── actions/upload.ts         # Server Action: shelbyUploadAction (API key stays server-side)
│   ├── dashboard/                # Evidence pack browser (server → DashboardClient)
│   ├── upload/
│   │   ├── page.tsx              # Full upload flow (client component — mock + testnet paths)
│   │   └── providers.tsx         # QueryClient + AptosWalletAdapterProvider (testnet path)
│   ├── blob/[id]/                # Blob detail (server → BlobDetailClient)
│   └── read-receipt/[id]/        # Thin server shell → ReadReceiptClient
├── components/                   # Shared UI components
│   ├── dashboard-client.tsx      # Merges demo + localStorage packs
│   ├── blob-detail-client.tsx    # Resolves demo + localStorage blobs
│   └── read-receipt-client.tsx   # Resolves receipts from demo data or localStorage
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

## Current features (M4/M5)

- Working local demo upload: SHA-256 in-browser, mock Shelby refs, localStorage persistence
- Browser-wallet Shelby testnet upload path via `useShelbyUpload` hook (operator-funded wallets only)
- Dual-mode adapter: mock (default) / testnet (browser-wallet)
- Evidence packs, blobs, and read receipts all persisted to browser `localStorage`
- Read receipt created automatically after upload (mock or testnet); link shown on success screen
- Read receipt page resolves blob identity from demo data or localStorage (client component)
- BlobRecord identity fields surfaced on receipt page: shelbyRef, hash, source, accountAddress, blobName, network, storageStatus, explorerUrl, retrievalUrl
- Data-source badge on blob/receipt detail (Demo / Local mock / Shelby testnet)
- Opt-in Node.js smoke harness (`npm run smoke`) for RPC connectivity and retrieval verification
- Conservative storage status mapping (`status-map.ts`): registered → ready → failed → unknown
- Dashboard shows built-in demo data + locally uploaded packs; reset button clears all local data
- Mode indicator and wallet connect UI on upload page

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
| `docs/production-queue.md` | Stage gates and Copilot/Codex task queue |
| `docs/c3-smoke-test-guide.md` | Smoke harness setup and manual testnet verification |
| `docs/m4-read-receipt-binding.md` | Read receipt model and BlobRecord identity binding |
| `docs/m2-m4-product-architecture-plan.md` | M2–M4 frozen architecture plan |
| `docs/m2-shelby-testnet-integration-design.md` | M2 Shelby testnet integration design spike |

---

## License

MIT
