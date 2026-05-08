# Shelby Official Docs Audit

Date: 2026-05-08

This audit is the M1A architecture checkpoint requested in Issue #5. It is based on official Shelby documentation and Shelby Explorer pages only. It does not approve real Shelby upload implementation yet.

## Executive Summary

PR #4 can continue as **M1B mock upload + local persistence**, but it must not be treated as real Shelby integration. The current product direction is valid: Evidence Packs -> Blob Records -> Shelby references -> Read Receipts. The real Shelby path is a coordinated protocol flow, not a simple file upload endpoint.

The official docs confirm four architectural facts that matter for the next phase:

1. Shelby has a user-facing RPC/storage plane and an Aptos-derived coordination/on-chain plane.
2. A real write requires file encoding/commitments, on-chain blob registration, and then RPC data upload.
3. Shelby blob identity is account namespace + blob name, not just a standalone opaque ref string.
4. Real uploads require signer/account context, expiration, APT for gas, and ShelbyUSD or SHEL/Shelby token payment context depending on route.

Important correction: Issue #5 listed `0xc63d6a5e...b3ddbf5` as a preliminary contract account to verify. The current official `Networks` page lists the Shelby Smart Contract account for both `testnet` and `shelbynet` as `0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a`. Treat the old `0xc63...` value as stale/unverified and do not hardcode either value in M1B code.

Strategy correction after the devnet/testnet transition: the product strategy remains correct, but M2 real integration should prioritize Shelby **testnet** as the main target when possible. `shelbynet` should be treated as legacy/developer-prototype context, useful for architecture clues and explorer inspection, not as the default assumption for production-shaped integration.

## Documentation Map

| Area | Official page reviewed | URL | Finding |
|---|---|---|---|
| Protocol | Shelby Docs home | https://docs.shelby.xyz/ | Positions Shelby as decentralized hot storage with CLI, SDK, and API entry points. |
| Protocol | Quick Start | https://docs.shelby.xyz/protocol/quickstart | Directs users to CLI, SDK quickstarts, architecture overview, CLI upload/download, SDK docs, and RPC APIs. |
| Protocol | Architecture Overview | https://docs.shelby.xyz/protocol/architecture/overview | Defines Aptos smart contract, storage providers, RPC servers, private network, account/blob naming, read/write procedures. |
| Protocol | RPCs | https://docs.shelby.xyz/protocol/architecture/rpcs | Describes RPC servers as the primary user-facing access layer for blob read/write and storage provider interaction. |
| Protocol | Storage Providers | https://docs.shelby.xyz/protocol/architecture/storage-providers | Describes storage provider nodes and the Cavalier reference implementation. |
| Protocol | Smart Contracts | https://docs.shelby.xyz/protocol/architecture/smart-contracts | Confirms metadata registration, write payment, acknowledgements, micropayments, participation, and audits are on-chain coordinated. |
| Protocol | Token Economics | https://docs.shelby.xyz/protocol/architecture/token-economics | Confirms user payments for storage/read operations and native token role for staking/rewards/governance. |
| Protocol | Networks | https://docs.shelby.xyz/protocol/architecture/networks | Confirms official `testnet` component URLs and the older `shelbynet` developer-prototype section. |
| SDK | TypeScript Getting Started | https://docs.shelby.xyz/sdks/typescript | Confirms `@shelby-protocol/sdk` and `@aptos-labs/ts-sdk`; Node and browser entry points. |
| SDK | Node Overview | https://docs.shelby.xyz/sdks/typescript/node | Confirms `@shelby-protocol/sdk/node` and `ShelbyNodeClient`. |
| SDK | Browser Overview | https://docs.shelby.xyz/sdks/typescript/browser | Confirms `@shelby-protocol/sdk/browser` and `ShelbyClient`. |
| SDK | Browser Upload Guide | https://docs.shelby.xyz/sdks/typescript/browser/guides/upload | Confirms browser upload sequence: encode, register on-chain, RPC upload. |
| SDK | React Getting Started | https://docs.shelby.xyz/sdks/react | Confirms `@shelby-protocol/react`, React Query provider, query/mutation hooks, wallet adapter optional dependency. |
| SDK | API Keys | https://docs.shelby.xyz/sdks/typescript/acquire-api-keys | Confirms Geomi API key flow and anonymous lower-limit behavior. |
| SDK | Funding | https://docs.shelby.xyz/sdks/typescript/fund-your-account | Confirms account funding page for ShelbyUSD and APT. |
| CLI | CLI Getting Started | https://docs.shelby.xyz/tools/cli | Confirms `@shelby-protocol/cli`, `shelby init`, contexts, account funding, upload/download examples. |
| CLI | Account Management | https://docs.shelby.xyz/tools/cli/commands/account-management | Confirms CLI account signer management and private-key options for CLI context only. |
| CLI | Context Management | https://docs.shelby.xyz/tools/cli/commands/context-management | Confirms named network contexts and Shelby RPC/indexer/API-key configuration. |
| CLI | Uploads | https://docs.shelby.xyz/tools/cli/commands/uploads | Confirms `shelby upload`, expiration requirement, recursive mode, and SHEL charging language. |
| CLI | Downloads | https://docs.shelby.xyz/tools/cli/commands/downloads | Confirms account-scoped CLI downloads and direct REST download path for other accounts. |
| CLI | Faucet | https://docs.shelby.xyz/tools/cli/commands/faucet | Confirms faucet command works on `shelbynet`. |
| API | Shelbynet API | https://docs.shelby.xyz/apis/rpc/shelbynet | Confirms the REST endpoint shapes; Networks page must supply the selected base URL. |
| API | Upload blob | https://docs.shelby.xyz/apis/rpc/shelbynet/storage/uploadBlob | Confirms `PUT /v1/blobs/{account}/{blobName}` and `Content-Length`. |
| API | Retrieve blob | https://docs.shelby.xyz/apis/rpc/shelbynet/storage/getBlob | Confirms `GET /v1/blobs/{account}/{blobName}` and optional byte range. |
| API | Multipart start | https://docs.shelby.xyz/apis/rpc/shelbynet/multipart-uploads/startMultipartUpload | Confirms multipart session endpoint and `uploadId` response. |
| API | S3 Gateway Uploads | https://docs.shelby.xyz/tools/s3-gateway/uploads | Confirms S3-compatible write path still requires Aptos signer and expiration. |
| Explorer | Shelby Explorer | https://explorer.shelby.xyz/testnet | Confirms beta explorer, wallet connect entry, live blob/events/storage/provider counters, and blob states on testnet. |

## Architecture Findings

### Key Components

Official architecture splits Shelby into:

- **Aptos smart contract**: correctness-critical state, audits, metadata, settlement, provider participation.
- **Storage Providers**: nodes that store chunks of user data.
- **Shelby RPC servers**: public user-facing access layer for blob read/write.
- **Private Network**: RPC-to-storage-provider network path.

Users reach Shelby through SDKs and RPC servers. The RPC server then coordinates with storage providers and the Aptos smart contract.

### Accounts and Blob Naming

Shelby blobs live under an Aptos account namespace. Blob names are user-defined and unique inside that namespace. A fully qualified blob identity is conceptually:

```txt
<aptos-account>/<user-defined-blob-name>
```

Blob names can include slash-like paths, but the protocol does not have real directories. CLI tools map local directories into canonical blob-name prefixes.

Implementation impact:

- `shelby://mock/blob/{id}` and `shelby://demo/blob/{id}` remain acceptable M1B demo identifiers only.
- M2 real identity must store `accountAddress` and `blobName` as first-class fields.
- Blob detail should eventually show real explorer/RPC links derived from account + blob name.

### Write Procedure

Official architecture describes the write path as:

1. Client selects an RPC server.
2. SDK locally erasure-codes the blob and computes commitments.
3. SDK submits an Aptos transaction with metadata and commitment merkle root.
4. Storage payment is processed on-chain.
5. SDK sends original data to RPC.
6. RPC independently encodes/verifies against on-chain metadata.
7. RPC distributes chunks to storage providers.
8. Providers return signed acknowledgements.
9. RPC aggregates acknowledgements and submits final on-chain update.
10. Smart contract transitions blob to a written/available state.

Implementation impact:

- A future adapter cannot be hash-only.
- M2 adapter payload needs file bytes, blob name, expiration, account/signer, and metadata.
- M1B’s base64 content pipe is directionally useful because it keeps blob bytes available to the adapter boundary.

### Read Procedure

Official architecture describes reads as:

1. Client selects RPC server and establishes payment/session.
2. Client requests blob or byte range.
3. RPC may serve cache.
4. RPC reads smart-contract/indexer metadata to find providers.
5. RPC retrieves chunks through the private network and validates/reassembles data.
6. Client can perform more reads in the same session with incremental payment.

Implementation impact:

- Read receipt features should not imply free or purely local reads once connected to real Shelby.
- M3/M4 should distinguish "metadata proof", "RPC retrieval", and "agent reference receipt".

### Storage/RPC Plane vs Coordination Plane

The two-plane model remains correct:

| Plane | Purpose | Current official signals |
|---|---|---|
| Shelby RPC/storage plane | User-facing blob upload/retrieval and RPC-to-provider coordination | `https://api.testnet.shelby.xyz/shelby`, REST `GET/PUT /v1/blobs/{account}/{blobName}`, multipart endpoints |
| Aptos coordination plane | On-chain metadata, commitments, payments, provider state, audits | `https://api.testnet.aptoslabs.com/v1`, `https://api.testnet.aptoslabs.com/v1/graphql`, smart contract account from Networks page |

M1B correctly keeps these separate in `.env.example`, `config.ts`, and docs.

## Network / Explorer Findings

Official `Networks` page currently lists:

```txt
Network: testnet
Indexer: https://api.testnet.aptoslabs.com/v1/graphql
Shelby RPC: https://api.testnet.shelby.xyz/shelby
Aptos Full Node: https://api.testnet.aptoslabs.com/v1
Shelby Smart Contract: 0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a

Network: shelbynet
Indexer: https://api.shelbynet.shelby.xyz/v1/graphql
Shelby RPC: https://api.shelbynet.shelby.xyz/shelby
Aptos Full Node: https://api.shelbynet.shelby.xyz/v1
Shelby Smart Contract: 0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a
```

The page still says `shelbynet` is a developer prototype network that may be wiped roughly weekly or faster. It is isolated from Aptos mainnet, testnet, and devnet. The same page now also exposes a separate `testnet` section. If Shelby team guidance says the March testnet topology is close to mainnet topology, then M2/M3 should use testnet as the production-shaped integration target and keep shelbynet as historical/prototype context.

Shelby Explorer at `https://explorer.shelby.xyz/testnet` is beta, has a "Connect Wallet" entry, and displays live stats such as total blobs, total storage used, blob events, slices, placement groups, and storage providers. At review time it showed 34 storage providers and live blob/event tables with blob states like Registered, Complete, Pending, and Ready. The older `https://explorer.shelby.xyz/shelbynet` view remains accessible for developer-prototype context.

Implementation impact:

- Never mix `shelbynet` and `testnet` endpoint families in one runtime config.
- For real integration work, prefer the official testnet tuple: Aptos Labs testnet fullnode/indexer plus Shelby testnet RPC.
- Do not hardcode the smart contract account in M1B. Even the current official account may change with weekly wipes or docs updates.
- Explorer links should be generated from the selected network and stored account/blob metadata in M2+.

## SDK Findings

### Packages

Official package names:

```bash
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
npm install @shelby-protocol/react @shelby-protocol/sdk @aptos-labs/ts-sdk @tanstack/react-query
```

Official entry points:

```ts
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
```

React package exposes query/mutation hooks such as:

- `useAccountBlobs`
- `useBlobMetadata`
- `useUploadBlobs`
- `useEncodeBlobs`
- `useCommitBlobs`
- `useRegisterCommitments`

### Browser Upload Flow

The browser upload guide shows:

1. Use an Aptos wallet adapter.
2. Encode the file and generate commitments with SDK helpers.
3. Build a register-blob payload with account, blob name, merkle root, chunkset count, expiration, and size.
4. Sign and submit the registration transaction with the wallet.
5. Wait for transaction confirmation.
6. Call `shelbyClient.rpc.putBlob` with account, blob name, and file bytes.

Important: the guide states the RPC upload must happen after on-chain registration because the RPC verifies registration status.

### Node Flow

The Node overview confirms `ShelbyNodeClient` as the server-side client and describes it as a high-level interface across the coordination, RPC, and storage layers. The docs reviewed did not provide enough current Node upload detail to safely implement a server-signer route yet.

Implementation impact:

- Browser route likely needs `@aptos-labs/wallet-adapter-react`.
- Server route may be possible, but must be designed explicitly around signer custody.
- Do not introduce private key env vars in M1B.
- M2 should decide browser wallet vs server signer only after reviewing current Node upload specs/examples in more depth.

### API Keys

Official docs say API keys are obtained through Geomi. Anonymous mode exists with lower limits. They also distinguish private server keys and frontend/client keys.

Implementation impact:

- `SHELBY_API_KEY` must remain server-only unless a client-safe key is explicitly created and scoped.
- Avoid `NEXT_PUBLIC_SHELBY_API_KEY` by default.
- Browser SDK examples use env-like API key placeholders, but our Next.js design needs explicit public/private split.

## CLI / Tools Findings

### Installation and Init

Official CLI package:

```bash
npm i -g @shelby-protocol/cli
shelby init
```

The CLI stores config in:

```txt
~/.shelby/config.yaml
```

The CLI manages contexts, accounts, faucet operations, uploads, downloads, deletions, and commitments.

### Contexts

Context management confirms named network configurations with fields like Shelby RPC endpoint, indexer endpoint, and API key. This supports our M1B separation between `SHELBY_RPC_URL`, indexer/fullnode URLs, and API key.

### Accounts

Account management confirms CLI signer accounts are required for upload/funding. Non-interactive CLI account creation can take a raw private key. That is a CLI local-dev feature, not permission for this web app to add private-key handling.

### Funding

CLI getting-started and SDK funding docs confirm upload/download work requires:

- APT for gas.
- ShelbyUSD, SHEL, or Shelby token payment context depending on route/docs page.

The CLI faucet command is documented as shelbynet-only.

### Uploads

CLI upload command:

```bash
shelby upload [options] <src> <dst>
```

Key properties:

- `--expiration` is required.
- Recursive directory upload is supported.
- Single blob destination must be a valid blob name and not end in `/`.
- Directory destination must end in `/`.
- CLI upload charges SHEL tokens per the upload command page.

### Downloads

CLI download command:

```bash
shelby download [options] <src> <dst>
```

Key properties:

- CLI currently downloads blobs for the active account only.
- Direct REST retrieval can fetch other accounts' files through RPC without additional session headers for that path, according to CLI docs.
- Recursive source/destination paths must both end in `/`.

## API Findings

### Base URL

Selected testnet RPC base:

```txt
https://api.testnet.shelby.xyz/shelby
```

### Blob Upload

Endpoint:

```txt
PUT /v1/blobs/{account}/{blobName}
```

Path params:

- `account`
- `blobName`, including slash characters

Headers/body:

- `Content-Length` header
- Raw body bytes

Response:

- `204` on success according to API reference.

Important: SDK docs clarify this RPC upload is not the whole write flow; it comes after on-chain registration.

### Blob Retrieval

Endpoint:

```txt
GET /v1/blobs/{account}/{blobName}
```

Features:

- Optional `range` header in `bytes=start-end` format.
- Returns `application/octet-stream`.
- Possible statuses include full response, partial content, and error statuses.

### Multipart Uploads

Start endpoint:

```txt
POST /v1/multipart-uploads
```

Body fields:

- `rawAccount`
- `rawBlobName`
- `rawPartSize`, defaulting to `1048576`

Response includes:

```json
{ "uploadId": "string" }
```

Implementation impact:

- Large-file support should not be hand-rolled in M1B.
- M2/M3 should use SDK or official multipart API rather than custom chunk upload logic.

### S3 Gateway

S3 Gateway docs say S3-compatible writes require:

- Aptos signer.
- Explicit expiration per blob.
- Bucket name matching the signer's Aptos address.

Implementation impact:

- S3 Gateway is not a shortcut around signer/expiration requirements.
- It may be useful later for server/ops ingestion, not for current browser demo.

## Wallet / Onboarding Findings

Official docs reviewed confirm:

- Browser upload uses Aptos Wallet Adapter.
- React SDK lists `@aptos-labs/wallet-adapter-react` as optional dependency for wallet adapter integration.
- Browser upload guide signs and submits the registration transaction from the wallet.
- Explorer has a visible "Connect Wallet" entry.

The operator observed a Shelby web path using Petra wallet and Google email / chain abstraction. I did not find an official docs page in the reviewed set that specifies the Google-email flow or chain-abstraction session model. Treat that as an observed product-onboarding clue, not yet a protocol/API contract.

Implementation impact:

- M2 should prefer wallet delegation for browser uploads unless a server signer is explicitly approved.
- Petra and chain-abstraction support should be verified in the actual wallet adapter/provider stack before coding.
- Do not add `PRIVATE_KEY`, `SEED_PHRASE`, mnemonic, or raw private-key env vars for the web app in M1B/M2 design drafts.

## PR #4 Implementation Impact

### What PR #4 Got Right

- It reframes M1B as local/mock only.
- It preserves a future adapter boundary instead of putting Shelby logic directly in UI.
- It passes file bytes/content into the upload action path, which is necessary for real SDK upload later.
- It computes browser SHA-256 and stores local EvidencePack/BlobRecord state.
- It separates demo refs from local mock refs.
- It fails closed for `SHELBY_MODE=testnet`.
- It documents distinct Shelby storage/RPC and Shelbynet/Aptos coordination planes.
- It keeps real wallet/signing/funding out of M1B.

### What PR #4 Still Must Not Claim

- It must not claim real testnet/Shelbynet upload works.
- It must not claim `shelby://mock/blob/{id}` or `shelby://demo/blob/{id}` are official Shelby identities.
- It must not freeze any smart-contract account into code.
- It must not imply any SDK `Network` example is automatically correct without checking the selected network. Official docs contain both testnet and shelbynet references; M2 must resolve the exact SDK network constant/config for the currently selected network.

### What Can Be Kept for M1B

- Upload UI behavior.
- Local file hashing.
- Local persistence.
- Demo/local dashboard merge.
- Blob detail local/demo lookup.
- Server action boundary.
- Adapter interface/stub.
- `.env.example` two-plane shape.
- `testnet-adapter.ts` fail-closed placeholder.

### What Belongs to M2

- Official SDK install and import.
- SDK network configuration.
- Wallet provider integration.
- Petra/Google/chain-abstraction validation.
- Signer custody decision.
- Faucet/funding flow.
- API key scoping.
- Expiration UX and validation.
- Real account/blobName identity.
- Real explorer links.
- Real blob status mapping.

## Recommended Milestone Split

### M1B: Mock upload + local persistence + future-correct adapter boundary

Allowed:

- LocalStorage persistence.
- SHA-256 preview.
- Mock refs.
- Demo/local data separation.
- Future fields in types.
- Fail-closed testnet adapter.
- Documentation of official constraints.

Blocked:

- Real SDK upload.
- Wallet signing.
- RPC network calls.
- Smart contract interaction.
- Funding flows.
- Private key handling.

### M2: Official integration design

Deliverables:

- Select `testnet` as the default real-integration target unless current official SDK/docs explicitly require `shelbynet`.
- Decide browser wallet vs server signer.
- Confirm current SDK network constant/config for the selected network.
- Confirm current smart contract account from docs/explorer at implementation time.
- Confirm API key type and placement.
- Design expiration UI.
- Design account/blobName storage.
- Design error/status mapping.

### M3: Real Shelbynet upload

Deliverables:

- Install official SDK packages.
- Implement official encode/register/upload flow.
- Display real account/blobName/ref/status.
- Link to Explorer and/or RPC retrieval.
- Preserve fail-closed behavior when config is incomplete.

### M4: Read receipts tied to real Shelby refs

Deliverables:

- Bind read receipts to real blob records.
- Show retrieval/reference status.
- Keep LLM calls optional and explicitly out of scope until approved.

### M5: Public ecosystem package

Deliverables:

- Polished README.
- Demo script.
- Screenshots/video.
- Chinese and English positioning.
- Shelby ecosystem submission material.

## Open Questions for M2

1. Which SDK `Network` value and config object should be used for the current Shelby testnet package version?
2. Is the current official smart-contract account still `0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a` when implementation begins?
3. Is the Google email / chain abstraction path exposed through Aptos Wallet Adapter, Petra, an Aptos Labs product, or Shelby-specific onboarding code?
4. Should the public demo use browser wallet signing, or should real upload be reserved for a server-side controlled demo account?
5. What API key type is safe for browser use, if any, and what rate limits apply to anonymous mode?
6. Are read operations in the current SDK expected to require session/micropayment setup for all paths, or can public REST retrieval be used for demo read links?

## Acceptance Decision

Issue #5 can be considered satisfied by this document once reviewed. The repo should continue with PR #4 as **M1B mock/local only**, while keeping M2 real integration blocked until the open questions above are resolved against the latest official docs and SDK package version.

No real Shelby upload code should be implemented as part of this M1A audit.
