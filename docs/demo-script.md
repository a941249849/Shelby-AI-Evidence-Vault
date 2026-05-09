# Demo Script — Shelby AI Evidence Vault

A step-by-step walkthrough for demonstrating the **X14 persistent testnet session ledger candidate** to stakeholders or the community.

> **Current scope:**
> - The product UI is Chinese-first with a top-nav English toggle.
> - Local mock upload works with zero configuration (the default).
> - Browser-wallet Shelby testnet upload path exists for operators with funded wallets.
> - Built-in demo data uses illustrative `shelby://demo/blob/` references.
> - Local uploads get `shelby://mock/blob/{id}` references.
> - Real testnet uploads get `shelby://testnet/{account}/{blobName}` references and require a participant wallet with testnet APT and ShelbyUSD.
> - Real testnet read receipts include a receipt-level verification panel that aggregates every referenced Shelby testnet Blob.
> - `/testnet` now aggregates the latest testnet receipt and Blob records from browser cache plus SQLite into a copyable community test session summary.
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
- The Chinese-first Shelby ecosystem positioning: **面向 AI Agent 的可验证记忆**
- The dark **证据如何流动** board: 证据包 → Shelby Blob → 读取回执 → 可验证记忆
- The three primary actions: **上传证据**, **打开证据索引**, **查看回执**
- The stats cards: Evidence Pack count, Shelby Blob count, receipt count, SQLite storage boundary
- The **核心能力** cards: structured evidence packs, Blob identity, receipt proof, verifiable audit
- The public testnet band links into the dedicated `/testnet` launch console
- The **产品预览** cards: registry, upload, read receipt
- Toggle English in the top nav and confirm the product surface switches language

---

## Step 2 — Testnet launch console (`/testnet`)

Click **测试网 / Testnet** or navigate to `/testnet`.

**Point out:**
- This is the public entry point for community testnet participation.
- The runtime card shows whether the current deployment is still `mock` or has `SHELBY_MODE=testnet` enabled.
- The wallet readiness panel detects Aptos wallets, supports connect/disconnect, and shows account plus network status.
- The community test session panel remains empty until a real Shelby testnet upload exists; after upload it reads browser cache plus SQLite, shows the latest receipt, referenced Blobs, and a copyable session summary.
- The four participant steps are explicit: connect wallet, prepare test assets, upload evidence, inspect receipt.
- The product boundary section is honest: no mainnet claim, no private-key custody, no server signer, no token purchase flow.

---

## Step 3 — Dashboard (`/dashboard`)

Click **索引** or navigate to `/dashboard`.

**Point out:**
- The page is an **evidence registry**, not a file manager.
- Stats bar: indexed packs, active packs, tracked blobs, user packs
- Search/filter/sort controls for narrowing the evidence index
- The responsive grid of evidence pack cards
- Each card shows: title, status badge (green/gray/yellow), category badge, source type, tags, blob count, created date
- Five packs: dataset (Common Crawl), agent-run (GPT-4o legal extractor), manifest (arXiv), document (policy), dataset (synthetic QA benchmark)
- The **检查首个 Blob / Inspect first blob** link on each card, which opens the Blob provenance inspector instead of looping back to the index

After you upload a pack (Step 5), come back here to see the local/SQLite records appear in the user-created area. In Chinese this is surfaced as the local workspace / user-created evidence section; in English the labels switch through the top-nav language toggle.

---

## Step 4 — Blob detail (`/blob/blob-001`)

Navigate to `/blob/blob-001`.

**Point out:**
- The page title: **Blob 来源证明检查器**
- **Demo 引用** row: `shelby://demo/blob/a1b2c3d4...` — an illustrative demo reference, not a real Shelby blob identity
- **SHA-256 哈希** row: the content fingerprint
- **来源** row: the original URL from Common Crawl S3
- **MIME 类型**: `application/warc`
- **大小**: 50 MB
- **证据包** link: clicking it goes back to the dashboard for that pack
- **Demo 数据** badge: shows this is built-in demo data
- The proof panel states demo/mock references are not testnet-verifiable; real verification appears for Shelby testnet blobs
- Try `/blob/blob-003` — shows the GPT-4o agent output blob

---

## Step 5 — Read receipt (`/read-receipt/rr-001`)

Navigate to `/read-receipt/rr-001`.

**Point out:**
- The page title: **回答来源与证据使用情况**
- The **用户问题** block: the agent's question
- The **生成结果** block: what the agent found
- **运行 ID**: the unique agent run identifier
- **引用 Blob**: clickable links to `/blob/blob-003` — trace from answer back to source; shows Shelby ref, SHA-256 hash, and data-source badge
- **回执级测试网验证**: demo/local receipts explicitly say they are not testnet proofs; real Shelby testnet receipts expose a verify-all audit panel
- **证据包**: link to the pack that was consulted
- **Agent 版本**: `shelby-agent/0.3.0 gpt-4o-2024-01-25`

Explain: "Every time an agent runs, we can produce this receipt. It's a full audit trail — query in, evidence consumed, answer out."

---

## Step 6 — Upload page (`/upload`) — local mock demo

Navigate to `/upload`.

**Point out:**
- The top copy says this is a **证据入口**, not a generic local file manager.
- The mode indicator shows **本地 Demo 上传已启用** (mock mode) — no wallet required.
- "Files are saved to SQLite/browser fallback with deterministic mock Shelby references. No wallet signing, no network calls, and no real Shelby upload."
- The working form: title, category, source type, tags, description
- The **file drop area**: drag & drop or click to browse
- File size limit: 5 MB per file

**Demo the upload:**
1. Enter a title: "My Test Evidence Pack"
2. Select a small local file (e.g. a text file or image)
3. Watch the **SHA-256** hash appear under the file name as it computes
4. Click **保存到本地**
5. See the **success screen** with:
   - Pack name
   - Number of blobs saved
   - Mode (local demo)
   - Links to blob detail pages
   - **A read receipt link** — click it to see the auto-generated receipt

**Click a blob link** — it opens `/blob/local-blob-...` and shows the full detail with a **本地 Demo 上传** badge and a **Mock 引用** row that says `shelby://mock/blob/{id}` — a local demo identifier, not a real Shelby blob.

---

## Step 7 — Verify the read receipt

The success screen shows a **读取回执 / Read receipt** link. Click it (or navigate to `/read-receipt/local-rr-{uuid}`).

**Point out:**
- The **回执模式 / Receipt mode** badge: local demo upload
- The **用户问题 / Query** block: the upload description you entered
- **引用 Blob / Referenced blobs** section: shows the blob's Shelby ref, SHA-256 hash, source, and local mock data-source badge
- **回执级测试网验证 / Receipt-level testnet verification** section: local mock receipts show the boundary; Shelby testnet receipts can verify all referenced retrieval endpoints
- **Run ID**: `upload-{packId}` — tied to the upload that created this receipt

**Refresh the page** — the receipt must still resolve from SQLite, with browser cache as a local fallback. This demonstrates that read receipts survive browser refresh.

---

## Step 8 — Return to Dashboard (`/dashboard`)

Navigate back to `/dashboard`.

**Point out:**
- A local/SQLite user-created evidence section appears after upload
- Your uploaded pack appears as a card
- Stats bar now shows updated counts
- The **重置浏览器缓存 / Reset browser cache** button in the local records area
  - Click once → the confirmation label appears
  - Click again → browser-cached local records disappear; SQLite-persisted records remain; demo data remains

---

## Step 8.5 — Evidence registry search, filter, and sort

The dashboard toolbar lets reviewers quickly narrow the full evidence index without leaving the page.

**Search:**
- Type into the **搜索标题、标签、类别... / Search title, tags, category...** input box above the sections.
- The search covers pack title, description, category, source type, status, tags, and data source label.
- Example queries to try:
  - `C8` — finds the C8 agent-run pack
  - `benchmark` — finds the C8 pack and the Synthetic QA Benchmark demo pack
  - `agent-run` — finds all agent-run category packs
  - `archived` — finds the archived policy document
  - `local` — narrows to user-created/local records only

**Filters (dropdown controls next to the search box):**
- **全部类别 / All categories** — filter to Dataset, Agent run, Document, or Manifest
- **全部来源类型 / All source types** — filter to Web scrape, API export, Agent output, or Manual upload
- **全部状态 / All statuses** — filter to Verifiable, Archived, or Pending
- **全部来源 / All sources** — filter to local/uploaded records or built-in demo corpus

**Sort:**
- **最新优先 / Newest first** (default) — most recently created packs appear first
- **最早优先 / Oldest first** — chronological order
- **标题 A-Z / Title A-Z** — alphabetical sort
- **Blob 最多 / Most blobs** — packs with the most blobs at the top

**Counts:**
- The **"Packs indexed"** metric shows `N / total` when a filter is active (e.g. `3 / 6`).
- Section headers show `N / total shown` for the filtered subset.

**Clear/reset:**
- When any filter or search is active, a **清除筛选 / Clear filters** button resets all controls back to defaults.

**Empty state:**
- If no packs match the current filters, a bilingual empty state appears with a **重置筛选 / Reset filters** button.

**Important:** Filters and sort are client-side — they do not modify any stored data. The browser-cache reset button still only clears browser-cached local records; SQLite-persisted packs remain.

---

## Step 9 — C8 agent-run example (scripted end-to-end)

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
- **回执模式 / Receipt mode** badge: local demo upload
- **用户问题 / Query** block: the agent's task description
- **生成结果 / Answer summary**: deterministic benchmark analysis — top models per task, average accuracy scores
- **引用 Blob / Referenced blobs**: two blob cards showing Shelby refs, SHA-256 hashes, and sources
  - `c8-blob-input-v1`: source `fixture://fixtures/c8-agent-input.json`
  - `c8-blob-output-v1`: source `agent://shelby-vault/c8/sentinel-v1/output.json`
- **Run ID**: `run-c8-agent-sentinel-v1`
- **Agent version**: `shelby-vault/c8-sentinel/1.0 (deterministic, no-llm)`

**Refresh the page** — the receipt resolves from SQLite (not localStorage), so it survives browser refresh and localStorage resets.

**Navigate to `/dashboard`** — the C8 pack appears in the local/SQLite user-created evidence section.

The script is idempotent — running it again produces the same IDs via `INSERT OR REPLACE`.

---

## Step 10 — Code walkthrough (optional, for technical audience)

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
8. **`src/components/dashboard-client.tsx`** — merges demo + browser cache + SQLite packs
9. **`src/components/read-receipt-client.tsx`** — resolves receipts from demo data or localStorage

Key message: "Mock mode is the default and requires zero configuration. The browser-wallet testnet path is isolated behind the adapter and hook boundary — operators can activate it with wallet + testnet config."

---

## Talking points

- **Why evidence packs?** Grouping related blobs into packs gives you a unit of provenance — one pack = one dataset or one agent run.
- **Why Shelby refs?** In local mode, `shelby://mock/blob/{id}` is a deterministic demo identifier. In testnet mode, `shelby://testnet/{account}/{blobName}` is a real Shelby blob identity registered on-chain.
- **Why read receipts?** AI outputs are only as trustworthy as their inputs. Read receipts make the input-output chain inspectable — and now they bind to real BlobRecord identity.
- **Why SQLite plus browser cache?** SQLite is the local durable store for generated and uploaded records. Browser cache keeps the UI responsive and preserves older demo behavior, but it is no longer the only persistence path.
- **Why mock mode by default?** Zero setup. Any developer can clone, run, and upload in under a minute with no accounts or API keys.

---

## Testnet mode public participant demo (advanced — requires prerequisites)

> **Honest prerequisites:** This path requires an Aptos testnet wallet, testnet APT for gas fees, ShelbyUSD for upload costs, and manual browser interaction. CI does not and cannot run this path. Do not claim CI performed a real upload.

### Prerequisites
- [Petra wallet](https://petra.app/) or compatible Aptos wallet browser extension
- Testnet APT (from [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet))
- ShelbyUSD on the connected account
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
8. Open the generated Blob detail page and click **Verify retrieval** in the Shelby testnet proof panel.

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
npm run lint                        # Must pass
npm run build                       # Must pass
npm run shelby-doctor               # C11: mock-mode readiness check (zero credentials, always passes)
npm run verify-community-demo       # C9 harness: 35 DB-level assertions, zero credentials
npm run verify-release-candidate    # C12: full release-candidate gate — build + routes + doctor
```

The `verify-release-candidate` command (C12) is the one-command release-candidate gate. It runs the complete product loop end to end: shelby-doctor checks, community demo harness, C8 ID assertions, production build, and route smoke checks against a live server. Uses an isolated temp database. Zero credentials required. See `docs/release-candidate-checklist.md` for the full checklist.

The `verify-community-demo` harness (C9) creates an isolated temp SQLite database, runs the C8 generation path twice, and asserts all expected IDs, relationships, and idempotency in one automated step. See `docs/community-experiment-runbook.md` for the complete runbook.

The `shelby-doctor` (C11) inspects environment config only. In mock mode it passes with zero credentials. In testnet mode (`SHELBY_MODE=testnet npm run shelby-doctor`) it validates all required env vars and fails closed with actionable messages when config is missing.

The smoke harness is opt-in and disabled unless `SHELBY_SMOKE=true` is explicitly set.
