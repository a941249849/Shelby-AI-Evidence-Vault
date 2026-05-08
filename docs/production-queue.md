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
- PR #4 is the active M1B PR.
- M1B scope is local/mock only.
- UI is frozen for now.
- Real Shelby upload remains blocked until M2.
- Current real-integration target should be Shelby testnet, not the older shelbynet developer-prototype default.

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

Copilot involvement:

None, unless a large regression appears.

## Copilot Task Queue

### Task C1: M2 official Shelby testnet integration design spike

Owner: Copilot

Size: Large

When to start:

After PR #4 is merged or explicitly accepted as the M1B baseline.

Goal:

Produce an implementation-ready M2 design for real Shelby testnet integration without wiring production upload into the UI.

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
- docs/shelby-official-docs-audit.md
- docs/shelby-integration.md
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

When to start:

Only after C1 is reviewed by Codex and the signer/account strategy is approved.

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

## Codex Task Queue

### Task X1: M1B merge-readiness review

Owner: Codex

Goal:

Review PR #4 as the local/mock M1B milestone and make small corrections directly if needed.

### Task X2: UI redesign pass

Owner: Codex

Goal:

After protocol boundaries stabilize, redesign the app UI toward a stronger Shelby/product-grade visual direction. This remains paused until backend/product milestones need UI again.

### Task X3: M2 design review

Owner: Codex

Goal:

Review C1 output before any real upload implementation starts.

## Immediate Next Action

Do not give Copilot another small patch task.

Codex should finish M1B readiness locally. After M1B is accepted, dispatch Task C1 as the next Copilot task.
