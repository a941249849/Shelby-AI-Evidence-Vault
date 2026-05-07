# Demo Script — Shelby AI Evidence Vault

A step-by-step walkthrough for demonstrating the M1 app to stakeholders or the community.

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
- The **M1 Demo** badge (top of hero): "M1 Demo — Shelby Testnet"
- The three CTA buttons: Launch Demo, View GitHub, Read Docs
- Scroll down to the **Problem** section — explain why data provenance matters for AI
- Scroll to **Solution** — evidence packs, Shelby blob references, read receipts
- Scroll to **How it Works** — the 4-step flow
- Scroll to **Sample evidence packs** — show 3 live cards from demo data
- Scroll to **Developer Quickstart** — show the 5-line git clone snippet

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
- **Shelby Reference** row: `shelby://testnet/blob/a1b2c3d4...` — the content-addressable reference
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
- **Referenced Blobs**: clickable links to `/blob/blob-003` — trace from answer back to source
- **Evidence Packs**: link to the pack that was consulted
- **Agent Version**: `shelby-agent/0.3.0 gpt-4o-2024-01-25`

Explain: "Every time an agent runs, we can produce this receipt. It's a full audit trail — query in, evidence consumed, answer out."

---

## Step 5 — Upload page (`/upload`) — **NEW in M1**

Navigate to `/upload`.

**Point out:**
- The **mode indicator** at the top — shows "Mock mode" or "Shelby testnet mode"
- In mock mode: "Shelby refs are generated deterministically from your file hash"
- The working form: title, category, source type, tags, description
- The **file drop area**: drag & drop or click to browse
- File size limit: 5 MB per file

**Demo the upload:**
1. Enter a title: "My Test Evidence Pack"
2. Select a small local file (e.g. a text file or image)
3. Watch the **SHA-256** hash appear under the file name as it computes
4. Click **"Upload to Shelby"**
5. See the **success screen** with:
   - Pack name
   - Number of blobs uploaded
   - Mode (mock)
   - Links to blob detail pages

**Click a blob link** — it opens `/blob/local-blob-...` and shows the full detail with a **"Local (mock)"** badge.

---

## Step 6 — Return to Dashboard

Navigate back to `/dashboard`.

**Point out:**
- A new **"Locally uploaded (1)"** section at the top with a green indicator dot
- Your uploaded pack appears as a card
- Stats bar now shows updated counts
- The **"Reset local demo data"** button (top-right of local section)
  - Click once → "Click again to confirm reset"
  - Click again → local packs disappear; demo data remains

---

## Step 7 — Code walkthrough (optional, for technical audience)

Open the repo in your editor.

1. **`src/lib/demo-data/`** — TypeScript types and static demo arrays
2. **`src/lib/evidence/service.ts`** — service functions (clean, no framework)
3. **`src/lib/shelby/`** — the dual-mode adapter structure:
   - `adapter.ts` — interface
   - `mock-adapter.ts` — deterministic mock
   - `testnet-adapter.ts` — placeholder with M2 implementation notes
   - `config.ts` — reads `SHELBY_MODE` env var
   - `index.ts` — `getAdapter()` factory
4. **`src/app/actions/upload.ts`** — Server Action (API key stays server-side)
5. **`src/lib/validation.ts`** — `buildEvidencePack()`, `buildBlobRecord()`, `parseTags()`
6. **`src/lib/store/local-store.ts`** — localStorage read/write helpers
7. **`src/components/dashboard-client.tsx`** — merges demo + localStorage packs

Key message: "When M2 comes with real Shelby SDK access, only `testnet-adapter.ts` changes. The server action, validation, store, and UI stay the same."

---

## Talking points

- **Why evidence packs?** Grouping related blobs into packs gives you a unit of provenance — one pack = one dataset or one agent run.
- **Why Shelby refs?** `shelby://testnet/blob/{id}` is a stable, content-addressable testnet blob reference tied to the SHA-256 hash.
- **Why read receipts?** AI outputs are only as trustworthy as their inputs. Read receipts make the input-output chain inspectable.
- **Why localStorage?** For M1 demo purposes, localStorage is sufficient — uploads survive refresh, no server needed. M2 can add a real backend.
- **Why mock mode by default?** Zero setup. Any developer can clone, run, and upload in under a minute with no accounts or API keys.

---

## Enabling testnet mode (for technical demos)

```bash
cp .env.example .env.local
# Edit .env.local:
# SHELBY_MODE=testnet
# SHELBY_API_KEY=...
npm run dev
```

> **M1 note:** The real testnet adapter is a placeholder. The upload will show a clear error until the SDK is wired in (M2+). Mock mode continues to work.

