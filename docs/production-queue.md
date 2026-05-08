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
- M5 public ecosystem package is merged in PR #14: README rewrite, demo script update, architecture update, ecosystem submission pack.
- C7 SQLite backend persistence is merged: `lib/server/db.ts`, `lib/server/evidence-store.ts`, `app/actions/persist.ts`.
- C8 agent-run example is merged: `scripts/generate-agent-run.mjs`, `fixtures/c8-agent-input.json`.
- C9 community experiment verification is merged: `scripts/verify-community-demo.mjs`, `docs/community-experiment-runbook.md`.
- C10 evidence index search/filter/sort is the current stage: `src/components/dashboard-client.tsx`.
- UI redesign remains paused — Task X2 is deferred until backend state is stable.

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

### Task C5: M5 public ecosystem package

Owner: Copilot

Size: Large

Status: **Complete** — merged in PR #14.

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

### Task C7: Backend persistence foundation with SQLite

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C5 (M5) merges.

Goal:

Add a server-side SQLite persistence foundation for user-created EvidencePack, BlobRecord, and ReadReceipt records. Uploads survive browser refresh and localStorage resets via a local SQLite database.

Scope:

- `src/lib/server/db.ts` — SQLite connection and schema init via `better-sqlite3`. WAL mode. Tables: `evidence_packs`, `blob_records` (indexed by pack), `read_receipts`. Each row stores full typed object as JSON `payload`.
- `src/lib/server/evidence-store.ts` — server-only CRUD helpers: `insertPack`, `insertBlob`, `insertReceipt`, `getPacks`, `getBlobById`, `getBlobsByPackId`, `getReceiptById`.
- `src/app/actions/persist.ts` — server actions: `persistUploadAction` (pack + blobs + receipt in one call), `getPersistedPacksAction`, `getPersistedBlobAction`, `getPersistedBlobsByPackAction`, `getPersistedReceiptAction`.
- `src/app/upload/page.tsx` — accumulate built blobs, call `persistUploadAction` after successful upload (non-fatal on failure).
- `src/components/dashboard-client.tsx` — call `getPersistedPacksAction` on mount; deduplicate against localStorage; merge with demo data.
- `src/components/blob-detail-client.tsx` — fall through to `getPersistedBlobAction` if not found in demo data or localStorage.
- `src/components/read-receipt-client.tsx` — fall through to `getPersistedReceiptAction` (and per-blob `getPersistedBlobAction`) if not in demo data or localStorage.
- `.gitignore` — `data/*.sqlite` and WAL/SHM variants added.
- `.env.example` — `SHELBY_DB_PATH` documented.
- `docs/architecture.md` and `docs/production-queue.md` updated to reflect C7.

Hard boundaries:

- No UI redesign or theme overhaul.
- No real LLM/API calls.
- No authentication system.
- No private key, seed phrase, or server signer.
- No wallet payment UX.
- No marketplace/trading/token features.
- Shelby testnet upload protocol behavior unchanged.
- Database file not committed.

Acceptance:

- Mock mode remains default and works with zero env vars.
- A successful local mock upload creates one EvidencePack, its BlobRecord(s), and one ReadReceipt in SQLite.
- A successful testnet browser-wallet upload persists real Shelby identity fields.
- Dashboard shows persisted user-created packs after page refresh.
- Blob detail pages resolve persisted blobs by ID.
- Read receipt pages resolve persisted receipts and their associated blobs.
- Built-in demo data works unchanged.
- Existing localStorage records do not crash the app.
- Database path is documented and gitignored.
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

C10 evidence index search/filter and operator workflow hardening is the current stage (this PR).

After C10 merges, the next task options include:

- **X2 (Codex):** UI redesign pass — now that backend/protocol boundaries are stable through C10.
- Further operator tooling or community-facing improvements as prioritized.

### Task C8: Agent run evidence-pack integration example

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C7 SQLite persistence merges.

Goal:

Add a deterministic agent-run integration example demonstrating the full product story:
`source evidence → agent run output → EvidencePack → BlobRecord → ReadReceipt`

Scope:

- `scripts/generate-agent-run.mjs` — deterministic Node.js script. Reads `fixtures/c8-agent-input.json`, computes SHA-256 of input and output, builds EvidencePack + 2 BlobRecords + ReadReceipt, persists all to SQLite via `INSERT OR REPLACE` (idempotent). No LLM calls, no credentials.
- `fixtures/c8-agent-input.json` — small public synthetic AI benchmark fixture (input for the agent run).
- `package.json` — `generate-agent-run` script added.
- `docs/demo-script.md` — Step 8 (C8 agent-run) added.
- `docs/architecture.md` — C8 write flow + script entries added.
- `docs/production-queue.md` — C8 task documented.

Hard boundaries:

- No UI redesign.
- No real LLM/API calls.
- No private key, seed phrase, or server signer.
- No wallet payment UX.
- No marketplace/trading/token features.
- Existing upload, testnet, and demo-receipt paths unchanged.
- DB file not committed.

Acceptance:

- `npm run generate-agent-run` creates `c8-pack-agent-sentinel-v1`, `c8-blob-input-v1`, `c8-blob-output-v1`, and `c8-rr-agent-sentinel-v1` in SQLite.
- `/read-receipt/c8-rr-agent-sentinel-v1` resolves after running the script (SQLite path in `ReadReceiptClient`).
- Dashboard shows the C8 pack after page refresh.
- Existing upload flow still works with zero env vars.
- Existing demo receipts (`rr-001` etc.) still work.
- SQLite failures are non-fatal.
- Script is idempotent (`INSERT OR REPLACE`) — safe to run multiple times.
- `npm run lint` passes.
- `npm run build` passes.

Deliverables:

- `scripts/generate-agent-run.mjs`
- `fixtures/c8-agent-input.json`
- `package.json` — `generate-agent-run` script
- `docs/demo-script.md`, `docs/architecture.md`, `docs/production-queue.md` — updated

### Task C9: Community experiment release hardening and verification stage

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C8 merges.

Goal:

Turn the current Shelby AI Evidence Vault demo into a cleaner community-experiment candidate by hardening the local product loop, verification commands, and release documentation around the now-complete chain:
`source evidence → agent run output → EvidencePack → BlobRecord → ReadReceipt → dashboard/read pages`

Scope:

- `scripts/verify-community-demo.mjs` — zero-credential verification harness. Uses isolated temp SQLite DB, runs the C8 generation path twice, asserts all expected IDs and relationships, asserts idempotency (35 assertions). No network calls, no credentials.
- `docs/community-experiment-runbook.md` — community experiment runbook covering setup, zero-credential demo path, verification commands, expected IDs, DB inspection, reset instructions, testnet boundaries.
- `package.json` — `verify-community-demo` script added.
- `docs/production-queue.md` — C8 marked complete; C9 added as active stage; Immediate Next Action updated.
- `docs/demo-script.md` — C9 verification step reference added.
- `docs/architecture.md` — C9 script entry added.

Hard boundaries:

- No UI redesign.
- No real LLM/API calls.
- No private key, seed phrase, or server signer.
- No wallet payment UX.
- No marketplace/trading/token features.
- Existing upload, testnet, and demo-receipt paths unchanged.
- DB file not committed.
- No committed runtime DB.

Acceptance:

- `npm run verify-community-demo` passes from a clean checkout with zero Shelby credentials.
- `npm run generate-agent-run` still works and remains idempotent.
- `npm run lint` passes.
- `npm run build` passes.
- The new runbook gives a reviewer enough information to run and inspect the demo without asking for hidden context.
- C8 receipt/blob/dashboard flow remains intact.
- Docs consistently distinguish demo/local/mock vs Shelby testnet.

Deliverables:

- `scripts/verify-community-demo.mjs`
- `docs/community-experiment-runbook.md`
- `package.json` — `verify-community-demo` script
- `docs/production-queue.md`, `docs/demo-script.md`, `docs/architecture.md` — updated

### Task C10: Evidence index search/filter and operator workflow hardening

Owner: Copilot

Size: Large

Status: **Complete** — implemented in this PR.

When to start:

After C9 merges.

Goal:

Make the evidence index usable for community testers and operators once the vault contains demo records, C8 agent-run records, and user-uploaded records. Add search, filters, sort, and empty states to the dashboard without changing the visual direction.

Scope:

- `src/components/dashboard-client.tsx` — search input covering title, description, category, sourceType, status, tags, and dataSource; dropdown filters for category, source type, status, and data source (demo/local); sort controls (newest first, oldest first, title A–Z, most blobs); clear/reset filters button; filtered result counts on metric bar and section headers; empty state with reset control.
- `docs/demo-script.md` — new Step 7.5 covering the dashboard operator search/filter/sort workflow.
- `docs/community-experiment-runbook.md` — new section on search/filter/sort for community testers.
- `docs/architecture.md` — C10 entry added.
- `docs/production-queue.md` — C10 task documented; Current State updated.

Hard boundaries:

- No UI redesign or visual polish pass. Existing design language and component patterns used throughout.
- No GPT/image generation work.
- No real LLM/API calls.
- No private key, seed phrase, server signer, wallet payment UX, or marketplace/trading/token features.
- No real Shelby upload enabled by default.
- Existing mock/local path preserved.
- No committed runtime DB files.
- Testnet behavior fail-closed when config is incomplete.

Acceptance:

- Search, filters, clear/reset, and sort work on the dashboard across demo + browser-cache + SQLite packs.
- `npm run generate-agent-run` followed by dev server shows the C8 pack; it is findable by searching for `C8`, `benchmark`, or `agent-run`.
- Default dashboard with no filters still shows the existing corpus and local workspace records.
- Filtered empty state is clear and recoverable via "Reset filters".
- Browser-cache reset does not delete SQLite-persisted C8 records.
- `npm run verify-community-demo` passes.
- `npm run build` passes.
- Docs reflect the actual UI labels and behavior.

Deliverables:

- `src/components/dashboard-client.tsx` — search, filter, sort, empty state
- `docs/demo-script.md`, `docs/community-experiment-runbook.md`, `docs/architecture.md`, `docs/production-queue.md` — updated
