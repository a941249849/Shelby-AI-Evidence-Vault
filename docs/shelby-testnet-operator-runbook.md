# Shelby Testnet Operator Runbook

**Stage: C11 — Shelby testnet readiness doctor and operator verification package**

Date: 2026-05-08

This runbook is for operators who want to run Shelby AI Evidence Vault against the real Shelby testnet using the browser-wallet upload path. It is not required for local/mock usage — the community experiment path works with zero credentials.

---

## Contents

1. [Boundaries and modes](#1-boundaries-and-modes)
2. [Prerequisites](#2-prerequisites)
3. [Environment setup](#3-environment-setup)
4. [Readiness doctor](#4-readiness-doctor)
5. [Manual browser-wallet upload path](#5-manual-browser-wallet-upload-path)
6. [Smoke retrieval check (post-upload)](#6-smoke-retrieval-check-post-upload)
7. [Expected outputs](#7-expected-outputs)
8. [Failure modes and troubleshooting](#8-failure-modes-and-troubleshooting)
9. [Security rules](#9-security-rules)
10. [Operator verification items](#10-operator-verification-items)

---

## 1. Boundaries and modes

### What this app supports

| Mode | Description | Default? |
|------|-------------|----------|
| **Mock/local** | Local demo, no network, `shelby://mock/blob/{id}` refs | **Yes** |
| **Browser-wallet testnet** | Real Shelby testnet upload via Aptos wallet extension | Opt-in |
| Mainnet | Not implemented, not planned | No |

### What "testnet mode" means

- The upload page shows a wallet-connect button.
- After signing in your Aptos wallet, the app calls the Shelby SDK's `useUploadBlobs` hook.
- The hook registers the blob on-chain and uploads it to the Shelby testnet RPC.
- The result is a real `shelby://testnet/{account}/{blobName}` reference and a `storageStatus: 'registered'` field in the BlobRecord.
- **No mainnet funds are moved. No production systems are affected.**

### What testnet mode does not do

- Does not move mainnet funds.
- Does not grant production system access.
- Does not affect other users or community testers.
- The C9 verification harness (`npm run verify-community-demo`) does not test this path.

---

## 2. Prerequisites

Before attempting a real testnet upload, you must have:

| Requirement | Notes |
|-------------|-------|
| Node.js 18+ | Tested with Node.js 20 LTS |
| A cloned repo | `git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault` |
| `npm install` done | All SDK packages installed |
| **Aptos wallet extension** | e.g. [Petra](https://petra.app/) — required for browser wallet signing |
| **Testnet APT** | For on-chain commitment registration gas fees — from the [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet) |
| **Shelby storage credits** | ShelbyUSD or SHEL tokens on your connected wallet account — required for Shelby storage operations. Verify current token/funding requirements with official Shelby docs |
| **Shelby API key** | Required if the Shelby RPC requires authenticated requests. Verify with official Shelby docs |
| **`.env.local`** | Created from `.env.example` with real (non-secret) testnet values |

> **Operator verification item:** The exact funding requirements (gas token, storage token amounts) should be confirmed against the current official Shelby testnet documentation before proceeding. Do not assume the values from any earlier audit are still current.

---

## 3. Environment setup

### Step 1 — Copy the env template

```bash
cp .env.example .env.local
```

Never commit `.env.local`. It is gitignored.

### Step 2 — Edit `.env.local` for testnet mode

Fill in the values below. Comments in brackets indicate what to look up.

```env
# ── Adapter mode ──────────────────────────────────────────────────────────────
SHELBY_MODE=testnet

# ── Plane 1: Shelby storage / RPC plane ──────────────────────────────────────
# Shelby network name (must match NEXT_PUBLIC_SHELBY_NETWORK and APTOS_NETWORK)
SHELBY_NETWORK=testnet

# Shelby RPC endpoint for blob storage operations (Plane 1, not an Aptos fullnode)
SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby

# Shelby API key — server-side only, NEVER use NEXT_PUBLIC_SHELBY_API_KEY
SHELBY_API_KEY=<your-shelby-api-key>

# Your Shelby account address (public identifier, not a secret)
SHELBY_ACCOUNT_ADDRESS=0x<your-account-address>

# Blob upload expiration in microseconds (required for real uploads)
# 1800000000 = 30 minutes; 86400000000 = 24 hours
SHELBY_BLOB_EXPIRATION_MICROS=1800000000

# ── Plane 2: Aptos coordination plane ─────────────────────────────────────────
APTOS_NETWORK=testnet
SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1
SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql

# ── Browser-side (NEXT_PUBLIC_) configuration ─────────────────────────────────
# These are embedded in the browser bundle — they must be public-safe (URLs only)
NEXT_PUBLIC_SHELBY_NETWORK=testnet
NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby
# Official Shelby-aliased indexer URL (verify against current Shelby SDK docs):
NEXT_PUBLIC_SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql
NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24
```

> **Operator verification item:** Confirm the current official `NEXT_PUBLIC_SHELBY_INDEXER_URL` value from the Shelby SDK documentation or the `@shelby-protocol/react` package defaults. The value above is from a prior audit and may have changed.

### Step 3 — Load env vars for terminal commands

```bash
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
```

Or pass them inline for individual commands (shown below).

---

## 4. Readiness doctor

Run the readiness doctor before attempting any testnet operation. It inspects your config only — no network calls, no uploads.

### Default (mock) mode — should always pass with zero credentials

```bash
npm run shelby-doctor
```

Expected output (abbreviated):
```
[shelby-doctor] ── Shelby Readiness Doctor ────────────────────────────────
  Mode         : mock
  ✓ [PASS] No browser-public API key variables detected.
  ✓ [PASS] Mock mode: real upload is disabled by default.
  · [SKIP] Testnet-specific env var checks skipped (mock mode).
  Overall : PASS
[shelby-doctor] PASS — mock/local mode is ready. No credentials needed.
```

### Testnet mode with missing config — should fail closed

```bash
SHELBY_MODE=testnet npm run shelby-doctor
```

Expected: exits non-zero with one `FAIL` per missing required variable.

### Testnet mode with complete config

```bash
# With .env.local loaded:
npm run shelby-doctor
```

Expected:
```
[shelby-doctor] PASS — testnet config looks complete. Run preflight steps before upload.
  See docs/shelby-testnet-operator-runbook.md for the manual upload path.
```

Exit code `0` = all checks passed (no errors). Warnings (`~`) are informational but should be reviewed.

### Machine-readable JSON output

```bash
npm run shelby-doctor -- --json
```

The JSON structure:
```json
{
  "doctorVersion": "1",
  "timestamp": "2026-05-08T...",
  "mode": "testnet",
  "overallStatus": "PASS",
  "summary": { "pass": 13, "warn": 0, "fail": 0 },
  "checks": [...]
}
```

---

## 5. Manual browser-wallet upload path

The browser-wallet upload path cannot be automated. It requires an interactive Aptos wallet extension and a funded testnet account.

### Step 1 — Run the readiness doctor

```bash
npm run shelby-doctor
```

Must exit with code `0` before proceeding.

### Step 2 — Start the development server

```bash
npm run dev
# App available at http://localhost:3000
```

### Step 3 — Connect your wallet

Navigate to `http://localhost:3000/upload`.

In testnet mode, the upload page shows a **"Connect wallet"** button (AptosWalletAdapterProvider). Click it and connect your Aptos wallet (Petra or compatible).

Your wallet must be connected to the Aptos testnet. In Petra: Settings → Network → Testnet.

### Step 4 — Upload a file

1. Select a file (up to 5 MB).
2. Enter a title.
3. Click the upload button.
4. Your wallet extension will prompt you to sign a transaction. Review and approve it.
5. The SDK:
   - Computes the blob commitment.
   - Registers the commitment on-chain (requires testnet APT for gas).
   - Uploads the blob to the Shelby RPC (requires Shelby storage credits).
6. On success, the upload page shows:
   - The blob detail link (e.g. `/blob/<your-id>`)
   - The Shelby testnet reference: `shelby://testnet/{account}/{blobName}`
   - A read receipt link

### Step 5 — Record the result

Note down:
- Your **Aptos account address** from the wallet
- The **Shelby blob name** shown on the upload success screen (format: `evidence/{packId}/{hash}-{filename}`)

You will need these for the smoke retrieval check.

### What to expect if upload fails

See [Section 8 — Failure modes](#8-failure-modes-and-troubleshooting).

---

## 6. Smoke retrieval check (post-upload)

After a successful manual upload, you can verify blob retrieval using the opt-in smoke harness.

### Step 1 — Set retrieval env vars

Add to `.env.local` (or export in shell):

```env
SHELBY_SMOKE=true
SHELBY_SMOKE_ACCOUNT_ADDRESS=0x<your-account-address>
SHELBY_SMOKE_BLOB_NAME=evidence/<your-pack-id>/<hash>-<filename>
```

### Step 2 — Run the smoke harness

```bash
npm run smoke
```

The smoke harness:
1. Validates config vars.
2. Checks Shelby RPC host reachability (non-destructive HTTP GET).
3. Attempts retrieval of the specified blob via the RPC.
4. Writes a JSON result to `tmp/shelby-smoke/smoke-{timestamp}.json`.
5. Prints a human-readable summary.

### Expected output (retrieval success)

```
[shelby-smoke] ── Smoke test complete ────────────────────────────────
  Network      : testnet
  RPC URL      : https://api.testnet.shelby.xyz/shelby
  Config       : ✓ pass
  Host reach.  : ✓ HTTP 200 — host reachable, endpoint confirmed.
  Retrieval    : ✓ Blob retrieved successfully (HTTP 200).
  StorageStatus: ready
  Overall      : retrieval-ok
```

See `docs/c3-smoke-test-guide.md` for full smoke harness documentation.

---

## 7. Expected outputs

### Doctor — mock mode (zero credentials)

```
Overall : PASS
Exit code: 0
```

### Doctor — testnet mode, missing config

```
Overall : FAIL
Failed  : 12 (all required vars missing)
Exit code: 1
```

### Doctor — testnet mode, complete config

```
Overall : PASS
Passed : 13
Exit code: 0
```

### Doctor — public API key guard triggered

```
✗ [FAIL] SECURITY: NEXT_PUBLIC_SHELBY_API_KEY is set — this exposes a secret to the browser bundle.
Overall : FAIL
Exit code: 1
```

### Smoke — after successful upload

```
Overall: retrieval-ok
Exit code: 0
```

---

## 8. Failure modes and troubleshooting

### Doctor fails: "SHELBY_MODE is not set"

Not an error — mock mode is the default. If you intended testnet, set `SHELBY_MODE=testnet`.

### Doctor fails: missing required vars

Run `SHELBY_MODE=testnet npm run shelby-doctor` to see exactly which vars are missing with action items.

### Doctor warns: RPC URL looks like an Aptos endpoint

`SHELBY_RPC_URL` should be the Shelby blob storage RPC (Plane 1), not the Aptos fullnode URL (Plane 2). See the two-plane architecture in `docs/shelby-integration.md`.

### Doctor warns: server/browser network labels disagree

`SHELBY_NETWORK` (server-side) and `NEXT_PUBLIC_SHELBY_NETWORK` (browser-side) must match. Set both to `testnet`.

### Doctor warns: testnet/shelbynet endpoint family mismatch

Do not mix `shelbynet` URLs with `testnet` labels. Choose one endpoint family and use it consistently for all variables.

### Upload fails: "wallet not connected"

Ensure your Aptos wallet extension is installed, unlocked, and connected to Aptos testnet.

### Upload fails: "insufficient funds" or "transaction rejected"

Your wallet needs testnet APT for gas fees. Use the [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet). You also need Shelby storage credits — verify the current funding path with official Shelby docs.

### Upload succeeds but `storageStatus` stays "registered" (not "ready")

`registered` = on-chain commitment recorded. `ready` = blob confirmed retrievable via RPC. The React SDK hook (`useUploadBlobs`) returns void and does not expose the transaction hash directly. Run the smoke retrieval check (Section 6) to confirm the blob is retrievable.

### Smoke fails: "host unreachable"

The Shelby testnet RPC may be temporarily unavailable, or `SHELBY_RPC_URL` may be incorrect. Verify the URL and try again later.

### Smoke fails: "SHELBY_SMOKE is not set to true"

The smoke harness is disabled by default. Add `SHELBY_SMOKE=true` to enable it.

---

## 9. Security rules

These are hard rules, not recommendations:

| Rule | Why |
|------|-----|
| **Never set `NEXT_PUBLIC_SHELBY_API_KEY`** | `NEXT_PUBLIC_` vars are embedded in the browser bundle and visible to all users |
| **Never commit `.env.local`** | It is gitignored for this reason |
| **Never commit private keys, seed phrases, or mnemonics** | Not now, not in a "test" commit |
| **SHELBY_API_KEY is server-side only** | Only called from Server Actions and API routes |
| **No private key custody** | Browser wallet signing delegates signing to the wallet extension — the app never holds a key |
| **Do not enable real upload by default** | `SHELBY_MODE=mock` is the default |
| **Do not mix endpoint families** | testnet and shelbynet URLs must not appear in the same runtime config |

The doctor checks for `NEXT_PUBLIC_SHELBY_API_KEY` and similar patterns and exits non-zero if found. This check runs in both mock and testnet mode.

---

## 10. Operator verification items

The following items require manual verification against current official Shelby documentation. They cannot be confirmed from source code alone.

1. **Shelby testnet RPC URL**: `https://api.testnet.shelby.xyz/shelby` — confirm this is the current official blob storage endpoint.

2. **Shelby indexer URL for browser SDK**: The value in `.env.example` (`https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql`) was from a prior SDK audit. Confirm the current value from `@shelby-protocol/react` or `@shelby-protocol/sdk` documentation.

3. **API key requirement**: The doctor checks for the presence of `SHELBY_API_KEY`. Confirm whether the current Shelby testnet RPC requires an API key for blob upload and/or retrieval.

4. **Storage token requirements**: The amount of ShelbyUSD or SHEL tokens required per upload is not documented in this codebase. Verify with official Shelby docs before attempting uploads.

5. **Coordination contract address**: The `SHELBY_DEPLOYER` contract address (`0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a`) is used internally by the SDK. Verify it is current against the official Shelby Networks page or explorer.

6. **`@shelby-protocol/react` v2.0.0 `useUploadBlobs()` return type**: Confirmed void — transaction hash and commitment root are not accessible from the React hook. If a future SDK version exposes these, update `use-shelby-upload.ts` accordingly.

7. **Testnet faucet availability**: Verify the Aptos testnet faucet URL and rate limits are current before directing operators to fund their wallets.

---

## File reference

| File | Purpose |
|------|---------|
| `scripts/shelby-doctor.mjs` | Readiness doctor (this stage, C11) |
| `scripts/shelby-smoke.mjs` | Opt-in smoke retrieval harness (C3) |
| `src/lib/shelby/use-shelby-upload.ts` | Browser-wallet upload React hook (M3) |
| `src/lib/shelby/browser-client.ts` | Browser-side Shelby SDK config (M3) |
| `src/lib/shelby/config.ts` | Server-side config reader |
| `.env.example` | Template with all env vars documented |
| `docs/c3-smoke-test-guide.md` | Full smoke harness documentation |
| `docs/shelby-integration.md` | Historical M1B guide (see header for current status) |
| `docs/m2-shelby-testnet-integration-design.md` | M2 design doc |
| `docs/community-experiment-runbook.md` | Community/local-mode runbook |
