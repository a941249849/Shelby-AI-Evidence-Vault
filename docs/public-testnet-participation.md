# X8 Public Shelby Testnet Participation

Last verified against official Shelby docs: 2026-05-09.

## Product Target

Shelby AI Evidence Vault is no longer framed only as a local community experiment. The public target is:

> A Shelby ecosystem app where community users can connect an Aptos wallet, upload evidence to Shelby testnet, and inspect the resulting Blob identity and read receipt.

Local mock mode remains the zero-credential development and review fallback. It is not the final protocol path.

## Official Shelby Alignment

The current implementation follows Shelby's browser-wallet direction:

- Shelby's React SDK provides `@shelby-protocol/react` hooks and is built on React Query plus `@shelby-protocol/sdk`.
- `useUploadBlobs` handles the complete blob upload flow: encoding, on-chain commitment registration, and RPC upload.
- The browser upload guide states the required participant prerequisites: an Aptos wallet configured for the Shelby network and ShelbyUSD for uploads.
- Shelby's browser guide describes the real flow as file encoding, on-chain registration, then RPC upload.
- Shelby's download guide documents direct retrieval from `https://api.testnet.shelby.xyz/shelby/v1/blobs/<uploader-address>/<file-name>`.

Official references:

- React SDK getting started: https://docs.shelby.xyz/sdks/react
- React `useUploadBlobs`: https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs
- Browser upload guide: https://docs.shelby.xyz/sdks/typescript/browser/guides/upload
- Browser download guide: https://docs.shelby.xyz/sdks/typescript/browser/guides/download

## Participant Flow

1. Open the deployed app.
2. Go to `/upload`.
3. Connect Petra or another compatible Aptos wallet.
4. Switch the wallet to Aptos Testnet.
5. Ensure the wallet has testnet APT for gas.
6. Ensure the wallet has ShelbyUSD for Shelby file upload cost.
7. Upload one or more evidence files.
8. Approve the wallet transaction.
9. Inspect the success state:
   - `shelbyRef`: `shelby://testnet/{account}/{blobName}`
   - `accountAddress`
   - `blobName`
   - `network: testnet`
   - `storageStatus: registered`
   - `explorerUrl`
   - `retrievalUrl`
10. Open the generated read receipt and Blob detail pages.

## Deployment Switch

Set these values before deploying the public testnet build:

```bash
SHELBY_MODE=testnet
NEXT_PUBLIC_SHELBY_NETWORK=testnet
```

Optional public endpoint overrides:

```bash
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql
NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24
```

Server-side smoke/readiness configuration remains documented in `.env.example` and `docs/shelby-testnet-operator-runbook.md`. Do not expose `SHELBY_API_KEY` as a `NEXT_PUBLIC_` variable.

## Current Product Coverage

Implemented:

- Aptos wallet provider pinned to `Network.TESTNET`.
- Browser wallet upload hook using `useUploadBlobs`.
- Fail-closed upload page when wallet is missing or on the wrong network.
- Local SQLite persistence plus browser cache/fallback.
- Blob and receipt pages resolve testnet records after upload.
- Public testnet participation guide on `/upload`.
- Chinese and English product copy for the participant path.

Still manual:

- Actual wallet funding.
- ShelbyUSD acquisition.
- Real wallet transaction approval.
- Retrieval smoke check after a real upload.

## Acceptance Gate

Automated, zero-credential gate:

```bash
npm run lint
npm run build
npm run verify-release-candidate
```

Manual testnet gate:

1. Deploy with `SHELBY_MODE=testnet` and `NEXT_PUBLIC_SHELBY_NETWORK=testnet`.
2. Open `/upload`.
3. Confirm the wallet connector and public testnet guide are visible.
4. Connect a wallet on Aptos Testnet.
5. Upload a small file.
6. Confirm the returned record contains real testnet identity fields.
7. Open the generated `/blob/{id}` and `/read-receipt/{id}` pages.
8. Run the opt-in smoke retrieval check with the returned account and blobName:

```bash
SHELBY_SMOKE=true \
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby \
SHELBY_SMOKE_ACCOUNT_ADDRESS=<accountAddress> \
SHELBY_SMOKE_BLOB_NAME=<blobName> \
npm run smoke
```

## Boundaries

- Testnet only.
- No mainnet claim.
- No private key custody.
- No server signer.
- No token purchase or payment UX.
- No marketplace or trading surface.
- Local mock mode remains honest fallback, not a substitute for Shelby testnet proof.
