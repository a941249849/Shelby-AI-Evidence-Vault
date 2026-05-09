# Final Copilot Review Brief — Shelby AI Evidence Vault

Date: 2026-05-09
Status: X16 final review package

This brief is the single handoff for final Copilot review after Codex-owned product direction, UI implementation, Shelby-doc alignment, and public testnet handoff work.

## Product Target

Shelby AI Evidence Vault is a public Shelby testnet candidate for AI evidence provenance:

```txt
source file / dataset / agent output
  -> Evidence Pack
  -> Shelby Blob identity
  -> Read Receipt
  -> public testnet handoff summary
```

The local/mock path is a zero-credential review fallback. The real protocol path is the browser-wallet Shelby testnet upload flow.

## Review Branch

Review the branch that contains the X14-X16 work:

```bash
codex/x14-persistent-testnet-session-ledger
```

Do not open new small-fix tasks unless there is a concrete blocker. The review should answer whether the current candidate is merge-ready or identify blocking issues.

## Required Automated Gates

Run from a clean checkout:

```bash
npm install
npm run lint
npm run build
npm run verify-release-candidate
npm run final-readiness
```

Expected release-candidate result:

```txt
Passed  : 23
Failed  : 0
Skipped : 0
```

The verifier must include:

- Shelby doctor mock PASS.
- Shelby doctor testnet fail-closed with missing config.
- Public `NEXT_PUBLIC_SHELBY_API_KEY` guard.
- Community demo DB harness.
- C8 deterministic agent-run IDs and idempotency.
- X15 public testnet handoff JSON contract.
- `verify-testnet-handoff` accepts a copied handoff JSON file.
- Production build.
- Route smoke checks for `/`, `/dashboard`, `/testnet`, `/upload`, `/blob/blob-001`, `/read-receipt/rr-001`, and `/read-receipt/c8-rr-agent-sentinel-v1`.
- `final-readiness` writes `artifacts/final-readiness/latest.json` and reports code-candidate readiness separately from manual gates.

## Manual Product Review

Start the app:

```bash
npm run dev
```

Inspect:

| Route | Must verify |
|---|---|
| `/` | Shelby ecosystem positioning, Chinese-first UI, English toggle, real product flow rather than landing-page filler |
| `/testnet` | Runtime mode, wallet readiness, upload entry, proof path, community session, copyable handoff summary |
| `/dashboard` | Demo/local/SQLite/Shelby testnet records, data-source filter, card badges, first-Blob deep links |
| `/upload` | Mock fallback, testnet wallet gating, SHA-256 hash generation, receipt link after success |
| `/blob/blob-001` | Provenance, Shelby ref, mock/testnet boundary, proof panel |
| `/read-receipt/rr-001` | Blob identity resolution, proof boundary, receipt-level audit panel |
| `/read-receipt/c8-rr-agent-sentinel-v1` | Deterministic agent-run receipt resolves from SQLite |

## Real Shelby Testnet Acceptance

This cannot be run in CI. It requires:

- `SHELBY_MODE=testnet`
- `NEXT_PUBLIC_SHELBY_NETWORK=testnet`
- Aptos browser wallet on Aptos Testnet
- Testnet APT
- ShelbyUSD or the current Shelby testnet storage credit requirement

Manual proof path:

1. Open `/testnet`.
2. Connect wallet and confirm Aptos Testnet readiness.
3. Open `/upload`.
4. Upload one small file through the browser-wallet path.
5. Open the generated Blob page and run proof verification.
6. Open the generated read receipt and run receipt-level verification.
7. Return to `/testnet` and copy the handoff JSON.
8. Confirm the handoff JSON includes `routes`, `latestReceipt.url`, `blobs[].url`, `explorerUrl`, `retrievalUrl`, `smokeCommands`, and `acceptanceStatus`.
9. Save the JSON locally and run `npm run verify-testnet-handoff -- path/to/handoff.json`.
10. Run the generated smoke command if operator credentials and endpoint access are available.

## Files To Inspect Closely

| Area | Files |
|---|---|
| Testnet launch and handoff | `src/components/testnet-page-client.tsx`, `src/lib/testnet/handoff.mjs` |
| Browser-wallet upload | `src/app/upload/page.tsx`, `src/lib/shelby/use-shelby-upload.ts`, `src/lib/shelby/browser-client.ts` |
| Proof verification | `src/components/blob-detail-client.tsx`, `src/components/read-receipt-client.tsx`, `src/app/actions/verify.ts` |
| Persistence | `src/app/actions/persist.ts`, `src/lib/server/evidence-store.ts`, `src/lib/server/db.ts`, `src/lib/store/local-store.ts` |
| Acceptance gates | `scripts/verify-release-candidate.mjs`, `scripts/verify-testnet-handoff.mjs`, `scripts/final-readiness.mjs`, `scripts/shelby-doctor.mjs`, `scripts/shelby-smoke.mjs` |
| Product boundaries | `README.md`, `docs/final-product-acceptance.md`, `docs/public-testnet-participation.md` |

## Security Boundaries

Block the release if any of these regress:

- No private keys or seed phrases.
- No server signer.
- No `NEXT_PUBLIC_SHELBY_API_KEY`.
- No mainnet or production-hosted storage claim.
- No trading, payment, marketplace, or token-sale surface.
- Mock refs must remain clearly separate from Shelby testnet proof.
- Real testnet upload must remain wallet-gated and fail closed when config or wallet state is missing.

## Expected Review Output

Return one of:

- `merge-ready`: no blocking issues found.
- `blocked`: include exact file/line references, reproduction steps, and failing command or route.
- `needs-real-testnet-run`: automated gates pass, but final public release is waiting on operator wallet/funding verification.

Do not request small cosmetic changes unless they block community testing or create a security/product-claim problem.
