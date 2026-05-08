# Community Experiment Runbook — Shelby AI Evidence Vault

**Stage: C10 — Evidence index search/filter and operator workflow hardening**

This runbook is written for community testers and reviewers who want to clone the repo, run the zero-credential path, inspect persisted records, and understand what is mock/local/demo vs Shelby testnet.

There are no hidden setup steps. Everything documented here is the complete picture.

---

## Contents

1. [What this is](#1-what-this-is)
2. [Setup](#2-setup)
3. [Zero-credential demo path](#3-zero-credential-demo-path)
4. [Verification commands](#4-verification-commands)
5. [Expected IDs and data shapes](#5-expected-ids-and-data-shapes)
6. [Inspecting the SQLite database](#6-inspecting-the-sqlite-database)
7. [Using the dashboard search, filter, and sort](#7-using-the-dashboard-search-filter-and-sort)
8. [Resetting local runtime data](#8-resetting-local-runtime-data)
9. [Optional: Shelby testnet path](#9-optional-shelby-testnet-path)
10. [Known boundaries](#10-known-boundaries)
11. [Architecture quick-reference](#11-architecture-quick-reference)

---

## 1. What this is

**Shelby AI Evidence Vault** is a local-first demo that shows how AI agents can produce verifiable evidence trails using the Shelby blob-storage protocol.

The core chain is:

```
source evidence  →  agent run output  →  EvidencePack  →  BlobRecord(s)  →  ReadReceipt
```

Every record in that chain is persisted to a local SQLite database and readable through the Next.js UI.

**This is a community experiment.** It runs entirely locally. Mock/local/demo references (e.g. `shelby://mock/blob/…`) are **not** claims of mainnet or production Shelby storage. They are deterministic local identifiers that demonstrate the data model and UI.

---

## 2. Setup

### Requirements

- Node.js 18 or later (tested with Node.js 20 LTS)
- npm (bundled with Node.js)
- No other accounts, API keys, or wallet extensions are needed for the zero-credential path

### Clone and install

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault.git
cd Shelby-AI-Evidence-Vault
npm install
```

### Start the dev server

```bash
npm run dev
# App available at http://localhost:3000
```

No environment variables are needed. The app defaults to mock/local mode.

---

## 3. Zero-credential demo path

This path works from a clean checkout with no Shelby account, no wallet, and no API keys.

### Step 1 — Generate the C8 agent-run evidence pack

```bash
npm run generate-agent-run
```

Expected output (abbreviated):

```
[generate-agent-run] ── C8 agent-run generated ─────────────────────────
  Pack ID      : c8-pack-agent-sentinel-v1
  Blob (input) : c8-blob-input-v1
    shelbyRef  : shelby://mock/blob/efce327db30aa065734491d66eb7ffd1
    hash       : sha256:efce327db30aa065734491d66eb7ffd1bf29569be2fbd2d34e3461d4605621e1
  Blob (output): c8-blob-output-v1
    shelbyRef  : shelby://mock/blob/86b551578321b2f64c251c4b9c39403a
    hash       : sha256:86b551578321b2f64c251c4b9c39403a3dbd94c47070975de881b8cc1bd81d42
  Receipt ID   : c8-rr-agent-sentinel-v1
  DB path      : data/shelby-vault.sqlite
```

All IDs are **deterministic and stable** — you will get the same IDs every time on any machine.

### Step 2 — Inspect via the UI (dev server must be running)

| URL | What you see |
|-----|-------------|
| `http://localhost:3000/read-receipt/c8-rr-agent-sentinel-v1` | Read receipt: query, answer summary, referenced blobs, run ID |
| `http://localhost:3000/blob/c8-blob-input-v1` | Input blob: Shelby mock ref, SHA-256 hash, source, pack link |
| `http://localhost:3000/blob/c8-blob-output-v1` | Output blob: Shelby mock ref, SHA-256 hash, source, pack link |
| `http://localhost:3000/dashboard` | Dashboard: C8 pack appears in "Local workspace" under "User-created records" |

### Step 3 — Upload your own file (optional)

1. Navigate to `http://localhost:3000/upload`
2. Enter a title and select any local file
3. Click **"Save locally (mock Shelby reference)"**
4. The success screen shows blob links and a read receipt link
5. Navigate to `/dashboard` — your pack appears in "Local workspace" under "User-created records"

User-uploaded packs are persisted to `data/shelby-vault.sqlite` and survive page refresh.

---

## 4. Verification commands

### Lint

```bash
npm run lint
```

Expected: no errors.

### Build

```bash
npm run build
```

Expected: Next.js production build succeeds with no TypeScript or ESLint errors.

### C8 generation (idempotent)

```bash
npm run generate-agent-run
```

Safe to run multiple times — uses `INSERT OR REPLACE`, so no duplicate rows are created.

### C9 community-demo verification harness

```bash
npm run verify-community-demo
```

This script:

1. Creates an isolated temporary SQLite database in the OS temp directory.
2. Runs `generate-agent-run.mjs` twice against that database.
3. Asserts all expected IDs, payload fields, and relationships are correct.
4. Asserts idempotency: row counts and payloads are identical after both runs.
5. Deletes the temporary database before exiting.

Expected output (abbreviated):

```
[verify] ── C9 Community-demo verification harness ─────────────────────
[verify] Temp DB : /tmp/shelby-verify-<timestamp>.sqlite

[verify] Running generator (pass 1)…

[verify] ── Assertions after pass 1 ──────────────────────────────────
  ✓  exactly 1 evidence pack
  ✓  exactly 2 blob records
  ✓  exactly 1 read receipt
  …(35 assertions total)…

[verify] ── Idempotency assertions after pass 2 ───────────────────────
  ✓  pack row count unchanged after second run
  …

[verify] ── Summary ──────────────────────────────────────────────────────
  Passed : 35
  Failed : 0

[verify] All assertions passed. Community demo verification complete.
```

Exit code `0` on success, `1` on any assertion failure.

**Note on live server checks:** The harness does not start a live HTTP server. Starting a full Next.js dev server inside a verification script is too heavy for CI and introduces timing and port-availability dependencies. The DB-level assertions are deterministic, reproducible, and cover the full record chain. For end-to-end UI verification, follow the manual steps in Section 3 above.

---

## 5. Expected IDs and data shapes

These IDs are stable across runs (defined as constants in `scripts/generate-agent-run.mjs`):

| Record | ID |
|--------|----|
| EvidencePack | `c8-pack-agent-sentinel-v1` |
| BlobRecord (input) | `c8-blob-input-v1` |
| BlobRecord (output) | `c8-blob-output-v1` |
| ReadReceipt | `c8-rr-agent-sentinel-v1` |

### EvidencePack shape

```json
{
  "id": "c8-pack-agent-sentinel-v1",
  "title": "C8 Agent Run — AI Benchmark Sentinel v1",
  "category": "agent-run",
  "sourceType": "agent-output",
  "blobCount": 2,
  "status": "active",
  "dataSource": "local",
  "tags": ["agent-run", "benchmark", "c8", "deterministic", "no-llm"]
}
```

### BlobRecord shape (input)

```json
{
  "id": "c8-blob-input-v1",
  "shelbyRef": "shelby://mock/blob/efce327db30aa065734491d66eb7ffd1",
  "hash": "sha256:efce327db30aa065734491d66eb7ffd1bf29569be2fbd2d34e3461d4605621e1",
  "source": "fixture://fixtures/c8-agent-input.json",
  "uploadMode": "mock",
  "network": "mock",
  "evidencePackId": "c8-pack-agent-sentinel-v1"
}
```

### ReadReceipt shape

```json
{
  "id": "c8-rr-agent-sentinel-v1",
  "runId": "run-c8-agent-sentinel-v1",
  "receiptMode": "local",
  "referencedBlobIds": ["c8-blob-input-v1", "c8-blob-output-v1"],
  "evidencePackIds": ["c8-pack-agent-sentinel-v1"]
}
```

**About `shelby://mock/blob/…` references:**
These are deterministic local identifiers derived from the SHA-256 hash of the file content. They are **not** real Shelby testnet references. The prefix `shelby://mock/` explicitly marks them as local/demo.

---

## 6. Inspecting the SQLite database

After running `npm run generate-agent-run`, the database lives at:

```
data/shelby-vault.sqlite
```

This path can be overridden with the `SHELBY_DB_PATH` environment variable.

### Using the sqlite3 CLI

```bash
sqlite3 data/shelby-vault.sqlite

.tables
-- evidence_packs  blob_records  read_receipts

SELECT id, created_at FROM evidence_packs;
-- c8-pack-agent-sentinel-v1|2026-05-08T16:00:00.000Z

SELECT id, evidence_pack_id FROM blob_records;
-- c8-blob-input-v1|c8-pack-agent-sentinel-v1
-- c8-blob-output-v1|c8-pack-agent-sentinel-v1

SELECT id, created_at FROM read_receipts;
-- c8-rr-agent-sentinel-v1|2026-05-08T16:00:00.000Z

-- Read full payload:
SELECT json(payload) FROM read_receipts WHERE id = 'c8-rr-agent-sentinel-v1';
```

### Schema

```sql
evidence_packs  (id TEXT PK, created_at TEXT, payload TEXT)
blob_records    (id TEXT PK, evidence_pack_id TEXT INDEX, created_at TEXT, payload TEXT)
read_receipts   (id TEXT PK, created_at TEXT, payload TEXT)
```

Each `payload` column contains the full typed object as JSON. This means future field additions do not require schema migrations.

---

## 7. Using the dashboard search, filter, and sort

Navigate to `http://localhost:3000/dashboard` (dev server must be running).

The toolbar above the evidence sections lets you narrow the full index without modifying any stored data. All filtering and sorting is client-side.

### Search

Type any text into the **"Search title, tags, category…"** input. The search covers:

- Pack title
- Pack description
- Category (e.g. `dataset`, `agent-run`)
- Source type (e.g. `agent-output`, `web-scrape`)
- Status (e.g. `active`, `archived`)
- Tags
- Data source label (`local` or `demo`)

**Useful queries to try:**

| Query | What it finds |
|-------|---------------|
| `C8` | The C8 agent-run pack |
| `benchmark` | C8 pack + Synthetic QA Benchmark demo pack |
| `agent-run` | All agent-run category packs |
| `archived` | Archived policy document |
| `local` | All user-created/local packs |

### Filters

Four dropdown controls are available next to the search box:

| Control | Options |
|---------|---------|
| Category | All categories / dataset / agent-run / document / manifest |
| Source type | All source types / web-scrape / api-export / agent-output / manual-upload |
| Status | All statuses / active / archived / pending |
| Data source | All sources / Local / uploaded / Demo corpus |

### Sort

The sort dropdown to the right of the filter controls supports:

| Value | Behaviour |
|-------|-----------|
| **Newest first** (default) | Most recently created packs first |
| **Oldest first** | Chronological order |
| **Title A–Z** | Alphabetical by title |
| **Most blobs** | Packs with the highest blob count first |

Sorting is deterministic and stable — identical inputs always produce the same order.

### Counts

- The **"Packs indexed"** metric shows `filtered / total` when a filter is active (e.g. `3 / 6`).
- Each section header shows `N / total shown` for its filtered subset.

### Clear/reset filters

When any filter, search, or sort (other than default "Newest first") is active:

- A **"Clear filters"** button (violet) appears at the right end of the toolbar.
- Clicking it resets all search, filter, and sort controls to their defaults.

### Empty state

If no packs match the current filters:

- A **"No packs match your filters"** message appears in place of the pack grids.
- A **"Reset filters"** button lets you return to the full index in one click.

### Section visibility

- The **Local workspace** section only appears when there are user-created packs in the filtered result.
- The **Demo evidence** section is always shown when unfiltered; it is hidden only if filters exclude all demo packs.
- When both sections have results, they are shown with their existing section headers so you can always tell which source each card belongs to.

---

## 8. Resetting local runtime data

### SQLite database

Delete the database file to start fresh:

```bash
rm -f data/shelby-vault.sqlite data/shelby-vault.sqlite-wal data/shelby-vault.sqlite-shm
```

The file will be recreated on the next `npm run generate-agent-run` or `npm run dev`.

### Browser localStorage

Navigate to `http://localhost:3000/dashboard` and click **"Reset browser cache"** (top right of the "Local workspace" section). This clears browser-cached local packs, blobs, and receipts.

The button asks for confirmation (click once → "Click again to reset browser cache" → click again to proceed). Built-in demo data is not affected. SQLite-persisted records are not deleted by this browser-cache reset.

---

## 9. Optional: Shelby testnet path

> **Honest prerequisites:** This path requires infrastructure that is not available from a clean checkout. It is documented here for completeness. Community testers should not need it.

### What is required

- An Aptos wallet browser extension (e.g. [Petra](https://petra.app/))
- Testnet APT for gas fees (from [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet))
- Shelby storage credits on the connected wallet account
- A `.env.local` file with:

```env
SHELBY_MODE=testnet
NEXT_PUBLIC_SHELBY_NETWORK=testnet
```

### What it does

When testnet mode is active, the upload page shows a wallet connect button. After signing the transaction in your wallet, the app records a real `shelby://testnet/{account}/{blobName}` reference and a `storageStatus: 'registered'` field.

### What it does not do

- It does not move mainnet funds.
- It does not grant access to any production system.
- It does not affect other users of this repo.
- The C9 verification harness does not require or test this path.

### Smoke harness (advanced)

For Shelby testnet retrieval verification after a real upload, see `docs/c3-smoke-test-guide.md` and `scripts/shelby-smoke.mjs`. The smoke harness is opt-in and disabled unless `SHELBY_SMOKE=true` is set explicitly.

---

## 10. Known boundaries

| Item | Status |
|------|--------|
| `shelby://mock/blob/…` refs | Local/demo only — not real Shelby testnet storage |
| `shelby://demo/blob/…` refs | Built-in illustrative demo data — not real |
| SQLite database | Local file — not a production database |
| No LLM calls | The C8 analysis is pure deterministic computation |
| No private keys | No key, seed phrase, or signing material anywhere |
| No real uploads by default | Mock mode is the default; testnet upload requires explicit opt-in |
| Browser localStorage | Used as a fallback for demo persistence; browser-specific |
| Dashboard filters | Client-side only — do not modify stored data |
| UI redesign | Paused (Task X2 — deferred) |
| Marketplace / trading | Out of scope |
| Tokenomics | Out of scope |

---

## 11. Architecture quick-reference

```
fixtures/c8-agent-input.json    ← synthetic public benchmark data (input)
scripts/generate-agent-run.mjs  ← C8 deterministic generator (zero credentials)
scripts/verify-community-demo.mjs ← C9 verification harness (this runbook's § 4)

src/lib/server/db.ts            ← SQLite connection + schema (better-sqlite3)
src/lib/server/evidence-store.ts ← CRUD helpers for packs, blobs, receipts
src/app/actions/persist.ts      ← Server Actions: persistUploadAction, getPersistedX

src/lib/shelby/adapter.ts       ← ShelbyAdapter interface
src/lib/shelby/mock-adapter.ts  ← Mock adapter: shelby://mock/blob/{id}
src/lib/shelby/config.ts        ← reads SHELBY_MODE env var (server-only)

src/components/dashboard-client.tsx ← C10: search, filter, sort, empty state

data/shelby-vault.sqlite        ← runtime DB (gitignored; created on first run)
```

For the complete architecture diagram, see `docs/architecture.md`.
For the full step-by-step demo walk-through, see `docs/demo-script.md`.
