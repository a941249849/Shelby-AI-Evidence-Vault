# Demo Script — Shelby AI Evidence Vault

A step-by-step walkthrough for demonstrating the **M4/M5/C8 evidence vault** to stakeholders or the community.

> **Current scope:**
> - Local mock upload works with zero configuration (the default).
> - Browser-wallet Shelby testnet upload path exists for operators with funded wallets.
> - Built-in demo data uses illustrative `shelby://demo/blob/` references.
> - Local uploads get `shelby://mock/blob/{id}` references.
> - Real testnet uploads get `shelby://testnet/{account}/{blobName}` references and require operator prerequisites.
> - The C8 agent-run script (`npm run generate-agent-run`) produces a deterministic evidence pack, blobs, and read receipt with zero credentials.

## Prerequisites

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# App is running at http://localhost:3000
# No environment variables needed — mock mode works out of the box.
```

---

## Step 1 — Landing page (`/`)

Open `http://localhost:3000`.

**Point out:**
- The hero section: "AI agents need verifiable data memory."
- The three CTA buttons: Launch Demo, View GitHub, Read Docs
- Scroll down to the **Problem** section — explain why data provenance matters for AI
- Scroll to **Solution** — evidence packs, Shelby blob references, read receipts
- Scroll to **How it Works** — the 4-step flow
- Scroll to **Sample evidence packs** — show 3 live cards from demo data
- Scroll to **Developer Quickstart** — show the git clone snippet

---

## Step 2 — Dashboard (`/dashboard`)

Click "Launch Demo" or navigate to `/dashboard`.

**Point out:**
- Stats bar: 5 total packs, 3 active, 6 total blobs (demo data only on first visit)
- The 3-column responsive grid of evidence pack cards
- Each card shows: title, status badge (green/gray/yellow), category badge, source type, tags, blob count, created date
- Five packs: dataset (Common Crawl), agent-run (GPT-4o legal extractor), manifest (arXiv), document (policy), dataset (synthetic QA benchmark)
- The "View blobs →" link on each card

After you upload a pack (Step 5), come back here to see the **"Locally uploaded"** section appear at the top with a green dot indicator.

---

## Step 3 — Blob detail (`/blob/blob-001`)

Navigate to `/blob/blob-001`.

**Point out:**
- The full blob metadata table
- **Demo Reference** row: `shelby://demo/blob/a1b2c3d4...` — an illustrative demo reference, not a real Shelby blob identity
- **SHA-256 Hash** row: the content fingerprint
- **Source** row: the original URL from Common Crawl S3
- **MIME Type**: `application/warc`
- **Size**: 50 MB
- **Evidence Pack** link: clicking it goes back to the dashboard for that pack
- **Demo data** badge (top right of detail block): shows this is built-in demo data
- Try `/blob/blob-003` — shows the GPT-4o agent output blob

---

## Step 4 — Read receipt (`/read-receipt/rr-001`)

Navigate to `/read-receipt/rr-001`.

**Point out:**
- The **Query** block (large, prominent): the agent's question
- The **Answer Summary** block: what the agent found
- **Run ID** (monospace): the unique agent run identifier
- **Referenced Blobs**: clickable links to `/blob/blob-003` — trace from answer back to source; shows Shelby ref, SHA-256 hash, and data-source badge
- **Evidence Packs**: link to the pack that was consulted
- **Agent Version**: `shelby-agent/0.3.0 gpt-4o-2024-01-25`

Explain: "Every time an agent runs, we can produce this receipt. It's a full audit trail — query in, evidence consumed, answer out."

---

## Step 5 — Upload page (`/upload`) — local mock demo

Navigate to `/upload`.

**Point out:**
- The **mode indicator** at the top — shows "Local demo upload active" (mock mode) — no wallet required
- "Files are saved to browser localStorage with deterministic mock Shelby references. No wallet signing, no network calls, and no real Shelby upload."
- The working form: title, category, source type, tags, description
- The **file drop area**: drag & drop or click to browse
- File size limit: 5 MB per file

**Demo the upload:**
1. Enter a title: "My Test Evidence Pack"
2. Select a small local file (e.g. a text file or image)
3. Watch the **SHA-256** hash appear under the file name as it computes
4. Click **"Save locally (mock Shelby reference)"**
5. See the **success screen** with:
   - Pack name
   - Number of blobs saved
   - Mode (local demo)
   - Links to blob detail pages
   - **A read receipt link** — click it to see the auto-generated receipt

**Click a blob link** — it opens `/blob/local-blob-...` and shows the full detail with a **"Local demo upload"** badge and a **Mock Reference** row that says `shelby://mock/blob/{id}` — a local demo identifier, not a real Shelby blob.

---

## Step 6 — Verify the read receipt

The success screen shows a **Read receipt** link. Click it (or navigate to `/read-receipt/local-rr-{uuid}`).

**Point out:**
- The **Receipt mode** badge: "Local demo upload"
- The **Query** block: the upload description you entered
- **Referenced blobs** section: shows the blob's Shelby ref, SHA-256 hash, source, and a "Local mock" data-source badge
- **Run ID**: `upload-{packId}` — tied to the upload that created this receipt

**Refresh the page** — the receipt must still resolve (persisted in localStorage). This demonstrates that read receipts survive browser refresh.

---

## Step 7 — Return to Dashboard

Navigate back to `/dashboard`.

**Point out:**
- A new **"Locally uploaded (1)"** section at the top with a green indicator dot
- Your uploaded pack appears as a card
- Stats bar now shows updated counts
- The **"Reset local data"** button (top-right of local section)
  - Click once → "Click again to confirm reset"
  - Click again → local packs disappear; demo data remains; local receipts also cleared

---

## Step 8 — C8 agent-run example (scripted end-to-end)

This step shows the full product story — `source evidence → agent run → EvidencePack → BlobRecord → ReadReceipt` — with zero credentials using the deterministic C8 script.

**In a separate terminal (dev server must already be running):**

```bash
npm run generate-agent-run
```

The script:
1. Reads `fixtures/c8-agent-input.json` (synthetic AI benchmark data — no network call).
2. Computes SHA-256 of the input and generates a deterministic analysis output.
3. Produces and persists to SQLite:
   - One EvidencePack: `c8-pack-agent-sentinel-v1`
   - Two BlobRecords: `c8-blob-input-v1` (input fixture), `c8-blob-output-v1` (agent output)
   - One ReadReceipt: `c8-rr-agent-sentinel-v1`
4. Prints generated IDs and the exact URL to inspect.

**Navigate to the read receipt:**

```
http://localhost:3000/read-receipt/c8-rr-agent-sentinel-v1
```

**Point out:**
- **Receipt mode** badge: "Local demo upload"
- **Query** block: the agent's task description
- **Answer summary**: deterministic benchmark analysis — top models per task, average accuracy scores
- **Referenced blobs**: two blob cards showing Shelby refs, SHA-256 hashes, and sources
  - `c8-blob-input-v1`: source `fixture://fixtures/c8-agent-input.json`
  - `c8-blob-output-v1`: source `agent://shelby-vault/c8/sentinel-v1/output.json`
- **Run ID**: `run-c8-agent-sentinel-v1`
- **Agent version**: `shelby-vault/c8-sentinel/1.0 (deterministic, no-llm)`

**Refresh the page** — the receipt resolves from SQLite (not localStorage), so it survives browser refresh and localStorage resets.

**Navigate to `/dashboard`** — the C8 pack appears in the "Locally uploaded" section.

The script is idempotent — running it again produces the same IDs via `INSERT OR REPLACE`.

---

## Step 9 — Code walkthrough (optional, for technical audience)

Open the repo in your editor.

1. **`fixtures/c8-agent-input.json`** — public synthetic benchmark fixture (input for the C8 agent)
2. **`scripts/generate-agent-run.mjs`** — C8 deterministic agent-run script (zero credentials)
3. **`src/lib/demo-data/`** — TypeScript types and static demo arrays (illustrative `shelby://demo/blob/` refs)
4. **`src/lib/evidence/service.ts`** — service functions (clean, no framework)
5. **`src/lib/shelby/`** — the adapter and browser-wallet layer:
   - `adapter.ts` — interface and types
   - `mock-adapter.ts` — deterministic local mock (produces `shelby://mock/blob/` refs)
   - `testnet-adapter.ts` — legacy server-side testnet placeholder
   - `browser-client.ts` — browser-side Shelby client config (NEXT_PUBLIC_ vars only)
   - `use-shelby-upload.ts` — React hook: browser wallet + useUploadBlobs
   - `status-map.ts` — conservative storage status mapping utilities
   - `config.ts` — reads `SHELBY_MODE` env var; two-plane architecture docs
   - `index.ts` — `getAdapter()` factory
4. **`src/app/actions/upload.ts`** — Server Action (API key stays server-side)
5. **`src/app/upload/providers.tsx`** — QueryClient + AptosWalletAdapterProvider (testnet path)
6. **`src/lib/validation.ts`** — `buildEvidencePack()`, `buildBlobRecord()`, `parseTags()`
7. **`src/lib/store/local-store.ts`** — localStorage read/write helpers for packs, blobs, and receipts
8. **`src/components/dashboard-client.tsx`** — merges demo + localStorage packs
9. **`src/components/read-receipt-client.tsx`** — resolves receipts from demo data or localStorage

Key message: "Mock mode is the default and requires zero configuration. The browser-wallet testnet path is isolated behind the adapter and hook boundary — operators can activate it with wallet + testnet config."

---

## Talking points

- **Why evidence packs?** Grouping related blobs into packs gives you a unit of provenance — one pack = one dataset or one agent run.
- **Why Shelby refs?** In local mode, `shelby://mock/blob/{id}` is a deterministic demo identifier. In testnet mode, `shelby://testnet/{account}/{blobName}` is a real Shelby blob identity registered on-chain.
- **Why read receipts?** AI outputs are only as trustworthy as their inputs. Read receipts make the input-output chain inspectable — and now they bind to real BlobRecord identity.
- **Why localStorage?** For demo purposes, localStorage is sufficient — uploads survive refresh, no server needed. A real backend is a future operator decision.
- **Why mock mode by default?** Zero setup. Any developer can clone, run, and upload in under a minute with no accounts or API keys.

---

## Testnet mode operator demo (advanced — requires prerequisites)

> **Honest prerequisites:** This path requires an Aptos testnet wallet, testnet APT for gas fees, Shelby storage credits, and manual browser interaction. CI does not and cannot run this path. Do not claim CI performed a real upload.

### Prerequisites
- [Petra wallet](https://petra.app/) or compatible Aptos wallet browser extension
- Testnet APT (from [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet))
- Shelby storage credits on the connected account
- `.env.local` with:
  ```env
  SHELBY_MODE=testnet
  NEXT_PUBLIC_SHELBY_NETWORK=testnet
  ```

### Steps
1. Start the dev server: `npm run dev`
2. Navigate to `/upload`
3. The mode indicator shows **"Shelby testnet upload"** — a wallet connect section appears
4. Click to connect your Aptos wallet (Petra or similar); ensure it is on **Aptos Testnet**
5. Select a small test file, fill in the form, and click **Upload**
6. Your wallet prompts you to sign an Aptos transaction — approve it
7. On success, the app shows:
   - `accountAddress`: your wallet address
   - `blobName`: e.g. `evidence/pack-id/abcdef01-test-file.json`
   - `shelbyRef`: `shelby://testnet/0x.../evidence/...`
   - `storageStatus`: `registered`
   - `explorerUrl`: Shelby explorer link
   - A **read receipt link** with `receiptMode: 'shelby-testnet'`

### Follow-up: C3 smoke harness

After a successful manual upload, you can verify retrieval with the smoke harness:

```bash
# Copy accountAddress and blobName from the upload success screen into .env.local:
# SHELBY_SMOKE=true
# SHELBY_SMOKE_ACCOUNT_ADDRESS=0xYourAddress
# SHELBY_SMOKE_BLOB_NAME=evidence/pack-id/abcdef01-test-file.json
# SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
# SHELBY_NETWORK=testnet

npm run smoke
```

See `docs/c3-smoke-test-guide.md` for full instructions, expected output, and exit code documentation.

---

## Verification (CI-safe)

These commands verify the app without requiring a funded wallet:

```bash
npm run lint                  # Must pass
npm run build                 # Must pass
npm run verify-community-demo # C9 harness: 35 DB-level assertions, zero credentials
```

The `verify-community-demo` harness (C9) creates an isolated temp SQLite database, runs the C8 generation path twice, and asserts all expected IDs, relationships, and idempotency in one automated step. See `docs/community-experiment-runbook.md` for the complete runbook.

The smoke harness is opt-in and disabled unless `SHELBY_SMOKE=true` is explicitly set.
