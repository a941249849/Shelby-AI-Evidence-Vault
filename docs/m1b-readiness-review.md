# M1B Readiness Review

Date: 2026-05-08

This review decides whether PR #4 can be treated as the M1B baseline for Shelby AI Evidence Vault.

## Decision

PR #4 is acceptable as the **M1B local/mock baseline**, pending final human merge/release handling.

M1B must not be interpreted as real Shelby upload. It is a demo milestone that proves local Evidence Pack intake, SHA-256 hashing, deterministic mock references, local persistence, and future-correct adapter boundaries.

## Scope Confirmed

M1B includes:

- Local file selection.
- Browser SHA-256 hash computation.
- Evidence Pack construction.
- Blob Record construction.
- Deterministic `shelby://mock/blob/{id}` references.
- Built-in illustrative `shelby://demo/blob/{id}` references.
- Browser `localStorage` persistence.
- Dashboard merge of demo and local data.
- Blob detail resolution for demo and local blobs.
- Fail-closed `SHELBY_MODE=testnet` adapter.
- Official-docs audit and staged production queue docs.

M1B excludes:

- Real Shelby upload.
- Official SDK integration.
- Wallet connection or signing.
- Private key, seed phrase, or mnemonic handling.
- On-chain registration.
- RPC `putBlob` network calls.
- Funding or faucet flows.
- Production database.
- Real AI/LLM calls.
- Marketplace, trading, exchange APIs, price/PnL, token speculation, or social posting.

## Network Boundary

Current product strategy:

- Use **Shelby testnet** as the default future real-integration target.
- Treat older `shelbynet` as legacy/developer-prototype context.
- Never mix `testnet` and `shelbynet` endpoint families in one runtime config.

Current M1B code behavior:

- `DEFAULT_SHELBY_NETWORK = 'testnet'`.
- `.env.example` documents testnet RPC/fullnode/indexer placeholders.
- `testnet-adapter.ts` still throws the canonical blocked-until-M2 error.
- No contract address is hardcoded into runtime code.

## Verification

Commands run:

```bash
npm run lint
npm run build
```

Result:

- `npm run lint` passed.
- `npm run build` passed.
- All 6 Next.js routes compiled successfully.

Local route smoke check:

```txt
/          -> 200
/upload    -> 200
/dashboard -> 200
```

Conflict-marker scan:

```bash
rg -n "<<<<<<<|=======|>>>>>>>" .
```

Result:

- No merge conflict markers found.

## Review Notes

- The original PR body is partially stale where it describes the old `shelbynet-correct` position. A PR comment now records the corrected source of truth.
- Issue #3 is superseded by the corrected M1A/M1B path. A comment was added there to avoid future Copilot drift.
- Issue #6 remains the product source of truth.
- `docs/production-queue.md` defines the next stage tasks and prevents Copilot from receiving small patch work.

## Next Stage

Do not assign Copilot small cleanup tasks.

After M1B is accepted or merged, the next Copilot-sized task is:

```txt
C1: M2 official Shelby testnet integration design spike
```

Expected C1 output:

- `docs/m2-shelby-testnet-integration-design.md`
- Official SDK/package API inspection.
- Testnet SDK/network config decision.
- Browser wallet vs server signer decision matrix.
- API key boundary.
- accountAddress + blobName persistence model.
- expiration/funding/transaction/status mapping.
- explicit blockers before real upload can be enabled.

Codex must review C1 before C2 implementation starts.
