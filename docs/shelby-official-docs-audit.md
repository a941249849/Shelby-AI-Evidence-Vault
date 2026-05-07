# Shelby Official Docs Audit and Architecture Reset

Issue: https://github.com/a941249849/Shelby-AI-Evidence-Vault/issues/5

Date: 2026-05-08

Scope: M1A documentation and architecture intake only. This document does not approve PR #4 for merge, does not implement real Shelby uploads, and does not introduce wallet payments, marketplace behavior, trading features, private key storage, production database work, or real AI agent logic.

## Executive Summary

Shelby must not be treated as a generic file-storage endpoint. The official docs describe a coordinated storage protocol with two interacting planes:

1. Shelby storage/RPC plane: user-facing SDK/CLI/RPC access for blob reads and writes, including HTTP GET support for reads and SDK-driven upload flows.
2. Aptos-derived coordination plane: smart contracts record blob metadata, commitments, placement/audit state, payments, and other correctness-critical protocol state.

The current M1 PR #4 has useful demo-level work that can be salvaged as M1B: client-side SHA-256 preview, mock upload UX, localStorage persistence, and an adapter boundary that fails closed for real testnet mode. But its real-integration notes must be corrected before merge or follow-up implementation. In particular, official docs currently show both `testnet` and `shelbynet` surfaces, SDK examples still use `Network.TESTNET`, and the current Networks page lists a Shelby smart contract account that differs from the account in Issue #5 / PR #4 notes. Those values must not be hardcoded as verified production facts.

Recommendation:

- M1B: keep mock upload and local persistence with future-correct adapter boundaries; explicitly mark all real Shelby values as documentation-derived and not yet live integration.
- M2: implement real upload only after choosing the official SDK flow, account/signer model, network target, API key model, funding path, and wallet/server signing architecture.
- M3: tie read receipts and demo polish to real Shelby account/blob names and transaction/blob metadata after M2 proves the real path.

## Documentation Map

| Section | Page title | URL | Reviewed finding |
|---|---|---|---|
| Protocol | Introduction | https://docs.shelby.xyz/protocol | Shelby is decentralized blob storage for read-heavy workloads; users interact through TypeScript SDK, CLI, and web apps. |
| Protocol | Quick Start | https://docs.shelby.xyz/protocol/quickstart | Official start paths are CLI quickstart, TypeScript SDK quickstart, architecture overview, upload/download commands, and RPC APIs. |
| Protocol | Architecture Overview | https://docs.shelby.xyz/protocol/architecture/overview | Defines Aptos smart contracts, storage providers, Shelby RPC servers, private network, blob naming, chunking, placement groups, read/write procedures. |
| Protocol | RPCs | https://docs.shelby.xyz/protocol/architecture/rpcs | RPC servers are user-facing access layer; SDK is primary write interface; reads can use HTTP GET and range requests. |
| Protocol | Storage Providers | https://docs.shelby.xyz/protocol/architecture/storage-providers | Storage providers run Cavalier; client tile follows Aptos/indexer state; server/engine tiles handle RPC and disk paths. |
| Protocol | Smart Contracts | https://docs.shelby.xyz/protocol/architecture/smart-contracts | Smart contracts hold critical state: commitments, audit outcomes, micropayment metadata, system participation, and blob metadata. |
| Protocol | Token Economics | https://docs.shelby.xyz/protocol/architecture/token-economics | Users pay storage/read fees in stablecoins or Shelby token; storage fees route through protocol on chain. Do not use this repo for tokenomics speculation. |
| Protocol | Networks | https://docs.shelby.xyz/protocol/architecture/networks | Current docs list both `testnet` and `shelbynet`; `shelbynet` is isolated from Aptos mainnet/testnet/devnet and has its own component URLs. |
| SDK | TypeScript Getting Started | https://docs.shelby.xyz/sdks/typescript | Package names are `@shelby-protocol/sdk` and `@aptos-labs/ts-sdk`; Node and browser entry points are separate. |
| SDK | Acquire API Keys | https://docs.shelby.xyz/sdks/typescript/acquire-api-keys | API keys are acquired through Geomi; anonymous mode has lower limits; frontend use requires a client key. |
| SDK | Node Uploading a File | https://docs.shelby.xyz/sdks/typescript/node/guides/uploading-file | `ShelbyNodeClient.upload` uses `account`, `blobData`, `blobName`, and `expirationMicros`; funding requires APT plus ShelbyUSD. |
| SDK | Node Specifications | https://docs.shelby.xyz/sdks/typescript/node/specifications | `ShelbyNodeClient` exposes upload/download plus `coordination` and `rpc` clients. |
| SDK | Browser Overview | https://docs.shelby.xyz/sdks/typescript/browser | Browser package imports `ShelbyClient` from `@shelby-protocol/sdk/browser`; optimized for browser Web APIs. |
| SDK | Browser Uploading a File | https://docs.shelby.xyz/sdks/typescript/browser/guides/upload | Browser upload flow is encode commitments, on-chain registration through wallet, then RPC upload. |
| SDK | Browser Downloading Files | https://docs.shelby.xyz/sdks/typescript/browser/guides/download | Files are accessed by account address and blob name; SDK can list account blobs and download, while HTTP direct access is documented for reads. |
| SDK | Core Specifications | https://docs.shelby.xyz/sdks/typescript/core/specifications | `ShelbyBlobClient` handles chain metadata; `ShelbyRPCClient` handles `putBlob` and `getBlob`. |
| React SDK | useUploadBlobs | https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs | React mutation handles encode, commitment registration, and RPC upload; supports account signers and wallet adapter signers. |
| Tools / CLI | Getting Started | https://docs.shelby.xyz/tools/cli | CLI installs as `@shelby-protocol/cli`; `shelby init` creates `~/.shelby/config.yaml`; contexts include Aptos and Shelby endpoint config. |
| Tools / CLI | Account Management | https://docs.shelby.xyz/tools/cli/commands/account-management | CLI manages signer accounts, blob listing, and balance checks; private-key examples are CLI-local and must not be copied into this project for M1A/M1B. |
| Tools / CLI | Context Management | https://docs.shelby.xyz/tools/cli/commands/context-management | Contexts hold Shelby RPC/indexer endpoints, Aptos network/fullnode/indexer/faucet, and API keys. |
| Tools / CLI | Uploads | https://docs.shelby.xyz/tools/cli/commands/uploads | `shelby upload <src> <dst> -e <expiration>` uploads blobs and charges SHEL; destination must be a valid blob name. |
| Tools / CLI | Downloads | https://docs.shelby.xyz/tools/cli/commands/downloads | `shelby download <src> <dst>` downloads blobs for the active account; recursive download requires slash-terminated prefixes. |
| Tools / CLI | Faucet | https://docs.shelby.xyz/tools/cli/commands/faucet | `shelby faucet` opens faucet for the active account and currently works only on `shelbynet`. |
| Tools / CLI | Commitment | https://docs.shelby.xyz/tools/cli/commands/commitment | `shelby commitment` generates blob/chunkset commitments offline. |
| Examples | shelby/shelby-quickstart | https://github.com/shelby/shelby-quickstart | Official quickstart repo demonstrates config, upload, list, download, and round-trip sample flows. |
| Explorer | Shelby Explorer shelbynet | https://explorer.shelby.xyz/shelbynet | Explorer shows beta status, wallet connect, stats, blob events, blobs, storage providers, and `shelbynet` route. |
| Explorer | Shelby Explorer testnet | https://explorer.shelby.xyz/testnet | Explorer also exposes `testnet` route with separate stats/events. |
| Wallet | Petra setup | https://docs.shelby.xyz/tools/wallets/petra-setup | Official wallet setup page tells users to switch Petra to Aptos Testnet and fund APT plus ShelbyUSD. |
| Wallet observation | Petra / Google email path | https://petra.app/ | Operator observed Google/email chain-abstraction path via Petra Web; official Shelby docs reviewed here document Petra Testnet setup, not the full Google-email session model. |

## Architecture Findings

### Key components

Official docs define the Shelby system around:

- Aptos smart contracts for correctness-critical protocol state.
- Storage Provider servers that store erasure-coded chunks.
- Shelby RPC servers for end-user blob access.
- Private network connectivity between RPC servers and storage providers.

Users connect through SDK, CLI, and web apps. RPC servers expose friendly user-facing APIs, but official write flows still involve SDK/coordination behavior, not a standalone unauthenticated file endpoint.

### Blob naming and identity

The architecture docs describe user blobs as living in an account-specific namespace. The account is represented by the hex Aptos account address, and blob names are user-defined paths that must be unique inside that account namespace. A fully qualified blob name looks like:

```txt
<account>/<user-defined/blob/name.ext>
```

There are no real directories in the storage model. Directory-like behavior is a canonical CLI/tool convention over blob-name prefixes.

Implementation impact: this repo should not treat `shelby://testnet/blob/{id}` as a confirmed official object identity. It may remain a demo/mock reference string if clearly labeled, but real integration should model account address plus blob name and any returned metadata/transaction fields from the official SDK.

### Write path

The official architecture write procedure is:

1. Client selects an RPC server.
2. SDK erasure-codes the blob locally.
3. SDK calculates cryptographic commitments.
4. SDK submits an Aptos transaction containing blob metadata and commitment root; storage payment is processed on chain.
5. SDK sends original data to RPC.
6. RPC independently erasure-codes and recomputes commitments.
7. RPC validates against on-chain state.
8. RPC distributes chunks to assigned storage providers.
9. Storage providers return signed acknowledgments.
10. RPC aggregates acknowledgments and submits a final smart-contract transaction.
11. Smart contract moves the blob to written/available state.

Implementation impact: a real upload is not only `fetch(SHELBY_RPC_URL, file)`. The M2 design must decide whether to rely on high-level `ShelbyNodeClient.upload`, React `useUploadBlobs`, or a lower-level chain/RPC composition.

### Read/download path

The official read procedure is mostly off-chain for low latency:

1. Client selects RPC and establishes payment/session.
2. Client requests a blob or byte range.
3. RPC checks cache if available.
4. RPC reads smart contract/indexer state to locate storage providers/chunks.
5. RPC retrieves chunks from storage providers.
6. RPC validates, reassembles, and returns data.

The RPC docs also state that reads can use plain HTTP GET and range requests. Browser download docs show predictable HTTP URL patterns based on account address and blob name, plus SDK-based metadata listing and download.

Implementation impact: M3 read receipts should attach to account/blob-name metadata and observed transaction/blob metadata, not to synthetic `blob-{id}` strings alone.

### On-chain vs off-chain

On-chain:

- Blob registration and metadata commitments.
- Payment/storage fee processing.
- Placement/audit state and acknowledgment transition to written state.
- Micropayment channel metadata and settlement.
- System participation and storage provider placement groups.

Off-chain / RPC / storage side:

- File streaming and multipart upload.
- Erasure-coded chunk distribution to storage providers.
- HTTP GET/range response path.
- RPC caching, request hedging, connection management, session handling.

## Network Findings

The current official Networks page lists:

| Network | Role | Component | URL |
|---|---|---|---|
| `testnet` | Public testnet surface in docs | Indexer | `https://api.testnet.aptoslabs.com/v1/graphql` |
| `testnet` | Public testnet surface in docs | Shelby RPC | `https://api.testnet.shelby.xyz/shelby` |
| `testnet` | Public testnet surface in docs | Aptos Full Node | `https://api.testnet.aptoslabs.com/v1` |
| `shelbynet` | Developer prototype network, isolated from Aptos mainnet/testnet/devnet | Indexer | `https://api.shelbynet.shelby.xyz/v1/graphql` |
| `shelbynet` | Developer prototype network, isolated from Aptos mainnet/testnet/devnet | Shelby RPC | `https://api.shelbynet.shelby.xyz/shelby` |
| `shelbynet` | Developer prototype network, isolated from Aptos mainnet/testnet/devnet | Aptos Full Node | `https://api.shelbynet.shelby.xyz/v1` |

Important caveats:

- The docs say `shelbynet` is wiped roughly once a week or faster.
- The docs say to use `shelbynet` as the network name when interacting with Aptos Explorer.
- The CLI docs include both `shelbynet` and `testnet` contexts.
- SDK examples still use `Network.TESTNET` in several places.
- Issue #5 and PR #4 mention contract account `0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5`, but the current Networks page reviewed during M1A shows `0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a` for both testnet and shelbynet.

Implementation impact: do not hardcode the `0xc63...` account from PR #4 as verified. Also do not silently assume SDK `Network.TESTNET` equals shelbynet. M2 must select the current intended network from official docs and live explorer behavior before coding.

## SDK Findings

### Official packages and entry points

Confirmed packages:

```bash
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
```

Node entry point:

```ts
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
```

Browser entry point:

```ts
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
```

React package:

```ts
import { useUploadBlobs } from "@shelby-protocol/react";
```

### Node SDK flow

Official Node guide:

- Set up account through `@aptos-labs/ts-sdk`.
- Acquire API key.
- Fund account with APT and ShelbyUSD.
- Initialize `ShelbyNodeClient`.
- Upload with `upload({ account/signer, blobData, blobName, expirationMicros })`.
- Download with `download({ account, blobName })`.

Node specifications describe `ShelbyNodeClient.upload` as handling both blockchain commitments and storage upload, returning a transaction and blob commitments.

Security impact: official Node guide includes generated/existing private key examples, but M1A/M1B must not add `PRIVATE_KEY`, `SEED_PHRASE`, mnemonic, or committed signing material. If M2 chooses server-side signing later, that requires a separate approved security design.

### Browser SDK flow

Browser docs describe a browser `ShelbyClient` plus wallet-adapter-driven upload. The browser upload guide breaks upload into:

1. File encoding and commitment generation.
2. On-chain registration via transaction payload.
3. RPC upload to storage providers.

Prerequisites include an Aptos wallet configured for the Shelby network and ShelbyUSD tokens.

Implementation impact: a browser-first real upload in this repo should likely use wallet adapter or React SDK rather than trying to move private keys through a server action.

### React SDK flow

`useUploadBlobs` handles the complete process: encoding, commitment registration, and RPC upload. It supports both account signers and wallet adapter signers. The wallet-adapter example passes:

- `account.accountAddress`
- `signAndSubmitTransaction`
- `blobs: [{ blobName, blobData }]`
- `expirationMicros`

Implementation impact: this is the best candidate for a future browser-wallet upload if the product direction is public user uploads without server-held private keys.

### API key requirements

Official docs say API keys:

- Authenticate an app.
- Manage rate limits.
- Are acquired through Geomi.
- Allow anonymous mode with lower limits.
- Need client-key handling if used in frontend contexts.

Implementation impact: keep server-side and client-side keys distinct. Do not expose a server API key through `NEXT_PUBLIC_*`.

## CLI and Tools Findings

### Install and initialize

Official CLI install:

```bash
npm i -g @shelby-protocol/cli
shelby init
```

`shelby init` creates `~/.shelby/config.yaml` and asks for an API key. CLI docs say API key is optional but recommended to avoid rate limits.

### Context setup

CLI contexts manage:

- Shelby RPC endpoint.
- Shelby indexer endpoint.
- Shelby RPC/indexer API keys.
- Aptos network name.
- Aptos fullnode, indexer, faucet, pepper, prover.
- Aptos API key.

The current docs show a `shelbynet` context with:

```txt
Aptos fullnode: https://api.shelbynet.shelby.xyz/v1
Aptos indexer: https://api.shelbynet.shelby.xyz/v1/graphql
Aptos faucet: https://faucet.shelbynet.shelby.xyz
Shelby RPC: https://api.shelbynet.shelby.xyz/shelby
```

### Account and funding

CLI account commands create/use/delete/list signer accounts and list blobs/balances. CLI upload/download requires a funded account. Official docs say uploads/downloads need:

- APT for gas fees.
- ShelbyUSD for Shelby operations like upload.

`shelby faucet` opens the faucet for the active account and currently only works on `shelbynet`.

### Upload and download

Upload:

```bash
shelby upload [options] <src> <dst>
shelby upload local-video.mp4 shelby-output.mp4 -e <UNIX_EPOCH>
shelby upload -r ./hls_video/ best-videos/hls_video/ --expiration <UNIX_EPOCH>
```

Required behavior:

- `--expiration` / `-e` is required.
- Single-file destination must be a valid blob name and must not end in `/`.
- Recursive destination must end in `/`.
- Upload charges SHEL according to the CLI docs.

Download:

```bash
shelby download [options] <src> <dst>
shelby download shelby/blob/name.mp4 ./video.mp4
shelby download -r shelby/blobs/best-videos/hls_video/ ./hls_video/
```

Current limitation: CLI docs say users currently cannot download blobs uploaded by other accounts with the CLI.

### Commitment tooling

`shelby commitment README.md out.json` generates blob and chunkset commitments offline. This is useful for M2 debugging and for explaining commitments without performing a live upload.

## API Findings

The official API surface is documented through SDK specifications and RPC docs rather than a complete standalone REST reference. The Node upload guide says API documentation is still under development.

Confirmed method/API shapes:

### SDK high-level

```ts
ShelbyNodeClient.upload({
  signer,
  blobData,
  blobName,
  expirationMicros,
  options,
})
```

Returns:

```ts
Promise<{
  transaction: CommittedTransactionResponse;
  blobCommitments: BlobCommitments;
}>
```

```ts
ShelbyNodeClient.download({
  account,
  blobName,
  range,
})
```

Returns `Promise<ShelbyBlob>`.

### Coordination client

`ShelbyBlobClient` is blockchain-focused. It includes:

- `registerBlob({ account, blobName, blobMerkleRoot, size, expirationMicros, options })`
- metadata lookups such as `getBlobMetadata`, `getAccountBlobs`, `getBlobs`, and activity/count helpers.

### RPC client

`ShelbyRPCClient` is storage/RPC-focused. It includes:

- `putBlob({ account, blobName, blobData })`
- `putBlobResumable`
- `getBlob({ account, blobName, range? })`
- challenge/signature helpers and multipart upload status.

### Direct HTTP reads

Docs show direct GET patterns:

```txt
https://api.testnet.shelby.xyz/shelby/v1/blobs/<uploader-address>/<file-name>
```

For `shelbynet`, do not blindly substitute until the chosen M2 network is confirmed, but the component URL suggests the equivalent base would be:

```txt
https://api.shelbynet.shelby.xyz/shelby/v1/blobs/<uploader-address>/<blob-name>
```

This must be verified in M2 against the current SDK/network behavior.

## Explorer and Shelbynet Findings

Explorer pages are readable:

- `https://explorer.shelby.xyz/shelbynet`
- `https://explorer.shelby.xyz/testnet`

The shelbynet Explorer page currently shows:

- Beta banner.
- Connect Wallet.
- Total Blobs.
- Total Storage Used.
- Total Blob Events.
- Slices.
- Placement Groups.
- Storage Providers.
- Blob Events table with Registered and Complete event types.
- Blobs table with owner, blob name, expiration, size, and status.

This confirms the product UX expects wallet connection and account/blob browsing. It also confirms that explorer-visible object identity is owner plus blob name, not only a synthetic blob id.

## Wallet and Onboarding Findings

Official Shelby wallet setup page covers Petra:

- Install Petra Wallet.
- Switch network to Aptos Testnet.
- Fund with APT and ShelbyUSD.

The operator separately observed the Shelby testnet web entry supporting wallet connection through chain abstraction / Google email into Petra wallet. The reviewed official Shelby docs did not fully document that Google-email session model, but Petra public materials describe Petra Web/social login support.

Implementation impact:

- M1A/M1B must not add private key handling.
- Browser wallet signing is a plausible M2 direction, especially because React `useUploadBlobs` supports wallet adapter signers.
- If M2 uses Node SDK server-side signing, it needs a separate security review and must not be introduced casually through `.env.example`.
- The app should describe wallet connection as future M2/M3 work unless implemented and tested against the official flow.

## PR #4 Impact Review

### What PR #4 got right

PR #4 appears salvageable as a demo/M1B foundation in these areas:

- Working upload UX for mock/demo mode.
- SHA-256 computation before upload.
- Browser localStorage persistence for local demo uploads.
- Server Action boundary that keeps server env vars out of the browser.
- Adapter interface that lets mock mode remain independent from real Shelby.
- Clear failure for real testnet mode instead of pretending to upload.
- Broad recognition that Shelby involves both storage/RPC and Aptos coordination.

### What PR #4 got wrong or over-asserted

These must be corrected before treating PR #4 as architecture truth:

- It treats `shelby://shelbynet/blob/{id}` as if it were the main real reference model, while official docs emphasize account address plus blob name.
- It hardcodes or repeats the `0xc63...` coordination contract from earlier notes, but current official Networks docs show a different account.
- It may overstate `shelbynet` as the only usable surface while SDK and CLI docs still include `Network.TESTNET`, `testnet` routes, and `api.testnet.shelby.xyz`.
- It describes `SHELBY_API_KEY` as if it is definitely required for all operations; official docs say anonymous mode exists but has lower limits.
- It names `SHEL`/ShelbyUSD payment requirements too loosely; official docs mention SHEL in CLI upload docs, ShelbyUSD in SDK/wallet funding docs, and stablecoins/Shelby token in token economics. Avoid tokenomics expansion.
- It suggests server-side private key as one possible future option in comments. That may be technically possible, but this project must not introduce private-key env vars unless a later approved design explicitly chooses it.

### What can be kept for M1B

Keep:

- Mock upload and deterministic references, if labeled as local demo artifacts only.
- Local persistence and reset UX.
- Adapter boundary with `mock` and `testnet` modes.
- Server Action for future server-side RPC/API calls, but not for wallet signing yet.
- Documentation that real upload is deferred and blocked until official SDK integration is designed.

Adjust:

- Rename/label mock refs as demo refs, not verified Shelby object IDs.
- Replace hardcoded contract account with a "current docs show ..." note or remove from code-facing docs.
- Avoid `.env.example` fields that imply private key or seed phrase.
- Separate `testnet` vs `shelbynet` as unresolved integration choice until M2 confirms current official path.

### What must be redesigned

M2 needs a fresh design for:

- Real object model: account address, blob name, expiration, transaction hash, commitments, metadata, status.
- Network selection: `testnet` versus `shelbynet`, with exact SDK enum/config support verified in code.
- Signing model: browser wallet adapter / React SDK versus server-held account, with no private-key handling in M1A/M1B.
- API key model: Geomi server key versus frontend client key versus anonymous mode.
- Funding/onboarding: APT plus ShelbyUSD/SHEL, faucet, wallet network, and account session state.
- Read receipt binding: real Shelby blob metadata and explorer/transaction links.

## Recommended Milestone Split

### M1B - Mock upload plus future-correct adapter boundary

Goal: ship a polished public demo upload workflow without pretending real Shelby upload works.

Scope:

- Keep mock upload, local persistence, hash preview, and blob detail display.
- Keep all upload artifacts local/browser-only.
- Keep real testnet mode blocked with a plain, actionable message.
- Update docs and UI labels to say mock refs are local/demo refs, not official Shelby refs.
- Add this audit document and adjust PR #4 documentation claims if needed.
- No private keys, seed phrases, wallet payments, real upload, or database.

Acceptance:

- `npm run lint` and `npm run build` pass.
- Demo upload works in mock mode.
- Testnet mode fails closed.
- README/docs reflect official-doc caveats.

### M2 - Official SDK / wallet / shelbynet real upload integration

Goal: implement a real upload path only after M1A decisions are settled.

Design decisions required before coding:

- Node SDK or React SDK/browser wallet path.
- Exact network config and SDK enum support for `shelbynet`/`testnet`.
- API key type and exposure rules.
- Funding flow and faucet UX.
- Account/signer lifecycle.
- Storage of returned transaction/blob metadata.

Likely implementation paths:

- Browser wallet path: `@shelby-protocol/react` `useUploadBlobs` with wallet adapter signer.
- Server path: `@shelby-protocol/sdk/node` `ShelbyNodeClient.upload`, only after separate security approval for signer custody.

### M3 - Real read receipts and public demo polish

Goal: connect read receipts to real Shelby metadata and user-facing proof links.

Scope:

- Show explorer links for owner/blob/transaction when available.
- Store real account/blobName/expiration/status.
- Generate read receipts that distinguish demo/local and real Shelby-backed evidence.
- Add polished public demo flow after M2 proves integration.

## Hard Constraints Restated

This project must not implement or imply:

- Trading features.
- Exchange APIs.
- Market signals.
- Tokenomics speculation.
- Marketplace or paid dataset trading.
- Wallet payments.
- Private key or seed phrase storage.
- Production database.
- Automatic social posting.
- Real AI/LLM agent logic.

This project must not invent:

- SDK package names.
- RPC endpoints.
- Transaction flows.
- Signing flows.
- Wallet behavior.

When official docs are inconsistent or incomplete, mark the value as blocked/pending verification and do not guess.

## M1A Closeout Checklist

- [x] Protocol docs reviewed.
- [x] SDK docs reviewed.
- [x] CLI/tools docs reviewed.
- [x] API/RPC surfaces reviewed from official docs.
- [x] Examples repo reviewed.
- [x] Explorer `shelbynet` and `testnet` routes reviewed.
- [x] Petra wallet setup reviewed.
- [x] Storage/RPC plane and Aptos coordination plane distinguished.
- [x] PR #4 salvage/rewrite recommendation included.
- [x] No implementation code changed by this audit.
