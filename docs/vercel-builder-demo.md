# Vercel Builder Demo Deployment

Date: 2026-05-09
Status: X21 Vercel + Neon builder demo

This stage positions Shelby AI Evidence Vault as a developer-built Shelby
testnet demo: something the Shelby team and community can open, inspect, and
optionally try with a wallet. It is not presented as a production ecosystem
service.

## Deployment Shape

```txt
Vercel
  -> Next.js website, Server Actions, health endpoint

Neon Postgres
  -> EvidencePack, BlobRecord, ReadReceipt JSON records

Shelby testnet
  -> Real Blob storage/proof path through browser-wallet upload
```

Local development still uses SQLite by default. Vercel uses Neon/Postgres when
`DATABASE_URL` is present.

## Required Vercel Environment

Set these in Vercel Project Settings -> Environment Variables:

```bash
SHELBY_MODE=testnet
NEXT_PUBLIC_SHELBY_NETWORK=testnet
NEXT_PUBLIC_TESTNET_API_KEY=<Shelby/Geomi frontend client key>
DATABASE_URL=<Neon pooled or direct Postgres connection string>
```

Recommended:

```bash
EVIDENCE_STORE=postgres
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql
NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24
```

Do not set:

```bash
NEXT_PUBLIC_DATABASE_URL=
NEXT_PUBLIC_POSTGRES_URL=
NEXT_PUBLIC_NEON_DATABASE_URL=
NEXT_PUBLIC_SHELBY_API_KEY=
NEXT_PUBLIC_SHELBY_PRIVATE_KEY=
NEXT_PUBLIC_SHELBY_SEED=
NEXT_PUBLIC_SHELBY_MNEMONIC=
```

## Neon Setup

1. Create a Neon project.
2. Copy the Postgres connection string.
3. Add it to Vercel as `DATABASE_URL`.
4. Deploy the app.
5. Open `/api/health`.

The app creates these tables automatically on first persistence access:

- `evidence_packs`
- `blob_records`
- `read_receipts`

Each table stores typed records as `JSONB` payloads so the builder demo can
evolve without a heavy migration system.

## Preflight

Run locally or in a deployment shell with the same env shape:

```bash
SHELBY_MODE=testnet \
NEXT_PUBLIC_SHELBY_NETWORK=testnet \
NEXT_PUBLIC_TESTNET_API_KEY="$NEXT_PUBLIC_TESTNET_API_KEY" \
DATABASE_URL="$DATABASE_URL" \
npm run verify-vercel-builder-demo
```

Expected:

```txt
Deploy ready : yes
Failed       : 0
```

This preflight never prints key values.

## Health Check

Open:

```txt
https://<deployment-url>/api/health
```

Expected:

```json
{
  "positioning": "builder-demo",
  "ok": true,
  "persistence": {
    "kind": "postgres",
    "ready": true,
    "configured": true
  }
}
```

## Demo Path

1. Open `/`.
2. Open `/testnet`.
3. Connect an Aptos Testnet wallet.
4. Open `/upload`.
5. Upload one small evidence file.
6. Approve wallet signing.
7. Open the generated Blob detail page.
8. Open the generated Read Receipt page.
9. Return to `/testnet` and copy the handoff JSON.

## Positioning Boundary

Use this wording:

> Shelby AI Evidence Vault is a builder demo showing one possible AI evidence
> workflow on Shelby testnet.

Avoid this wording:

- official Shelby ecosystem product
- production storage service
- mainnet launch
- hosted custody service
- marketplace
- payment or trading product

This is a community-visible proof of work from a developer builder.
