# Demo Script — Shelby AI Evidence Vault

A step-by-step walkthrough for demonstrating the M0 app to stakeholders or the community.

## Prerequisites

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# App is running at http://localhost:3000
```

---

## Step 1 — Landing page (`/`)

Open `http://localhost:3000`.

**Point out:**
- The hero section: "AI agents need verifiable data memory."
- The M0 demo badge (top of hero): "M0 Demo — Shelby Testnet"
- The three CTA buttons: Launch Demo, View GitHub, Read Docs
- Scroll down to the **Problem** section — explain why data provenance matters for AI
- Scroll to **Solution** — evidence packs, Shelby blob references, read receipts
- Scroll to **How it Works** — the 4-step flow
- Scroll to **Sample evidence packs** — show 3 live cards from mock data
- Scroll to **Developer Quickstart** — show the 5-line git clone snippet

---

## Step 2 — Dashboard (`/dashboard`)

Click "Launch Demo" or navigate to `/dashboard`.

**Point out:**
- Stats bar: 5 total packs, 3 active, 6 total blobs
- The 3-column responsive grid of evidence pack cards
- Each card shows: title, status badge (green/gray/yellow), category badge, source type, tags, blob count, created date
- Five packs: dataset (Common Crawl), agent-run (GPT-4o legal extractor), manifest (arXiv), document (policy), dataset (synthetic QA benchmark)
- The "View blobs →" link on each card

---

## Step 3 — Blob detail (`/blob/blob-001`)

Navigate to `/blob/blob-001`.

**Point out:**
- The full blob metadata table
- **Shelby Reference** row: `shelby://testnet/blob/a1b2c3d4...` — this is what M1 will register on-chain
- **SHA-256 Hash** row: the content fingerprint
- **Source** row: the original URL from Common Crawl S3
- **MIME Type**: `application/warc`
- **Size**: 50 MB
- **Evidence Pack** link: clicking it goes back to the dashboard for that pack
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

## Step 5 — Upload page (`/upload`)

Navigate to `/upload`.

**Point out:**
- The **M0 Demo banner** at the top: "Upload is mocked. Real Shelby testnet integration coming in M1."
- The form fields: title, category, source type, tags, description
- The **file drop area** (placeholder): "Drag and drop files here — M0 placeholder"
- The disabled **"Upload to Shelby Testnet"** button with tooltip "Real upload coming in M1"
- Explain the M1 plan: files will be hashed client-side, uploaded to Shelby testnet, and a blob record + evidence pack created automatically

---

## Step 6 — Code walkthrough (optional, for technical audience)

Open the repo in your editor.

1. **`src/lib/demo-data/`** — show the TypeScript types and mock arrays
2. **`src/lib/evidence/service.ts`** — show the service functions (clean, no framework)
3. **`src/lib/shelby/adapter.ts`** — show the `ShelbyAdapter` interface and `mockShelbyAdapter`
4. **`src/app/blob/[id]/page.tsx`** — show a Server Component calling `getBlobById(id)`
5. **`src/app/upload/page.tsx`** — show the Client Component with `useState`

Key message: "When M1 comes, only the adapter changes. The service, UI, and types stay the same."

---

## Talking points

- **Why evidence packs?** Grouping related blobs into packs gives you a unit of provenance — one pack = one dataset or one agent run.
- **Why Shelby refs?** `shelby://testnet/blob/{id}` is a stable, content-addressable pointer. Even if the file moves, the reference is permanent on testnet.
- **Why read receipts?** AI outputs are only as trustworthy as their inputs. Read receipts make the input-output chain inspectable.
- **Why M0 mock data?** The demo is reproducible with zero setup. Any developer can clone and run it in under a minute.
