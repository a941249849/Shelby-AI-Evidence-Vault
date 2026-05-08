#!/usr/bin/env node
/**
 * Shelby testnet smoke harness — opt-in, non-destructive.
 *
 * USAGE:
 *   SHELBY_SMOKE=true \
 *   SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby \
 *   SHELBY_NETWORK=testnet \
 *   node scripts/shelby-smoke.mjs
 *
 * Or via npm:
 *   SHELBY_SMOKE=true node scripts/shelby-smoke.mjs
 *   npm run smoke   (requires env vars to be set in shell or .env.local)
 *
 * OPT-IN GATE:
 *   Requires SHELBY_SMOKE=true. Exits with code 2 if not set.
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Validates that required env vars are present (config check).
 *   2. Checks RPC connectivity via a non-destructive HTTP GET.
 *   3. If SHELBY_SMOKE_ACCOUNT_ADDRESS + SHELBY_SMOKE_BLOB_NAME are set,
 *      attempts a retrieval check for a previously uploaded blob.
 *   4. Writes a machine-readable JSON result to tmp/shelby-smoke/.
 *   5. Prints a human-readable summary to stdout.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Upload new blobs. Browser-wallet upload cannot be automated non-interactively.
 *     See docs/c3-smoke-test-guide.md for the manual browser upload path.
 *   - Use, request, or store any private key, seed phrase, or signing material.
 *   - Modify app state or localStorage.
 *
 * REQUIRED ENV VARS:
 *   SHELBY_SMOKE=true
 *   SHELBY_RPC_URL          Shelby RPC base URL (e.g. https://api.testnet.shelby.xyz/shelby)
 *   SHELBY_NETWORK          Network label (e.g. testnet)
 *
 * OPTIONAL ENV VARS:
 *   SHELBY_SMOKE_ACCOUNT_ADDRESS   Aptos account address from a prior manual upload
 *   SHELBY_SMOKE_BLOB_NAME         Shelby blob name from a prior manual upload
 *
 * OUTPUT:
 *   tmp/shelby-smoke/smoke-{ISO_TIMESTAMP}.json  (gitignored)
 *
 * EXIT CODES:
 *   0  — connectivity verified (or nothing to check)
 *   1  — config incomplete or RPC unreachable
 *   2  — opt-in gate not set
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ── Opt-in gate ───────────────────────────────────────────────────────────────
if (process.env.SHELBY_SMOKE !== 'true') {
  console.error(
    '\n[shelby-smoke] ERROR: SHELBY_SMOKE is not set to "true".\n' +
    '  This script is opt-in and disabled by default.\n' +
    '  Set SHELBY_SMOKE=true to run the smoke harness.\n' +
    '  See docs/c3-smoke-test-guide.md for full instructions.\n'
  );
  process.exit(2);
}

// ── Read env vars ─────────────────────────────────────────────────────────────
const rpcUrl = (process.env.SHELBY_RPC_URL || '').replace(/\/$/, '');
const network = process.env.SHELBY_NETWORK || '';
const smokeAccountAddress = process.env.SHELBY_SMOKE_ACCOUNT_ADDRESS || '';
const smokeBlobName = process.env.SHELBY_SMOKE_BLOB_NAME || '';

const timestamp = new Date().toISOString();

// ── Build result structure ─────────────────────────────────────────────────────
const result = {
  smokeVersion: '1',
  timestamp,
  network: network || '(not set)',
  rpcUrl: rpcUrl || '(not set)',
  configCheck: {
    pass: false,
    missing: /** @type {string[]} */ ([]),
  },
  rpcConnectivity: {
    checked: false,
    probeUrl: '',
    httpStatus: /** @type {number | null} */ (null),
    ok: false,
    detail: '',
  },
  retrievalCheck: {
    checked: false,
    accountAddress: smokeAccountAddress || '(not set)',
    blobName: smokeBlobName || '(not set)',
    url: '',
    httpStatus: /** @type {number | null} */ (null),
    ok: false,
    storageStatus: 'unknown',
    explorerUrl: '',
    detail: '',
  },
  uploadSmoke: {
    checked: false,
    detail:
      'Browser-wallet upload cannot be run non-interactively. ' +
      'A connected Aptos wallet (e.g. Petra) is required. ' +
      'See docs/c3-smoke-test-guide.md for the manual browser upload path.',
  },
  overallStatus: 'unknown',
  manualVerificationNotes: /** @type {string[]} */ ([]),
};

// ── Step 1: Config check ──────────────────────────────────────────────────────
const missing = [];
if (!rpcUrl) missing.push('SHELBY_RPC_URL');
if (!network) missing.push('SHELBY_NETWORK');
result.configCheck.missing = missing;
result.configCheck.pass = missing.length === 0;

if (!result.configCheck.pass) {
  console.error(
    `\n[shelby-smoke] Missing required env vars: ${missing.join(', ')}\n` +
    '  Add them to .env.local (never commit real values).\n' +
    '  See .env.example and docs/c3-smoke-test-guide.md.\n'
  );
}

// ── Step 2: RPC connectivity check ───────────────────────────────────────────
if (rpcUrl) {
  result.rpcConnectivity.checked = true;
  // Probe the RPC health endpoint. Any HTTP response (even 404/401) confirms
  // the server is reachable. Only network/timeout errors mean unreachable.
  const probeUrl = `${rpcUrl}/v1/health`;
  result.rpcConnectivity.probeUrl = probeUrl;

  try {
    const res = await fetch(probeUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });
    result.rpcConnectivity.httpStatus = res.status;
    // Any HTTP response (including 4xx) means server is reachable
    result.rpcConnectivity.ok = true;
    result.rpcConnectivity.detail = `HTTP ${res.status} from ${probeUrl}`;
  } catch (/** @type {unknown} */ err) {
    result.rpcConnectivity.ok = false;
    result.rpcConnectivity.detail =
      `Network error: ${err instanceof Error ? err.message : String(err)}`;
  }
} else {
  result.rpcConnectivity.detail = 'Skipped: SHELBY_RPC_URL not set.';
}

// ── Step 3: Retrieval check ───────────────────────────────────────────────────
if (smokeAccountAddress && smokeBlobName) {
  result.retrievalCheck.checked = true;
  const retrievalUrl =
    `${rpcUrl}/v1/blobs/${smokeAccountAddress}/${encodeURIComponent(smokeBlobName)}`;
  const explorerUrl =
    `https://explorer.shelby.xyz/${network}/account/${smokeAccountAddress}` +
    `/blob/${encodeURIComponent(smokeBlobName)}`;
  result.retrievalCheck.url = retrievalUrl;
  result.retrievalCheck.explorerUrl = explorerUrl;

  try {
    const res = await fetch(retrievalUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    });
    result.retrievalCheck.httpStatus = res.status;
    result.retrievalCheck.ok = res.status === 200;

    if (res.status === 200) {
      result.retrievalCheck.storageStatus = 'ready';
      result.retrievalCheck.detail = 'Blob retrieved successfully (HTTP 200).';
    } else if (res.status === 404) {
      result.retrievalCheck.storageStatus = 'unknown';
      result.retrievalCheck.detail =
        'Blob not found (HTTP 404). May not have been uploaded yet, or the blob name/address is incorrect.';
    } else if (res.status === 401 || res.status === 403) {
      result.retrievalCheck.storageStatus = 'unknown';
      result.retrievalCheck.detail =
        `Access denied (HTTP ${res.status}). Blob may exist but require authentication.`;
    } else {
      result.retrievalCheck.storageStatus = 'unknown';
      result.retrievalCheck.detail = `Unexpected HTTP ${res.status}.`;
    }
  } catch (/** @type {unknown} */ err) {
    result.retrievalCheck.ok = false;
    result.retrievalCheck.storageStatus = 'unknown';
    result.retrievalCheck.detail =
      `Network error: ${err instanceof Error ? err.message : String(err)}`;
  }
} else {
  result.retrievalCheck.detail =
    'Skipped: SHELBY_SMOKE_ACCOUNT_ADDRESS and/or SHELBY_SMOKE_BLOB_NAME not set. ' +
    'Set these after a manual browser upload to verify retrieval.';
}

// ── Step 4: Overall status ────────────────────────────────────────────────────
if (!result.configCheck.pass) {
  result.overallStatus = 'config-incomplete';
} else if (result.rpcConnectivity.checked && !result.rpcConnectivity.ok) {
  result.overallStatus = 'rpc-unreachable';
} else if (result.retrievalCheck.checked) {
  result.overallStatus = result.retrievalCheck.ok ? 'retrieval-ok' : 'retrieval-failed';
} else if (result.rpcConnectivity.ok) {
  result.overallStatus = 'connectivity-ok-no-retrieval';
} else {
  result.overallStatus = 'config-incomplete';
}

// ── Step 5: Manual verification notes ────────────────────────────────────────
result.manualVerificationNotes = [
  'Browser-wallet upload cannot be verified non-interactively. A connected Aptos wallet is required.',
  'To smoke-test upload: follow the manual browser upload steps in docs/c3-smoke-test-guide.md.',
  'After manual upload: set SHELBY_SMOKE_ACCOUNT_ADDRESS and SHELBY_SMOKE_BLOB_NAME, then re-run this script.',
  '@shelby-protocol/react v2.0.0 useUploadBlobs() returns void — transactionHash and commitmentRoot are not available from the React hook.',
  'storageStatus "registered" = on-chain commitment recorded by the React SDK hook.',
  'storageStatus "ready" = blob confirmed retrievable via RPC HTTP 200 (requires retrieval check).',
];

if (smokeAccountAddress) {
  const explorerBase =
    `https://explorer.shelby.xyz/${network || 'testnet'}/account/${smokeAccountAddress}`;
  result.manualVerificationNotes.push(
    `Manual explorer check: ${explorerBase}${smokeBlobName ? `/blob/${encodeURIComponent(smokeBlobName)}` : ''}`
  );
}

// ── Step 6: Write JSON output ─────────────────────────────────────────────────
const outputDir = join(ROOT, 'tmp', 'shelby-smoke');
await mkdir(outputDir, { recursive: true });

const safeTimestamp = timestamp.replace(/[:.]/g, '-');
const outputPath = join(outputDir, `smoke-${safeTimestamp}.json`);
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf-8');

// ── Step 7: Print human-readable summary ─────────────────────────────────────
const ok = (v) => v ? '✓' : '✗';

console.log('\n[shelby-smoke] ── Smoke test complete ────────────────────────────────');
console.log(`  Timestamp    : ${result.timestamp}`);
console.log(`  Network      : ${result.network}`);
console.log(`  RPC URL      : ${result.rpcUrl}`);
console.log(`  Config       : ${result.configCheck.pass ? ok(true) + ' pass' : ok(false) + ' INCOMPLETE — missing: ' + result.configCheck.missing.join(', ')}`);

if (result.rpcConnectivity.checked) {
  console.log(`  RPC connect  : ${ok(result.rpcConnectivity.ok)} ${result.rpcConnectivity.detail}`);
} else {
  console.log(`  RPC connect  : — skipped`);
}

if (result.retrievalCheck.checked) {
  console.log(`  Retrieval    : ${ok(result.retrievalCheck.ok)} ${result.retrievalCheck.detail}`);
  console.log(`  StorageStatus: ${result.retrievalCheck.storageStatus}`);
  if (result.retrievalCheck.explorerUrl) {
    // Explorer URL is in the JSON output file; not echoed here to avoid
    // logging env-var-derived values in terminal output.
    console.log(`  Explorer URL : see output JSON file`);
  }
} else {
  console.log(`  Retrieval    : — skipped (set SHELBY_SMOKE_ACCOUNT_ADDRESS + SHELBY_SMOKE_BLOB_NAME)`);
}

console.log(`  Upload smoke : — skipped (browser-wallet upload cannot be automated)`);
console.log(`  Overall      : ${result.overallStatus}`);
console.log(`  Output file  : ${outputPath}`);
console.log('[shelby-smoke] ────────────────────────────────────────────────────────\n');

// Exit non-zero only for hard failures (config incomplete or RPC unreachable)
const exitCode = ['config-incomplete', 'rpc-unreachable'].includes(result.overallStatus) ? 1 : 0;
process.exit(exitCode);
