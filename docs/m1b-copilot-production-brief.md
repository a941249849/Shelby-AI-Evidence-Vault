# M1B Copilot Production Brief

Issue: https://github.com/a941249849/Shelby-AI-Evidence-Vault/issues/5

Depends on: `docs/shelby-official-docs-audit.md`

## Goal

Turn the current M0 demo into an M1B demo upload and local persistence milestone while preserving the official-docs architecture reset from M1A.

M1B is not a real Shelby testnet upload milestone. It is a future-correct mock upload milestone that prepares the UI, local data model, and adapter boundary for a later M2 official SDK / wallet / shelbynet integration.

## Required Product Behavior

- Users can select files on `/upload`.
- The browser computes SHA-256 for each selected file.
- Submitting creates local demo evidence packs and blob records.
- Local records persist in browser `localStorage`.
- Dashboard shows built-in demo packs and locally uploaded packs clearly separated.
- Blob detail pages can resolve both built-in demo blobs and local uploaded blobs.
- Real Shelby/testnet mode must fail closed with a clear message.
- No private key, seed phrase, mnemonic, wallet payment, marketplace, trading, exchange, or real AI agent behavior is introduced.

## Architecture Rules

Use the official-docs audit as the source of truth:

- Real Shelby object identity must be modeled as account address plus blob name in M2, not only `shelby://.../blob/{id}`.
- Mock refs may remain for demo UX, but label them as local/demo references.
- Do not hardcode the `0xc63...` contract account from earlier notes as verified. The current official Networks page reviewed in M1A shows a different account.
- Do not collapse `testnet` and `shelbynet`. Treat exact network choice as M2-blocked until verified through official SDK behavior and current docs.
- Do not implement direct `fetch(SHELBY_RPC_URL, file)` upload. Official docs describe SDK/commitment/on-chain registration/RPC upload coordination.
- Do not add `PRIVATE_KEY`, `SEED_PHRASE`, `MNEMONIC`, or equivalent env vars.

## Recommended File Scope

Allowed:

- `.env.example`
- `README.md`
- `docs/architecture.md`
- `docs/demo-script.md`
- `docs/shelby-integration.md`
- `src/app/actions/upload.ts`
- `src/app/upload/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/blob/[id]/page.tsx`
- `src/components/dashboard-client.tsx`
- `src/components/blob-detail-client.tsx`
- `src/lib/shelby/*`
- `src/lib/store/local-store.ts`
- `src/lib/validation.ts`
- Existing demo type files if needed for optional local/demo fields.

Avoid:

- Authentication systems.
- Production database or ORM.
- Real Shelby SDK package installation for M1B, unless only adding commented docs. If installing packages, that turns into M2 and needs separate approval.
- Wallet adapter implementation.
- Any backend secret or private-key signing flow.

## Implementation Notes

### Adapter

Keep two modes:

- `mock`: deterministic local demo behavior, no network.
- `testnet`: placeholder that throws an explicit blocked error.

The placeholder error should say:

- Real Shelby upload is deferred to M2.
- Official docs require commitment generation, on-chain registration, and RPC upload.
- M2 must choose a signer model and network config before implementation.

### Local object model

Local records should carry fields useful for M2 migration:

- `blobName`
- `accountAddress` optional / unset for mock
- `shelbyRef` or `demoRef`, clearly labeled as mock/local
- `hash`
- `size`
- `mimeType`
- `uploadMode`
- `dataSource`

Do not represent mock references as verified official Shelby IDs.

### Environment docs

`.env.example` may document:

- `SHELBY_MODE=mock`
- `SHELBY_NETWORK`
- `SHELBY_RPC_URL`
- `SHELBY_API_KEY`
- `SHELBY_ACCOUNT_ADDRESS`
- `SHELBY_BLOB_EXPIRATION_MICROS`
- `APTOS_NETWORK`
- `SHELBYNET_APTOS_FULLNODE_URL`
- `SHELBYNET_INDEXER_URL`
- `SHELBYNET_FAUCET_URL`
- `SHELBYNET_ACCOUNT_ADDRESS`

But comments must say these are M2 planning/config fields, not proof that real upload works in M1B. Do not add private-key env vars.

### UI copy

Use plain labels:

- `Local demo upload`
- `Mock Shelby reference`
- `Real Shelby upload blocked until M2`
- `No wallet signing in M1B`

Avoid copy implying:

- Live Shelby upload succeeded.
- Testnet readiness.
- Wallet payment support.
- Marketplace, trading, or paid dataset flow.

## Required Verification

Run:

```bash
npm install
npm run lint
npm run build
```

If tests are unavailable, state that explicitly in the PR body. Do not invent a passing test suite.

## Acceptance Criteria

- `docs/shelby-official-docs-audit.md` remains in the repo.
- Upload works in mock/local mode without env vars.
- Local uploaded packs survive page refresh.
- Dashboard and blob detail pages show local/demo source labels.
- `SHELBY_MODE=testnet` fails closed and explains M2 blocker.
- Docs distinguish Shelby storage/RPC plane from Aptos coordination plane.
- Docs distinguish mock references from official account/blob-name identity.
- No private key, seed phrase, wallet payment, marketplace, trading, production DB, or real AI agent logic is added.

## Suggested PR Summary

```md
## Summary
- Adds M1A Shelby official-docs audit and resets the integration architecture around Shelby RPC/storage plus Aptos coordination.
- Ships M1B mock upload/local persistence only, with real Shelby upload blocked until M2.
- Keeps official SDK/wallet/shelbynet integration out of scope until network, signer, API key, and funding choices are verified.

## Verification
- npm install
- npm run lint
- npm run build

## Boundaries
- No real Shelby upload in M1B.
- No private key or seed phrase handling.
- No wallet payments, marketplace, trading, exchange APIs, production DB, or real AI agent logic.
```
