# Production Queue

Date: 2026-05-08

This document is the working production queue for Shelby AI Evidence Vault after the M1A official-docs audit. It converts the product roadmap into large, stage-level tasks. It is intentionally not a list of small fixes.

## Operating Model

Codex owns:

- Product direction and architecture decisions.
- Official Shelby docs interpretation.
- UI design and UI implementation.
- Small cleanup, wording fixes, review, and merge-readiness checks.
- Final task framing before Copilot is asked to implement.

Copilot owns:

- Large backend/protocol/code-production tasks only.
- Bounded implementation work with clear acceptance criteria.
- New PRs for substantial changes.

Copilot should not be used for small copy edits, one-file cleanup, tiny refactors, or UI polish.

## Current State

- M0 is merged.
- M1A official docs audit is complete in `docs/shelby-official-docs-audit.md`.
- M1B is merged from PR #4.
- M2 design is complete in `docs/m2-shelby-testnet-integration-design.md`.
- M3 browser-wallet Shelby testnet upload is merged: `use-shelby-upload.ts`, `browser-client.ts`, `providers.tsx`.
- C3 smoke harness is merged: `scripts/shelby-smoke.mjs`, `src/lib/shelby/status-map.ts`, `docs/c3-smoke-test-guide.md`.
- M4 read receipt binding is merged: `ReadReceiptClient`, localStorage receipt persistence, BlobRecord identity surface.
- M5 public ecosystem package is the current stage: README rewrite, demo script update, architecture update, ecosystem submission pack.
- UI redesign remains paused — Task X2 is deferred until protocol boundaries stabilize.

## Stage Gate

### Gate G1: M1B readiness

Owner: Codex

Goal:

Make PR #4 merge-ready as a local/mock milestone.

Required:

- No real Shelby upload claims.
- No wallet/signing/private-key implementation.
- No hardcoded old contract address.
- Mock refs and demo refs are clearly local/illustrative.
- Testnet config is documented as future integration target.
- `npm run lint` passes.
- `npm run build` passes.

Status:

Complete.

Copilot involvement:

None.

### Gate G2: M2-M4 plan freeze

Owner: Codex

Goal:

Create a complete staged product/architecture plan before dispatching any post-M1B Copilot task.

Required:

- Official Shelby docs translated into product architecture.
- M2/M3/M4 scope and handoff gates defined.
- Browser wallet vs server signer treated as an explicit M2 decision.
- API key, funding, expiration, account/blobName, and read receipt implications included.
- Copilot task policy defined: large bounded tasks only, no small patches.

Status:

Complete in `docs/m2-m4-product-architecture-plan.md`.

## Copilot Task Queue

### Task C1: M2 official Shelby testnet integration design spike

Owner: Codex

Size: Large

When to start:

Only after `docs/m2-m4-product-architecture-plan.md` is accepted as the frozen plan.

Goal:

Produce an implementation-ready M2 design for real Shelby testnet integration without wiring production upload into the UI.

Status:

Complete in `docs/m2-shelby-testnet-integration-design.md`.

Scope:

- Inspect the current official `@shelby-protocol/sdk`, `@shelby-protocol/react`, and `@aptos-labs/ts-sdk` package APIs.
- Confirm the correct SDK network configuration for Shelby testnet.
- Confirm the current testnet RPC/fullnode/indexer/contract account against official docs at implementation time.
- Decide whether the first real integration should use browser wallet signing, server-side signer, or a two-path architecture.
- Identify API key placement and whether any browser-safe key exists.
- Define account address + blob name persistence requirements.
- Define expiration, funding, transaction status, and storage status mapping.
- Produce a design document, not a production upload implementation.

Required output:

- `docs/m2-shelby-testnet-integration-design.md`
- Optional small TypeScript type/interface additions only if needed to make the design precise.

Hard boundaries:

- No UI redesign.
- No wallet UI implementation.
- No private key env vars.
- No seed phrase or mnemonic handling.
- No real upload enabled in the app.
- No production database.
- No marketplace/trading/token speculation features.

Acceptance:

- Design references official docs/package versions used.
- Design explains browser wallet vs server signer tradeoff.
- Design defines the real adapter interface inputs and outputs.
- Design preserves the existing fail-closed behavior until M3.
- `npm run lint` and `npm run build` pass if code files are touched.

Suggested Copilot prompt:

```txt
@copilot Stage task C1: M2 official Shelby testnet integration design spike.

Use PR #4 as the M1B baseline. Do not implement real upload yet.

Read:
- docs/m2-m4-product-architecture-plan.md
- docs/shelby-official-docs-audit.md
- docs/shelby-integration.md
- docs/m1b-readiness-review.md
- src/lib/shelby/*
- .env.example

Goal:
Create docs/m2-shelby-testnet-integration-design.md that turns the official Shelby testnet docs and current SDK package APIs into an implementation-ready design.

Must cover:
- Current package names and versions inspected
- Correct Shelby testnet network config
- SDK network constant/config choice
- Browser wallet vs server signer decision matrix
- API key placement and browser-safety boundary
- accountAddress + blobName persistence model
- expiration/funding/transaction/status mapping
- adapter inputs/outputs for M3
- explicit blockers before real upload can be enabled

Hard boundaries:
- No UI redesign
- No wallet UI implementation
- No private key, seed phrase, mnemonic, or unsafe signer storage
- No real upload enabled
- No production DB
- No marketplace, trading, token speculation, or AI agent logic

Verification:
- npm run lint
- npm run build
```

### Task C2: M3 backend/protocol adapter implementation

Owner: Copilot

Size: Large

Status: **Complete** — implemented (browser-wallet Shelby testnet upload path, M3).

When to start:

Now that Codex has completed `docs/m2-shelby-testnet-integration-design.md`, this is the next Copilot-sized production task.

Goal:

Implement the real Shelby testnet upload adapter behind the existing adapter boundary. Keep UI changes minimal and leave UI design to Codex.

Scope:

- Install official SDK packages approved in C1.
- Implement real adapter module or service layer behind `src/lib/shelby/`.
- Decode existing base64 upload payload into bytes for SDK upload.
- Register commitments and upload through the official flow.
- Return real account/blobName/ref/status fields.
- Preserve mock mode as the default.
- Preserve fail-closed errors when config is incomplete.
- Add focused tests or smoke scripts for adapter config and disabled/missing-config behavior.
- Use browser wallet signing as the first implementation path.
- Do not implement server signer.

Hard boundaries:

- No UI redesign.
- No private key committed to source or examples.
- No wallet payment UI.
- No production database.
- No real upload path enabled by default.

Acceptance:

- Mock mode still works with zero env vars.
- Testnet mode fails closed when config is incomplete.
- Real upload path is isolated behind `src/lib/shelby/`.
- No secrets are exposed through `NEXT_PUBLIC_*` unless C1 proves they are browser-safe.
- `npm run lint` passes.
- `npm run build` passes.

### Task C3: Real upload smoke harness and evidence status mapping

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C2 lands and real testnet credentials/account/funding are available.

Goal:

Add a non-UI smoke harness for real Shelby testnet upload and retrieval verification.

Scope:

- Add a script or documented command that uploads a tiny fixture to Shelby testnet.
- Verify accountAddress + blobName + transaction/status fields.
- Verify retrieval or explorer visibility where possible.
- Produce a machine-readable smoke output under a gitignored output directory.
- Update docs with exact manual verification steps.

Hard boundaries:

- No secrets committed.
- No UI redesign.
- No production DB.
- No AI agent logic.

Acceptance:

- Smoke harness is opt-in and disabled unless env vars are explicitly set.
- Mock/local app behavior remains unchanged.
- Output clearly distinguishes local proof, RPC upload result, transaction hash, and explorer/RPC verification.

Deliverables:

- `scripts/shelby-smoke.mjs` — opt-in Node.js smoke harness
- `src/lib/shelby/status-map.ts` — conservative evidence status mapping utilities
- `docs/c3-smoke-test-guide.md` — exact manual steps, env vars, expected output
- `.env.example` — smoke env vars added (`SHELBY_SMOKE`, `SHELBY_SMOKE_ACCOUNT_ADDRESS`, `SHELBY_SMOKE_BLOB_NAME`)
- `.gitignore` — `tmp/` and `artifacts/shelby-smoke/` added
- `package.json` — `smoke` script added

PR note: A real Shelby testnet smoke upload was **not** run. The CI environment has no funded Aptos testnet wallet and no Shelby testnet API access. The manual browser upload path is documented in `docs/c3-smoke-test-guide.md`. All opt-in gates, fail-closed behavior, and machine-readable output were verified locally.

### Task C4: M4 bind read receipts to real/local Shelby BlobRecord identity

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C3 lands.

Goal:

Make read receipts bind to actual BlobRecord identity, not just raw demo blob IDs. A receipt should resolve referenced blobs/packs from built-in demo data and browser-local uploads, then expose evidence lineage and Shelby identity fields.

Scope:

- Extend `ReadReceipt` model with optional `receiptMode` field.
- Add browser-local read receipt persistence (`getLocalReadReceipts`, `addLocalReadReceipt`, `getLocalReadReceiptById`) and update `resetLocalData` to clear receipts.
- Create a read receipt automatically after successful upload (mock or testnet), and show a link to it on the upload success screen.
- Convert the read receipt page into a client-aware component (similar to `BlobDetailClient`) so local receipts survive refresh.
- Improve receipt blob display: show hash, source, shelbyRef, identity fields (accountAddress, blobName, network, storageStatus, explorerUrl, retrievalUrl) and data source badge per blob.
- Add `docs/m4-read-receipt-binding.md` with model and verification path.

Hard boundaries:

- No UI redesign or theme overhaul.
- No production database.
- No real LLM/API calls.
- No private key or server signer.

Acceptance:

- Demo read receipt `/read-receipt/rr-001` still works.
- Uploading in mock mode creates a local read receipt and shows a link to it.
- The local receipt page survives refresh and resolves its local pack/blob data from localStorage.
- `resetLocalData` clears local packs, blobs, and receipts.
- Mock mode remains default and works with zero env vars.
- `npm run lint` passes.
- `npm run build` passes.

Deliverables:

- `src/lib/demo-data/read-receipts.ts` — `ReadReceipt.receiptMode` field added
- `src/lib/store/local-store.ts` — read receipt persistence helpers + `resetLocalData` update
- `src/app/upload/page.tsx` — receipt created on upload success, receipt link shown
- `src/components/read-receipt-client.tsx` — new client component with full blob identity display
- `src/app/read-receipt/[id]/page.tsx` — thin server wrapper delegating to client component
- `docs/production-queue.md` — C4 task documented
- `docs/m4-read-receipt-binding.md` — model and verification guide

### Task C5: M5 public ecosystem package (current)

Owner: Copilot

Size: Large

Status: **In progress** — this PR.

Goal:

Update all public-facing documentation to accurately reflect the M4/M5 product state. No new app features or protocol behavior changes.

Scope:

- Rewrite README.md: remove M1B-only framing, add M4/M5 feature list, update architecture tree, add verification commands.
- Update docs/demo-script.md: remove M1B-only scope, add testnet operator demo section, add C3 smoke follow-up.
- Update docs/architecture.md: add browser-wallet path, read-receipt-client, localStorage receipts, providers, status-map.
- Create docs/ecosystem-submission-pack.md: English + Chinese positioning, elevator pitch, 3-minute narrative, milestone matrix, out-of-scope list, links.
- Update docs/production-queue.md: mark M4 complete, add M5 task, fix stale Immediate Next Action.

Hard boundaries:

- No UI redesign.
- No new app features.
- No real LLM/API calls.
- No production database/auth.
- No private key or server signer.
- No dependency changes.

Acceptance:

- README reflects M4/M5 reality.
- Demo script matches actual app behavior.
- Architecture doc matches current code.
- Ecosystem submission pack exists and is ready for public handoff.
- Production queue no longer points at C2 as immediate next action.
- `npm run lint` passes.
- `npm run build` passes.

## Codex Task Queue

### Task X1: M1B merge-readiness review

Owner: Codex

Status: **Complete.**

Goal:

Review PR #4 as the local/mock M1B milestone and make small corrections directly if needed.

### Task X2: UI redesign pass

Owner: Codex

Goal:

After protocol boundaries stabilize, redesign the app UI toward a stronger Shelby/product-grade visual direction. This remains paused until backend/product milestones need UI again.

### Task X3: M2 design review

Owner: Codex

Status: **Complete.**

Goal:

Review C1 output before any real upload implementation starts.

## Immediate Next Action

M5 documentation/packaging is the current stage (this PR).

After M5 merges, the next Copilot task options include:

- **X2 (Codex):** UI redesign pass — now that protocol boundaries are stable through M4.
- **C6:** Search and filter on the dashboard (operator-requested feature).
- **C7:** Real backend persistence with SQLite for cross-browser evidence packs.
- **C8:** Agent run integration example — a scripted agent that produces an evidence pack and read receipt.

Do not dispatch small patch tasks to Copilot. Next Copilot task should be a large bounded implementation with clear acceptance criteria.
