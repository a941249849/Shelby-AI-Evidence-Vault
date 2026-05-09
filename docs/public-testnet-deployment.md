# Public Testnet Deployment

Date: 2026-05-09
Status: X20 public deployment package

This document turns the merged public testnet candidate into a community-facing
deployment plan.

## Deployment Target

Use a long-running Node.js runtime with a persistent writable disk.

Recommended:

- VPS, Railway persistent volume, Fly.io volume, Render disk, or a similar Node
  service with persistent storage.
- Docker image from this repo with `/app/data` mounted as a persistent volume.

Avoid for this stage:

- Edge runtime.
- Pure serverless deployments without a persistent disk.
- Static export.

Reason: this candidate uses `better-sqlite3` for the operator/community
experiment ledger. The database is intentionally local and simple for this
stage, but it still needs a writable persistent filesystem.

## Required Environment

```bash
SHELBY_MODE=testnet
NEXT_PUBLIC_SHELBY_NETWORK=testnet
NEXT_PUBLIC_TESTNET_API_KEY=<Shelby/Geomi frontend client key>
SHELBY_DB_PATH=/app/data/shelby-vault.sqlite
```

Recommended:

```bash
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql
NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24
```

Never set:

```bash
NEXT_PUBLIC_SHELBY_API_KEY=
NEXT_PUBLIC_SHELBY_SECRET=
NEXT_PUBLIC_SHELBY_SECRET_KEY=
NEXT_PUBLIC_SHELBY_PRIVATE_KEY=
NEXT_PUBLIC_SHELBY_SEED=
NEXT_PUBLIC_SHELBY_MNEMONIC=
```

The browser key must be a frontend/client key intended for public DApp use. Do
not place server/private API keys, seed phrases, or signer material in any
`NEXT_PUBLIC_` variable.

## Docker Run

Build:

```bash
docker build -t shelby-ai-evidence-vault:testnet .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  -e SHELBY_MODE=testnet \
  -e SHELBY_DB_PATH=/app/data/shelby-vault.sqlite \
  -e NEXT_PUBLIC_SHELBY_NETWORK=testnet \
  -e NEXT_PUBLIC_TESTNET_API_KEY="$NEXT_PUBLIC_TESTNET_API_KEY" \
  -e NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby \
  -e NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql \
  -e NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24 \
  shelby-ai-evidence-vault:testnet
```

Open:

```txt
http://localhost:3000/testnet
```

## Preflight

Run before opening the deployment to the community:

```bash
SHELBY_MODE=testnet \
NEXT_PUBLIC_SHELBY_NETWORK=testnet \
NEXT_PUBLIC_TESTNET_API_KEY="$NEXT_PUBLIC_TESTNET_API_KEY" \
SHELBY_DB_PATH=/absolute/persistent/path/shelby-vault.sqlite \
npm run verify-public-testnet-deploy
```

The script is local and non-networked. It validates:

- testnet mode
- browser testnet network
- frontend client API key presence
- forbidden public secret names
- URL shapes for optional endpoint overrides
- upload expiration shape
- writable persistent SQLite directory

## Runtime Health

The deployed app exposes:

```txt
/api/health
```

Expected healthy response:

```json
{
  "ok": true,
  "runtime": {
    "mode": "testnet",
    "network": "testnet",
    "node": "nodejs"
  },
  "browserTestnet": {
    "network": "testnet",
    "apiKeyConfigured": true
  },
  "persistence": {
    "sqlite": "ready"
  }
}
```

This endpoint never prints key values.

## Community Test Flow

1. Open `/testnet`.
2. Confirm `testnet-ready` and wallet readiness.
3. Connect an Aptos Testnet wallet.
4. Confirm the wallet has testnet APT and ShelbyUSD or the current Shelby
   storage credit requirement.
5. Open `/upload`.
6. Upload one small file.
7. Approve wallet signing.
8. Open the generated Blob detail page and run proof verification.
9. Open the generated Read Receipt page and run receipt verification.
10. Return to `/testnet` and copy the handoff JSON.
11. Validate the copied handoff:

```bash
npm run verify-testnet-handoff -- path/to/handoff.json
```

## Release Boundary

This deployment is still a public testnet community experiment:

- no mainnet claim
- no private-key custody
- no server signer
- no token purchase, payment, trading, marketplace, or dataset-sale surface
- no hosted production database claim

The current persistence layer is a local SQLite community experiment ledger.
For a later production stage, replace it with a hosted database and account-level
record ownership rules.
