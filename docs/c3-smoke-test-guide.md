# C3 Smoke Test Guide — Shelby Testnet Upload Verification

Date: 2026-05-08
Status: **Implemented** (C3 production task)

This guide explains how to run the Shelby testnet smoke harness, what it verifies, and how to manually smoke-test the browser wallet upload path that cannot be automated.

---

## Overview

The smoke harness (`scripts/shelby-smoke.mjs`) is an **opt-in, non-destructive** Node.js script. It:

1. Validates that required env vars are present.
2. Checks Shelby RPC connectivity (non-destructive HTTP GET).
3. If you supply an account address and blob name from a prior manual upload, verifies retrieval via the Shelby RPC.
4. Writes a machine-readable JSON result to `tmp/shelby-smoke/` (gitignored).

**What it cannot do:** Upload new blobs. Browser-wallet upload requires an interactive Aptos wallet (e.g. Petra) and cannot be automated non-interactively. See [Manual Browser Upload Path](#manual-browser-upload-path) below.

---

## Security — Read First

- **Never commit private keys, seed phrases, mnemonics, or signing material** anywhere in source, docs, or `.env.*` files.
- Account addresses are public identifiers — not secrets. Blob names are also public. Do not confuse these with signing keys.
- The smoke harness script does **not** request, store, or touch any private key.
- `.env.local` is gitignored. Never commit it.
- `tmp/shelby-smoke/` is gitignored. Never commit smoke output files.

---

## Required Env Vars

| Variable | Required | Description |
|---|---|---|
| `SHELBY_SMOKE` | **Yes** | Must be `true` to run. Gate prevents accidental execution. |
| `SHELBY_RPC_URL` | **Yes** | Shelby RPC base URL. E.g. `https://api.testnet.shelby.xyz/shelby` |
| `SHELBY_NETWORK` | **Yes** | Network label. Use `testnet` for Shelby testnet. |
| `SHELBY_SMOKE_ACCOUNT_ADDRESS` | Optional | Aptos account address from a prior manual upload. Required for retrieval check. |
| `SHELBY_SMOKE_BLOB_NAME` | Optional | Shelby blob name from a prior manual upload. Required for retrieval check. |

None of these variables should ever contain private keys. Do not add `NEXT_PUBLIC_SHELBY_API_KEY`.

---

## Running the Smoke Harness

### Step 1: Set up env vars

Copy `.env.example` to `.env.local` (if you haven't already):

```bash
cp .env.example .env.local
```

Edit `.env.local` with real (non-secret) values:

```env
SHELBY_SMOKE=true
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
SHELBY_NETWORK=testnet
# Optional — set after a manual browser upload:
SHELBY_SMOKE_ACCOUNT_ADDRESS=0xYourAccountAddressHere
SHELBY_SMOKE_BLOB_NAME=evidence/your-pack-id/abcd1234-filename.json
```

### Step 2: Source env vars and run

```bash
# Load env vars from .env.local (or export them manually)
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

# Run the smoke harness
node scripts/shelby-smoke.mjs
# Or:
npm run smoke
```

### Step 3: Check output

The script prints a human-readable summary:

```
[shelby-smoke] ── Smoke test complete ────────────────────────────────
  Timestamp    : 2026-05-08T04:05:30.000Z
  Network      : testnet
  RPC URL      : https://api.testnet.shelby.xyz/shelby
  Config       : ✓ pass
  Host reach.  : ✓ HTTP 200 — host reachable, endpoint confirmed.
  Retrieval    : ✓ Blob retrieved successfully (HTTP 200).
  StorageStatus: ready
  Explorer URL : see output JSON file
  Upload smoke : — skipped (browser-wallet upload cannot be automated)
  Overall      : retrieval-ok
  Output file  : /path/to/tmp/shelby-smoke/smoke-2026-05-08T04-05-30-000Z.json
[shelby-smoke] ────────────────────────────────────────────────────────
```

If the Shelby RPC does not expose `/v1/health` (expected), the host reachability
line shows `~` (inconclusive) rather than `✗` or `✓`:

```
  Host reach.  : ~ HTTP 404 — host reachable but probe endpoint returned an error (inconclusive).
```

`~` means the host TCP/HTTP stack responded; it is not an RPC error. The overall
status will be `host-reachable-inconclusive` (exit 0).

It also writes a machine-readable JSON file to `tmp/shelby-smoke/smoke-{timestamp}.json`.

### Expected JSON output structure

```json
{
  "smokeVersion": "1",
  "timestamp": "2026-05-08T04:05:30.000Z",
  "network": "testnet",
  "rpcUrl": "https://api.testnet.shelby.xyz/shelby",
  "configCheck": {
    "pass": true,
    "missing": []
  },
  "rpcConnectivity": {
    "checked": true,
    "probeUrl": "https://api.testnet.shelby.xyz/shelby/v1/health",
    "httpStatus": 404,
    "ok": null,
    "detail": "HTTP 404 — host reachable but probe endpoint returned an error (inconclusive). ..."
  },
  "retrievalCheck": {
    "checked": true,
    "accountAddress": "0x...",
    "blobName": "evidence/pack-id/abcdef01-filename.json",
    "url": "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x.../evidence/pack-id/abcdef01-filename.json",
    "httpStatus": 200,
    "ok": true,
    "storageStatus": "ready",
    "explorerUrl": "https://explorer.shelby.xyz/testnet/account/0x.../blob/evidence/pack-id/abcdef01-filename.json",
    "detail": "Blob retrieved successfully (HTTP 200)."
  },
  "uploadSmoke": {
    "checked": false,
    "detail": "Browser-wallet upload cannot be run non-interactively. ..."
  },
  "overallStatus": "retrieval-ok",
  "manualVerificationNotes": [...]
}
```

Note: blob names with slash separators (e.g. `evidence/pack-id/abcdef01-filename.json`)
are encoded segment-by-segment, preserving `/` in the URL path. The blob name
`evidence/pack-id/abcdef01-filename.json` produces the path
`evidence/pack-id/abcdef01-filename.json` (slashes preserved), not `evidence%2Fpack-id%2F...`.

### `rpcConnectivity.ok` tri-state

| Value | Meaning |
|---|---|
| `true` | 2xx response — host confirmed reachable |
| `null` | Non-2xx response — host reachable, probe endpoint inconclusive |
| `false` | Network error — host unreachable |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Host reachable or inconclusive (or nothing to check). |
| `1` | Config incomplete or host truly unreachable (network error). |
| `2` | Opt-in gate not set (`SHELBY_SMOKE` not `true`). |

---

## When No Env Vars Are Set (Fail-Closed Behavior)

Running without `SHELBY_SMOKE=true` exits immediately with code 2 and a clear error:

```
[shelby-smoke] ERROR: SHELBY_SMOKE is not set to "true".
  This script is opt-in and disabled by default.
  Set SHELBY_SMOKE=true to run the smoke harness.
  See docs/c3-smoke-test-guide.md for full instructions.
```

Running with `SHELBY_SMOKE=true` but without `SHELBY_RPC_URL` and `SHELBY_NETWORK` exits with code 1:

```
[shelby-smoke] Missing required env vars: SHELBY_RPC_URL, SHELBY_NETWORK
```

---

## Manual Browser Upload Path

Browser-wallet upload **cannot be tested non-interactively**. The `@shelby-protocol/react` `useUploadBlobs()` hook requires:

- A running browser session
- A connected Aptos wallet (e.g. [Petra](https://petra.app/))
- The wallet must be on **Aptos Testnet**
- Testnet APT for transaction gas fees
- Sufficient Shelby storage credits (ShelbyUSD or SHEL)

### Manual steps

1. **Fund your wallet:** Get testnet APT from the [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet). Get Shelby storage credits from the Shelby testnet faucet if available.

2. **Start the app:**
   ```bash
   # .env.local should have NEXT_PUBLIC_SHELBY_NETWORK=testnet
   npm run dev
   ```

3. **Open the Upload page:** Navigate to `http://localhost:3000/upload`.

4. **Connect your wallet:** The upload page shows a wallet connect section when `SHELBY_MODE` is not `mock`. Click to connect your Aptos wallet.

5. **Select a file and fill the form:** Pick a small test file (JSON, text, etc.), fill in a title and tags, then click Upload.

6. **Complete the wallet transaction:** Your wallet will prompt you to sign an Aptos transaction. Approve it.

7. **Record the result:** After a successful upload, the app shows:
   - `accountAddress`: Your wallet address
   - `blobName`: e.g. `evidence/pack-id/abcdef01-test-file.json`
   - `shelbyRef`: e.g. `shelby://testnet/0x.../evidence/...`
   - `storageStatus`: `registered`
   - `explorerUrl`: Shelby explorer link

8. **Copy `accountAddress` and `blobName`** to your `.env.local`:
   ```env
   SHELBY_SMOKE_ACCOUNT_ADDRESS=0xYourAccountAddressFromUploadResult
   SHELBY_SMOKE_BLOB_NAME=evidence/pack-id/abcdef01-test-file.json
   ```

9. **Run the smoke harness** to verify retrieval:
   ```bash
   SHELBY_SMOKE=true node scripts/shelby-smoke.mjs
   ```

   If the blob is retrievable, you will see `storageStatus: "ready"` in the output.

---

## Status Mapping

The app uses conservative evidence storage status values defined in `src/lib/shelby/status-map.ts`:

| Status | Meaning |
|---|---|
| `registered` | On-chain commitment recorded; storage upload initiated. This is the highest confidence claim the React SDK hook can make (it returns `void` on success). |
| `ready` | Blob confirmed retrievable via Shelby RPC (HTTP 200). Requires a retrieval check. |
| `failed` | Upload or registration failed with a clear error. |
| `unknown` | SDK/RPC did not return enough proof to determine status (e.g. timeout, 5xx, or missing metadata). |

**SDK limitation note:** `@shelby-protocol/react` v2.0.0 `useUploadBlobs()` returns `void` on success. This means:
- `transactionHash` is not available from the React hook path.
- `commitmentRoot` is not available from the React hook path.
- `storageStatus` is set to `registered` (not `ready`) on a successful hook call.
- Promote to `ready` only after a successful RPC retrieval check confirms HTTP 200.

---

## What Was Manually Verified

**As of C3 (2026-05-08):**

| Item | Status | Notes |
|---|---|---|
| App builds with no errors | ✓ Verified | `npm run build` passes |
| App lints with no errors | ✓ Verified | `npm run lint` passes |
| Mock mode unchanged | ✓ Verified | No env vars needed for mock upload |
| Smoke script opt-in gate | ✓ Verified | Exits code 2 without `SHELBY_SMOKE=true` |
| Smoke script config check | ✓ Verified | Exits code 1 without required vars |
| `tmp/shelby-smoke/` gitignored | ✓ Verified | Added to `.gitignore` |
| Status mapping utilities | ✓ Implemented | `src/lib/shelby/status-map.ts` |
| Real testnet upload (browser) | ✗ Not run | Requires funded Aptos wallet + browser session (operator-dependent) |
| RPC connectivity to testnet | ✗ Not verified | No testnet credentials available in this CI environment |
| Blob retrieval via RPC | ✗ Not verified | Requires a prior manual upload |

**What blocked a real testnet smoke upload in this PR:**

- No funded Aptos testnet wallet is available in the CI/automation environment.
- No Shelby testnet API credentials are available.
- Browser-wallet upload requires an interactive browser session — this cannot be done in CI.
- These are operator-dependent prerequisites. See [Manual Browser Upload Path](#manual-browser-upload-path) for the steps to run once a funded wallet is available.

---

## File Reference

| File | Purpose |
|---|---|
| `scripts/shelby-smoke.mjs` | Opt-in Node.js smoke harness |
| `src/lib/shelby/status-map.ts` | Conservative evidence status mapping utilities |
| `docs/c3-smoke-test-guide.md` | This guide |
| `.env.example` | Template with all env vars including smoke vars |
| `tmp/shelby-smoke/` | Gitignored runtime output directory |
