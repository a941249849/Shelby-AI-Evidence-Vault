# Public Testnet Release Playbook

Date: 2026-05-09
Status: X19 operator package

This is the single operator playbook for moving Shelby AI Evidence Vault from
code-candidate readiness to a community-facing Shelby public testnet run.

## Release Shape

The product is a Shelby ecosystem application for AI evidence provenance:

```txt
Source file / dataset / agent output
  -> Evidence Pack
  -> Shelby Blob identity
  -> Read Receipt
  -> public testnet handoff
```

Mock + SQLite remains the zero-credential preview path. The release target is
the browser-wallet Shelby testnet path where a participant connects an Aptos
Testnet wallet, uploads evidence to Shelby testnet, verifies the Blob and read
receipt, then copies a handoff JSON for community review.

## Automated Local Gate

Run these from the repository root:

```bash
npm run lint
npm run build
npm run verify-release-candidate
npm run final-readiness
npm run public-testnet-release-pack
```

Expected result:

- `verify-release-candidate` reports `Passed: 23`, `Failed: 0`, `Skipped: 0`.
- `final-readiness` reports `Code candidate ready : yes`.
- `public-testnet-release-pack` writes `artifacts/public-testnet-release/latest.json`.

Runtime artifacts under `artifacts/` are ignored by Git.

## Deployment Environment

Required:

```bash
SHELBY_MODE=testnet
NEXT_PUBLIC_SHELBY_NETWORK=testnet
```

Recommended public endpoint overrides:

```bash
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql
NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24
```

Forbidden:

```bash
NEXT_PUBLIC_SHELBY_API_KEY=
NEXT_PUBLIC_SHELBY_SECRET=
NEXT_PUBLIC_SHELBY_SECRET_KEY=
NEXT_PUBLIC_SHELBY_PRIVATE_KEY=
NEXT_PUBLIC_SHELBY_SEED=
NEXT_PUBLIC_SHELBY_MNEMONIC=
```

Do not add private keys, seed phrases, or server signer material. The real
upload path is browser-wallet signing only.

## Operator Run

1. Open `/testnet`.
2. Confirm public testnet mode, wallet readiness, upload entry, proof path, and
   product boundaries.
3. Connect an Aptos Testnet wallet.
4. Confirm the wallet has testnet APT and ShelbyUSD or the current Shelby
   storage credit requirement.
5. Open `/upload`.
6. Upload one small evidence file through the Shelby testnet path.
7. Approve the wallet transaction.
8. Confirm the upload result includes `shelbyRef`, `accountAddress`,
   `blobName`, `network: testnet`, `storageStatus`, `explorerUrl`, and
   `retrievalUrl`.
9. Open the generated Blob route and run the in-app proof verification panel.
10. Open the generated read receipt route and run the receipt-level proof
    verification panel.
11. Return to `/testnet` and copy the community handoff JSON.
12. Save the JSON locally and validate it:

```bash
npm run verify-testnet-handoff -- path/to/handoff.json
```

13. Optionally run the smoke command emitted by the handoff JSON for retrieval
    confirmation.

## Final Copilot Review

Use:

```txt
docs/final-copilot-review-brief.md
```

Expected review output must be one of:

- `merge-ready`
- `needs-real-testnet-run`
- `blocked`

`blocked` must include the exact file and behavior that prevents community
testnet use.

## Acceptance

The project is ready for community-facing testnet participation when:

- The automated local gate is green.
- The operator run completes at least one real Shelby testnet upload.
- The copied handoff JSON passes `npm run verify-testnet-handoff`.
- The final Copilot review returns `merge-ready`, or `needs-real-testnet-run`
  with no code blockers.
- No page claims mainnet, custody, production hosting, payment, marketplace, or
  trading behavior.
