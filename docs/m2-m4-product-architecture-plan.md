# M2-M4 Product Architecture Plan

Date: 2026-05-08

Status: **Codex frozen plan for post-M1B production**

This document is the product and architecture plan that should be reviewed before any new Copilot production task starts. It consolidates the Shelby official-docs audit, M1B readiness review, and product roadmap into a staged engineering plan.

Copilot must not be asked to improvise product direction from this point. Copilot should only receive large production tasks cut from this plan after the relevant gate is marked ready.

## Product Positioning

Shelby AI Evidence Vault is a verifiable evidence storage and read-receipt layer for AI agents.

It is not:

- A generic file drive.
- A generic upload demo.
- A token, trading, or marketplace product.
- A wallet/payment demo.
- A production database or auth product.

The product promise is:

```txt
Data source
-> Evidence Pack
-> Shelby Blob identity
-> Agent reference
-> Read Receipt
-> Visual traceability
```

M1B proves the shape locally. M2-M4 connect that shape to real Shelby testnet storage and then bind read receipts to real Shelby references.

## Non-Negotiable Boundaries

These boundaries are product safety rails and must remain visible in docs, UI, and task specs.

- No trading, exchange API, market signal, PnL, token speculation, or marketplace features.
- No real AI/LLM calls until explicitly approved.
- No production database until explicitly approved.
- No wallet payment UX.
- No private key, seed phrase, or mnemonic in source, examples, docs snippets, or `.env.example`.
- No `NEXT_PUBLIC_SHELBY_API_KEY` unless current official docs explicitly prove that the key is browser-safe and scoped.
- No hardcoded Shelby smart-contract account in runtime code.
- No mixing `testnet` and older `shelbynet` endpoint families in the same runtime config.
- No real Shelby upload enabled by default.
- Every incomplete real integration path must fail closed.

## Current Baseline

M1B is merged as the local/mock baseline.

Current implemented behavior:

- User selects files.
- Browser computes SHA-256.
- App creates Evidence Pack and Blob Record objects.
- App creates deterministic `shelby://mock/blob/{id}` refs.
- Built-in demo data uses illustrative `shelby://demo/blob/{id}` refs.
- Local uploads persist in browser `localStorage`.
- Dashboard and blob detail pages resolve demo and local objects.
- `SHELBY_MODE=testnet` fails closed with a blocked-until-M2 message.

Current baseline docs:

- `docs/shelby-official-docs-audit.md`
- `docs/shelby-integration.md`
- `docs/m1b-readiness-review.md`
- `docs/production-queue.md`

## Official Shelby Facts That Shape The Plan

The real upload path is not a single storage PUT.

Official docs establish:

- Shelby has a Shelby RPC/storage plane and an Aptos coordination plane.
- Real write flow includes local encoding/commitment generation, on-chain registration, transaction confirmation, then RPC upload.
- RPC upload happens after registration because RPC validates the registered commitment state.
- Real blob identity is account namespace + blob name.
- Real integration needs account/signer context, expiration, gas/funding, RPC config, and API-key policy.

Network target:

- M2/M3 target is official Shelby `testnet`.
- Older `shelbynet` remains legacy/developer-prototype context.
- `testnet` tuple currently documented:
  - Shelby RPC: `https://api.testnet.shelby.xyz/shelby`
  - Aptos fullnode: `https://api.testnet.aptoslabs.com/v1`
  - Aptos indexer: `https://api.testnet.aptoslabs.com/v1/graphql`
  - Explorer: `https://explorer.shelby.xyz/testnet`
  - Smart contract account: verify at implementation time from official docs.

SDK/docs signals:

- Node SDK entry point: `@shelby-protocol/sdk/node`, `ShelbyNodeClient`.
- Browser SDK entry point: `@shelby-protocol/sdk/browser`, `ShelbyClient`.
- React package: `@shelby-protocol/react`.
- Aptos dependency: `@aptos-labs/ts-sdk`.
- Browser upload guide uses Aptos wallet adapter, encode/commit helpers, transaction signing, then `rpc.putBlob`.

## Architecture Target

### Layer 1: UI and Product Experience

Owner: Codex

Responsibilities:

- Product framing.
- UI design and implementation.
- Upload form and status display.
- Evidence/receipt visualization.
- Wallet/funding/status UX only after architecture is approved.

Rules:

- UI must never contain protocol logic.
- UI must distinguish local mock refs, demo refs, and real Shelby identities.
- UI must not imply real upload works before M3.
- UI must not introduce wallet or payment UX in M2.

### Layer 2: Evidence Domain

Owner: Codex for model shape; Copilot may implement large backend changes later.

Core objects:

```ts
EvidencePack {
  id: string;
  title: string;
  category: 'dataset' | 'agent-run' | 'document' | 'manifest';
  sourceType: string;
  tags: string[];
  description?: string;
  createdAt: string;
  blobCount: number;
  status: 'active' | 'archived' | 'pending';
  dataSource?: 'demo' | 'local' | 'shelby-testnet';
}

BlobRecord {
  id: string;
  evidencePackId: string;
  fileName: string;
  shelbyRef: string;
  hash: string;
  source: string;
  tags: string[];
  createdAt: string;
  size: number;
  mimeType: string;
  dataSource?: 'demo' | 'local' | 'shelby-testnet';
  uploadMode?: 'mock' | 'testnet';
  mockRef?: string;
  blobName?: string;
  accountAddress?: string;
  network?: 'mock' | 'testnet';
  transactionHash?: string;
  expirationMicros?: string;
  storageStatus?: string;
  commitmentRoot?: string;
  explorerUrl?: string;
  retrievalUrl?: string;
}

ReadReceipt {
  runId: string;
  query: string;
  answerSummary: string;
  referencedBlobIds: string[];
  referencedPackIds: string[];
  modelOrAgentVersion?: string;
  createdAt: string;
  receiptMode?: 'demo' | 'local' | 'shelby-testnet';
}
```

M2 may refine these fields as TypeScript types, but should not add a database.

### Layer 3: Shelby Adapter Boundary

Owner: Codex for interface; Copilot for large protocol implementation later.

Current M1B adapter is intentionally fail-closed for testnet.

Target M3 adapter input:

```ts
ShelbyRealUploadInput {
  fileBytes: Uint8Array;
  fileName: string;
  blobName: string;
  mimeType: string;
  size: number;
  sha256: string;
  metadata: Record<string, string>;
  expirationMicros: string;
  network: 'testnet';
}
```

Target M3 adapter output:

```ts
ShelbyRealUploadResult {
  accountAddress: string;
  blobName: string;
  network: 'testnet';
  transactionHash?: string;
  commitmentRoot?: string;
  storageStatus: 'registered' | 'uploading' | 'ready' | 'failed' | 'unknown';
  shelbyRef: string;
  explorerUrl?: string;
  retrievalUrl?: string;
  uploadedAt: string;
}
```

The exact function names and SDK calls are M2/M3 implementation details. The product contract is stable: real identity is account + blob name plus verifiable status metadata.

### Layer 4: Network / Signer Boundary

This is the key decision area before real upload.

Allowed strategies:

1. Browser wallet signing.
2. Server-side demo signer.
3. Two-path architecture with browser wallet as the public default and server signer only for controlled demo/ops.

Not allowed:

- Private key in `.env.example`.
- Mnemonic or seed phrase anywhere.
- UI that asks users to paste a private key.
- Hidden default real upload without explicit operator-controlled config.

Recommended path:

```txt
M2 design: decide and document strategy.
M3 first implementation: browser wallet path if official SDK/wallet docs are sufficient.
Fallback: server-side demo signer only if explicitly approved and secret custody is designed outside source/docs.
```

Reason:

- Browser docs already show wallet signing.
- Server-side signer creates custody and secret-management risk.
- Public ecosystem demo is stronger if the user can see wallet/account ownership rather than relying on hidden server custody.

### Layer 5: Local Index / Persistence

M1B uses `localStorage`.

M2 and M3 should keep `localStorage` unless a concrete requirement forces a server index.

Allowed in M3:

- Store real testnet metadata in localStorage after successful upload.
- Store account/blobName/network/status fields in BlobRecord.
- Keep demo/local/real records visually distinct.

Not allowed in M3 without explicit approval:

- Supabase.
- Prisma production DB.
- Auth system.
- Multi-user account model.
- Background jobs.

## Milestone Plan

### M2: Frozen Official Integration Design

Owner: Codex

Goal:

Freeze the implementation plan before Copilot writes real integration code.

Deliverable:

- `docs/m2-shelby-testnet-integration-design.md`

This document must answer:

- Exact official package versions and import paths at time of design.
- SDK network/config shape for testnet.
- Browser wallet vs server signer decision.
- API key public/private boundary.
- Required env vars.
- Real upload sequence.
- BlobRecord/ReadReceipt field mapping.
- Error and status states.
- M3 task packet for Copilot.

M2 is not complete until Codex has reviewed and marked the design ready for production.

Copilot involvement:

- Not yet, unless Codex explicitly uses Copilot for a single large documentation task after this plan is accepted.

### M3: Real Shelby Testnet Upload

Owner: Copilot for protocol/backend implementation; Codex for review and UI guardrails.

Start condition:

- M2 design accepted.
- Signer strategy approved.
- API key/funding requirements known.
- Required testnet account/funding available or the task is scoped to fail-closed implementation only.

Goal:

Implement real Shelby testnet upload behind the adapter boundary.

Production scope:

- Install approved SDK packages.
- Implement real upload adapter or service layer.
- Decode existing base64 payload to bytes.
- Generate commitments through official SDK.
- Register blob on-chain.
- Wait for transaction confirmation.
- Upload through Shelby RPC.
- Return real account/blobName/status fields.
- Preserve mock default.
- Preserve fail-closed behavior for incomplete config.
- Add non-secret smoke script if feasible.

Out of scope:

- UI redesign.
- Wallet UI polish.
- Production DB.
- Real AI calls.
- Marketplace/trading.

### M4: Read Receipt Binding

Owner: Codex for product/UX; Copilot for large backend/data implementation if needed.

Start condition:

- M3 real upload path works or is at least represented by stable real metadata fields.

Goal:

Make read receipts bind to actual Shelby testnet blob identities.

M4 product behavior:

```txt
Evidence Pack uploaded to Shelby testnet
-> BlobRecord stores accountAddress + blobName + status
-> User creates or views a Read Receipt
-> Receipt references real BlobRecords
-> Receipt exposes evidence lineage and retrieval/explorer links
```

M4 may still use mocked answer summaries. Real LLM calls remain out of scope unless explicitly approved.

### M5: Public Ecosystem Package

Owner: Codex

Goal:

Package the project for public ecosystem presentation.

Deliverables:

- Polished README.
- English and Chinese positioning.
- Demo script.
- Screenshots or video.
- Shelby ecosystem submission material.
- Clear milestone status: local/mock vs real testnet vs read receipt binding.

## Required M2 Design Decisions

### Decision D1: SDK Route

Default recommendation:

- Browser-first if official browser/react SDK examples are current and complete.
- Server signer only if browser path is blocked and operator explicitly approves custody design.

Why:

- Official browser guide shows wallet signing and `rpc.putBlob`.
- Server signer introduces private key custody risk.
- The public demo benefits from transparent account ownership.

### Decision D2: Network Config

Default:

```env
SHELBY_NETWORK=testnet
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
APTOS_NETWORK=testnet
SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1
SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
```

M2 must verify:

- SDK network constant or custom network config.
- Current contract account.
- Whether Shelby SDK wants Aptos `Network.TESTNET`, raw `testnet`, or a Shelby-specific config object.

### Decision D3: API Key Boundary

Default:

- `SHELBY_API_KEY` remains server-only.
- No `NEXT_PUBLIC_SHELBY_API_KEY`.
- If browser SDK requires a client key, M2 must prove the key is scoped and browser-safe from official docs before adding any `NEXT_PUBLIC_*` variable.

### Decision D4: Expiration

Default:

- M3 requires explicit expiration configuration.
- UI should eventually expose expiration as a controlled field, but M3 can start with env/default config if the design says so.

### Decision D5: Funding

Default:

- Funding is operational setup, not a product feature in M3.
- Do not add faucet/funding UI yet.
- M2 docs must state what token/gas requirements exist and how an operator prepares the account.

## Copilot Production Policy

Copilot must only receive tasks shaped like this:

- One stage.
- One branch/PR.
- Clear files or modules.
- Clear acceptance criteria.
- Explicit out-of-scope list.
- Required verification commands.
- No product improvisation.

Copilot must not receive:

- "Fix the wording."
- "Make it nicer."
- "Clean up small docs."
- "Polish UI."
- "Figure out the product."
- "Patch whatever you find."

## Next Copilot Task Packet

Do not dispatch until this plan is accepted.

Task name:

```txt
M2: Shelby testnet integration design document
```

Owner:

Copilot

Size:

Large single task

Expected PR:

One PR against `main`.

Expected output:

```txt
docs/m2-shelby-testnet-integration-design.md
```

Allowed code changes:

- None by default.
- Type/interface comments only if absolutely required and explained in PR summary.

Task instructions:

```txt
Read:
- docs/m2-m4-product-architecture-plan.md
- docs/shelby-official-docs-audit.md
- docs/shelby-integration.md
- docs/m1b-readiness-review.md
- src/lib/shelby/*
- src/app/actions/upload.ts
- .env.example

Create docs/m2-shelby-testnet-integration-design.md.

Do not implement real upload.
Do not add SDK packages.
Do not modify UI.
Do not introduce private key, seed phrase, mnemonic, or wallet UI.
Do not add production DB.

The design must be implementation-ready for M3 and must include:
- official package/API surface checked
- testnet network config
- SDK config decision or documented ambiguity
- signer strategy decision matrix
- API key boundary
- env var plan
- data-model mapping
- upload sequence
- read receipt implications
- M3 implementation task outline
- blockers and verification checklist

Run:
- npm run lint
- npm run build
```

## Stage Gate Checklist

Before dispatching Copilot M2:

- This plan exists on `main`.
- Product owner accepts the plan direction.
- Prior paused C1 instruction remains superseded.
- Copilot receives the task packet above, not a free-form instruction.

Before dispatching Copilot M3:

- M2 design document exists.
- Codex has reviewed it.
- Signer strategy is approved.
- API key boundary is approved.
- Testnet funding/account requirement is known.
- Failure modes are defined.

Before dispatching M4:

- M3 real upload metadata is stable.
- BlobRecord fields can represent real account/blobName/status.
- Read receipt UX target is confirmed by Codex.

## Final Position

The project should now proceed by gated stages:

```txt
M1B merged
-> Codex frozen M2-M4 plan
-> Copilot M2 design document
-> Codex review
-> Copilot M3 real upload implementation
-> Codex UI/product integration
-> M4 read receipt binding
```

This is the engineering control structure for the next phase.
