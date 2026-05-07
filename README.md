# Shelby AI Evidence Vault

![M0 Status](https://img.shields.io/badge/milestone-M0%20Demo-indigo?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

**A verifiable evidence storage and read-receipt demo for AI agents, built on Shelby testnet.**

---

## What is this?

Shelby AI Evidence Vault is a public demo showing how AI pipelines can store datasets, agent run outputs, and documents with:

- **Cryptographic blob references** — every file gets a `shelby://testnet/blob/{id}` reference and SHA-256 hash
- **Evidence packs** — structured groups of related blobs with metadata, tags, provenance, and status
- **Read receipts** — auditable records of agent queries: what was asked, what evidence was consulted, and what was answered

M0 is a fully working UI backed by mock data. M1 will wire up real Shelby testnet registration.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Fonts | Geist / Geist Mono (next/font) |
| Data | Static mock data (M0) |
| Adapter | Mock Shelby adapter (M0) |

---

## Quick start

```bash
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault
cd Shelby-AI-Evidence-Vault
npm install
npm run dev
# Open http://localhost:3000
```

No environment variables required for M0. All data is demo mock data.

---

## Page overview

| Route | Description |
|---|---|
| `/` | Landing page — hero, problem/solution, demo objects, quickstart |
| `/dashboard` | Browse all evidence packs with stats bar |
| `/upload` | Mock upload form (M0: disabled submit) |
| `/blob/[id]` | Blob detail: Shelby ref, hash, source, metadata |
| `/read-receipt/[id]` | Read receipt: run ID, query, answer, blob/pack links |

---

## Architecture overview

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout with Nav + footer
│   ├── page.tsx             # Landing page
│   ├── dashboard/           # Evidence pack browser
│   ├── upload/              # Mock upload form
│   ├── blob/[id]/           # Blob detail page
│   └── read-receipt/[id]/   # Read receipt detail page
├── components/              # Shared UI components
│   ├── nav.tsx
│   ├── badge.tsx
│   ├── status-badge.tsx
│   ├── evidence-pack-card.tsx
│   └── page-header.tsx
└── lib/
    ├── demo-data/           # Mock data (M0)
    ├── evidence/            # Service layer (reads demo-data)
    └── shelby/              # Shelby adapter (M0: mock)
```

**Service layer pattern:** UI components call `src/lib/evidence/service.ts` functions. The service reads from mock data in M0. In M1, it will call the Shelby adapter for writes and a real index for reads.

**Shelby adapter pattern:** `src/lib/shelby/adapter.ts` defines the `ShelbyAdapter` interface. `mockShelbyAdapter` implements it with fake data. In M1, a `realShelbyAdapter` will replace it with actual testnet calls — without changing service or UI code.

---

## Mock data

Demo data lives in `src/lib/demo-data/`:

- **`evidence-packs.ts`** — 5 evidence packs (dataset, agent-run, document, manifest)
- **`blobs.ts`** — 6 blobs with Shelby refs, hashes, MIME types, sizes
- **`read-receipts.ts`** — 4 read receipts with queries, answer summaries, blob/pack links

A serialized sample is available at `public/demo-data/sample-evidence-pack.json`.

---

## M0 limitations / M1 roadmap

### M0 (current)
- All data is static mock data — no real storage
- Upload form is disabled (no real upload)
- Shelby testnet adapter is mocked (returns fake refs)
- No authentication
- No search or filtering

### M1 (planned)
- Real Shelby testnet blob registration
- Working file upload with hash computation
- Read receipt generation from live agent runs
- Search and filter on evidence packs
- Basic auth or API key for uploads

---

## License

MIT
