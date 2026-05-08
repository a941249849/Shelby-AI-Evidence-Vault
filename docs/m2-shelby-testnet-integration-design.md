# M2 Shelby Testnet Integration Design

Date: 2026-05-08

Status: **Codex implementation-ready design**

This document turns the official Shelby docs audit and the current SDK package surface into the production design for the next implementation stage. It is the bridge between the frozen product architecture and the Copilot implementation task.

M2 is design-only. Real upload implementation belongs to M3.

## Baseline

M1B is merged and stable as the local/mock baseline.

Current behavior:

- Mock mode is default.
- Uploads persist in browser `localStorage`.
- Mock refs use `shelby://mock/blob/{id}`.
- Demo refs use `shelby://demo/blob/{id}`.
- `SHELBY_MODE=testnet` fails closed.
- No wallet, SDK, real upload, RPC network call, or on-chain transaction exists in M1B.

## Package Surface Checked

Checked from npm on 2026-05-08.

| Package | Version | Relevant exports |
|---|---:|---|
| `@shelby-protocol/sdk` | `0.3.0` | `./node`, `./browser` |
| `@shelby-protocol/react` | `2.0.0` | `.`, `./core` |
| `@aptos-labs/ts-sdk` | `6.3.1` | Aptos `Network`, `Account`, transaction/client types |

SDK entry points confirmed:

```ts
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";
```

React package confirms:

```ts
import { useUploadBlobs } from "@shelby-protocol/react";
```

## Network Decision

M2/M3 target: **Shelby testnet**.

Use the official testnet endpoint family:

```env
SHELBY_NETWORK=testnet
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
APTOS_NETWORK=testnet
SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1
SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
SHELBY_EXPLORER_URL=https://explorer.shelby.xyz/testnet
```

Do not mix these with older `shelbynet` endpoints.

SDK type surface confirms Shelby supports:

```ts
type ShelbyNetwork = Network.LOCAL | Network.TESTNET | Network.SHELBYNET;
```

Therefore the M3 SDK config should use:

```ts
network: Network.TESTNET
```

with explicit overrides where needed:

```ts
const client = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
  rpc: {
    baseUrl: process.env.SHELBY_RPC_URL,
    apiKey: process.env.SHELBY_API_KEY,
  },
  indexer: {
    baseUrl: process.env.SHELBY_INDEXER_URL,
    apiKey: process.env.SHELBY_API_KEY,
  },
});
```

Do not hardcode the smart contract account in runtime code. The SDK exports a `SHELBY_DEPLOYER` constant, but implementation should only rely on SDK defaults unless a current official doc requires an override.

## SDK Upload Surface

`ShelbyClient.upload()` is the key high-level upload API:

```ts
await client.upload({
  blobData: Uint8Array,
  signer: Account,
  blobName: BlobName,
  expirationMicros: number,
  options?: UploadOptions,
});
```

The SDK method handles:

- commitment generation
- blockchain registration
- storage upload

The SDK also exposes `batchUpload()`:

```ts
await client.batchUpload({
  blobs: { blobData: Uint8Array; blobName: BlobName }[],
  expirationMicros: number,
  signer: Account,
  options?: UploadOptions,
});
```

The browser/react path exposes `useUploadBlobs()`:

```ts
uploadBlobs.mutate({
  signer,
  blobs: [{ blobName, blobData }],
  expirationMicros,
  options,
  maxConcurrentUploads,
});
```

The React signer type supports:

- `Account`
- wallet adapter object with `account` and `signAndSubmitTransaction`

This confirms browser wallet signing is officially supported by the React package.

## Signer Strategy

### Decision

M3 should implement the **browser wallet path first**.

Server signer remains a controlled-demo fallback only and must not be implemented unless explicitly approved.

### Why

Browser wallet path:

- matches official browser/react package design
- avoids server custody of private keys
- keeps ownership visible to the user
- avoids private key env vars

Server signer path:

- may be useful for controlled demos
- creates custody and security risk
- requires secret management outside source/docs
- must not be represented in `.env.example` as a private key

### M3 signer rule

Allowed:

```ts
WalletAdapterSigner
```

Blocked unless separately approved:

```ts
Account.fromPrivateKey(...)
Account.fromDerivationPath(...)
mnemonic / seed phrase / raw private key env vars
```

## API Key Boundary

Default rule:

- `SHELBY_API_KEY` is server-only.
- Do not create `NEXT_PUBLIC_SHELBY_API_KEY`.

Browser wallet path creates an API-key tension: browser SDK upload may need a client-safe key or anonymous/lower-limit mode. M3 must not expose server keys to solve this.

M3 implementation should support two configurations:

1. **Anonymous/client-safe browser path** if official docs prove it is supported.
2. **Fail-closed browser path** with a clear error if upload requires a server-only key and no safe client key is configured.

If Shelby provides a scoped frontend key later, add a separate variable:

```env
NEXT_PUBLIC_SHELBY_CLIENT_KEY=
```

Only add it after official docs confirm browser safety.

## Environment Plan

M3 should keep current server-side variables:

```env
SHELBY_MODE=mock
SHELBY_NETWORK=testnet
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
SHELBY_API_KEY=
SHELBY_ACCOUNT_ADDRESS=
SHELBY_BLOB_EXPIRATION_MICROS=
APTOS_NETWORK=testnet
SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1
SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
SHELBY_COORDINATION_ACCOUNT_ADDRESS=
```

M3 may add:

```env
NEXT_PUBLIC_SHELBY_NETWORK=testnet
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql
```

Only public endpoint values may use `NEXT_PUBLIC_*`. No secret values.

## Data Model Mapping

M3 real upload should populate:

```ts
BlobRecord {
  dataSource: 'shelby-testnet';
  uploadMode: 'testnet';
  network: 'testnet';
  accountAddress: wallet account address;
  blobName: generated stable blob name;
  transactionHash: tx hash if returned/available;
  expirationMicros: configured expiration;
  storageStatus: 'ready' | 'registered' | 'uploading' | 'failed' | 'unknown';
  commitmentRoot: commitment root if returned/available;
  explorerUrl: generated explorer URL;
  retrievalUrl: generated RPC retrieval URL;
}
```

Blob name generation:

```txt
evidence/{packId}/{safe-file-name}
```

or:

```txt
evidence/{packId}/{sha256-prefix}-{safe-file-name}
```

Recommendation:

```txt
evidence/{packId}/{sha256-prefix}-{safe-file-name}
```

This prevents filename collisions inside an account namespace and keeps URLs meaningful.

## Real Upload Flow For M3

Browser wallet path:

```txt
1. User selects file.
2. Browser computes SHA-256.
3. Browser creates/generates blobName.
4. User connects Aptos wallet.
5. App constructs ShelbyClient with Network.TESTNET.
6. App calls React/browser SDK upload path with WalletAdapterSigner.
7. SDK encodes/generates commitments.
8. Wallet signs on-chain registration transaction.
9. SDK waits for confirmation.
10. SDK uploads bytes through Shelby RPC.
11. App stores real BlobRecord metadata locally.
12. Blob detail shows real identity and explorer/retrieval links.
```

Fail-closed requirements:

- If wallet is not connected: show blocked state.
- If expiration is missing: show blocked state.
- If API key/client-safe key requirement is unresolved: show blocked state.
- If network is not testnet: show blocked state.
- If upload succeeds but metadata is incomplete: store status as `unknown` and show a warning.

## UI Scope For M3

Codex owns UI.

Copilot M3 should not redesign UI.

Minimal UI hooks allowed for Copilot:

- Add state fields and adapter return values.
- Expose clear status/error values for Codex UI.
- Keep existing upload page functional in mock mode.

UI work later:

- wallet connect polish
- real/testnet badges
- explorer/retrieval link presentation
- status timeline
- brand visual upgrade

## Read Receipt Implications For M4

M4 should bind receipts to `BlobRecord` identity, not to raw strings.

Receipt should reference:

```ts
referencedBlobIds: string[];
referencedPackIds: string[];
```

Blob detail provides:

- `accountAddress`
- `blobName`
- `network`
- `transactionHash`
- `storageStatus`
- `explorerUrl`
- `retrievalUrl`

M4 receipt UI should show:

```txt
Agent answer
-> referenced Evidence Pack
-> referenced BlobRecord
-> Shelby account/blobName
-> explorer/RPC retrieval proof
```

Real LLM execution remains out of scope.

## M3 Copilot Task Shape

Copilot should receive one large implementation task:

```txt
M3: Implement browser-wallet Shelby testnet upload behind adapter boundary
```

Allowed:

- Install approved SDK packages.
- Add a browser/testnet upload service behind `src/lib/shelby/`.
- Add wallet adapter dependency if required.
- Populate real BlobRecord fields.
- Keep mock mode default and untouched.
- Add fail-closed states.
- Add focused tests or smoke utility if practical.

Not allowed:

- UI redesign.
- Private key env vars.
- Server signer.
- Production DB.
- Real AI calls.
- Marketplace/trading/token speculation.
- Social posting.

Acceptance:

- `npm run lint` passes.
- `npm run build` passes.
- Mock mode still works with no env vars.
- Testnet mode cannot expose secrets.
- Wallet-required path fails clearly when wallet/config is absent.
- Successful upload, if manually configured, stores account/blobName/network/status fields.

## Remaining Unknowns Before M3 Starts

These are not product blockers, but they must be resolved inside the M3 implementation PR:

1. Whether Shelby browser upload can run with anonymous mode or requires a browser-safe client key.
2. Whether React SDK `useUploadBlobs()` exposes transaction hash/commitment metadata, since its current type returns `void`.
3. Whether lower-level SDK calls are needed to capture transaction hash and commitment root.
4. Whether Aptos wallet adapter support requires additional wallet provider setup at app root.
5. Whether current testnet funding can be handled operationally without adding faucet UI.

If these are blocked, M3 must stop at fail-closed implementation and document the blocker.

## Final M2 Decision

The product architecture is ready to proceed to M3 implementation with these decisions:

- Target Shelby testnet.
- Use `Network.TESTNET`.
- Use browser wallet path first.
- Keep server signer out of scope.
- Keep API keys private unless official docs prove a client-safe key.
- Keep localStorage for real testnet metadata in this stage.
- Keep UI redesign paused.
- Use Copilot only for the single large M3 implementation task.
