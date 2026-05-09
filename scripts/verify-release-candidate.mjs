#!/usr/bin/env node
/**
 * C12: Release-candidate acceptance harness.
 *
 * USAGE:
 *   node scripts/verify-release-candidate.mjs
 *
 * Or via npm:
 *   npm run verify-release-candidate
 *
 * WHAT THIS SCRIPT DOES:
 *   Runs one deterministic acceptance command that verifies the product loop
 *   end to end from a clean zero-credential checkout:
 *
 *   source evidence → agent-run fixture → EvidencePack → BlobRecord →
 *   ReadReceipt → dashboard/read pages → operator readiness checks
 *
 *   1. Shelby doctor — mock/local mode: requires PASS exit 0.
 *   2. Shelby doctor — testnet mode: requires fail-closed exit 1 with no config.
 *   3. Shelby doctor — public-secret guard: NEXT_PUBLIC_SHELBY_API_KEY set;
 *      requires fail-closed exit 1.
 *   4. verify-community-demo: zero-credential DB-level harness; requires success.
 *   5. generate-agent-run: runs against isolated temp DB; verifies C8 IDs.
 *   6. testnet handoff summary contract: verifies copied JSON structure.
 *   7. npm run build: production Next.js build; requires exit 0.
 *   8. Start built app (next start) on available local port with isolated DB
 *      and SHELBY_MODE=mock; smoke-fetch key routes.
 *   9. Shut server down cleanly.
 *   10. Write JSON artifact to artifacts/release-candidate/latest.json.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Make any real Shelby network calls.
 *   - Use, request, or store any private key or signing material.
 *   - Call any real LLM or external API.
 *   - Mutate the operator's normal local SQLite database.
 *   - Print secrets or credential values.
 *
 * EXPECTED IDs (stable across runs — defined in generate-agent-run.mjs):
 *   Pack    : c8-pack-agent-sentinel-v1
 *   Blobs   : c8-blob-input-v1, c8-blob-output-v1
 *   Receipt : c8-rr-agent-sentinel-v1
 *
 * ROUTES SMOKE-CHECKED (HTTP 200 + page marker):
 *   /                                      Evidence Vault (footer text)
 *   /dashboard                             Evidence index
 *   /testnet                               公开测试网参与控制台
 *   /upload                                Package files into a verifiable
 *   /blob/blob-001                         Shelby AI Evidence Vault
 *   /read-receipt/rr-001                   Shelby AI Evidence Vault
 *   /read-receipt/c8-rr-agent-sentinel-v1  Shelby AI Evidence Vault
 *
 * EXIT CODES:
 *   0  — all checks passed
 *   1  — one or more checks failed
 */

import { spawnSync, spawn, execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { buildTestnetHandoffSummary } from '../src/lib/testnet/handoff.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// ── npm executable (cross-platform) ───────────────────────────────────────────
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// ── Expected C8 constants ─────────────────────────────────────────────────────
const C8_PACK_ID = 'c8-pack-agent-sentinel-v1';
const C8_BLOB_INPUT_ID = 'c8-blob-input-v1';
const C8_BLOB_OUTPUT_ID = 'c8-blob-output-v1';
const C8_RECEIPT_ID = 'c8-rr-agent-sentinel-v1';

// ── Artifact output ───────────────────────────────────────────────────────────
const artifactDir = join(ROOT, 'artifacts', 'release-candidate');
const artifactPath = join(artifactDir, 'latest.json');

// ── State ─────────────────────────────────────────────────────────────────────
let failCount = 0;
let passCount = 0;

/** @type {Array<{id: string, label: string, status: 'pass'|'fail'|'skip', detail?: string}>} */
const checkResults = [];

/** @type {Array<{route: string, status: number|null, ok: boolean, marker: string, found: boolean, error?: string}>} */
const routeResults = [];

let serverPort = null;
/** @type {import('node:child_process').ChildProcess | null} */
let serverProcess = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function pass(id, label, detail = '') {
  passCount++;
  checkResults.push({ id, label, status: 'pass', detail: detail || undefined });
  console.log(`  ✓  ${label}${detail ? ': ' + detail : ''}`);
}

function fail(id, label, detail = '') {
  failCount++;
  const msg = detail ? `${label}: ${detail}` : label;
  checkResults.push({ id, label, status: 'fail', detail: detail || undefined });
  console.error(`  ✗  ${msg}`);
}

function skip(id, label, detail = '') {
  checkResults.push({ id, label, status: 'skip', detail: detail || undefined });
  console.log(`  ·  ${label}${detail ? ' (' + detail + ')' : ''}`);
}

function section(title) {
  console.log('');
  console.log(`[rc] ── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ── Temp DB ───────────────────────────────────────────────────────────────────
const tmpDir = mkdtempSync(join(tmpdir(), 'shelby-rc-'));
const tmpDb = join(tmpDir, 'rc.sqlite');
const tmpDbWal = `${tmpDb}-wal`;
const tmpDbShm = `${tmpDb}-shm`;

function cleanupTempDb() {
  for (const f of [tmpDb, tmpDbWal, tmpDbShm]) {
    if (existsSync(f)) { try { rmSync(f); } catch { /* best-effort */ } }
  }
  try { rmSync(tmpDir, { recursive: true }); } catch { /* best-effort */ }
}

// ── Server cleanup ────────────────────────────────────────────────────────────
function shutdownServer() {
  if (serverProcess && !serverProcess.killed) {
    try {
      serverProcess.kill('SIGTERM');
    } catch { /* best-effort */ }
    serverProcess = null;
  }
}

// ── Cleanup on exit ───────────────────────────────────────────────────────────
function cleanup() {
  shutdownServer();
  cleanupTempDb();
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });

// ── Git SHA ───────────────────────────────────────────────────────────────────
function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

// ── Find available port ───────────────────────────────────────────────────────
function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr !== null ? addr.port : null;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error('Could not determine port'));
      });
    });
    server.on('error', reject);
  });
}

// ── Wait for server to be ready ───────────────────────────────────────────────
async function waitForServer(url, maxAttempts = 40, delayMs = 750) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

// ── Run a command synchronously ───────────────────────────────────────────────
/**
 * Build a merged env object, omitting keys whose value is null/undefined/empty-string
 * so that blank entries don't override parent env vars with an invalid value.
 * @param {Record<string, string>} overrides
 * @returns {Record<string, string>}
 */
function buildEnv(overrides) {
  const result = { ...process.env };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === '' || v === null || v === undefined) {
      delete result[k];
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * @param {string} id
 * @param {string} label
 * @param {string[]} args  Full args array (first element is the executable)
 * @param {{ cwd?: string, env?: Record<string,string>, expectedExit?: number }} opts
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function runCheck(id, label, args, opts = {}) {
  const { cwd = ROOT, env = {}, expectedExit = 0 } = opts;
  const [cmd, ...rest] = args;
  const result = spawnSync(cmd, rest, {
    cwd,
    env: buildEnv(env),
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const exitCode = result.status ?? 1;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = stdout + stderr;

  if (exitCode === expectedExit) {
    pass(id, label, `exit ${exitCode}`);
  } else {
    fail(id, label, `expected exit ${expectedExit}, got exit ${exitCode}` +
      (combined.trim() ? '\n    ' + combined.trim().split('\n').slice(0, 6).join('\n    ') : ''));
  }
  return { stdout, stderr, exitCode };
}

// ── Fetch a route and check for an expected string marker ────────────────────
/**
 * @param {string} route
 * @param {string} baseUrl
 * @param {string} marker  String to look for in the response body
 * @returns {Promise<void>}
 */
async function smokeRoute(route, baseUrl, marker) {
  const url = `${baseUrl}${route}`;
  let status = null;
  let ok = false;
  let found = false;
  let error;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    status = res.status;
    ok = res.status === 200;
    if (ok) {
      const body = await res.text();
      found = body.includes(marker);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  routeResults.push({ route, status, ok, marker, found, error });

  if (error) {
    fail(`route${route.replace(/\W+/g, '-')}`, `GET ${route}`, `fetch error: ${error}`);
  } else if (!ok) {
    fail(`route${route.replace(/\W+/g, '-')}`, `GET ${route}`, `HTTP ${status}`);
  } else if (!found) {
    fail(`route${route.replace(/\W+/g, '-')}`, `GET ${route}`, `HTTP 200 but marker "${marker}" not found`);
  } else {
    pass(`route${route.replace(/\W+/g, '-')}`, `GET ${route}`, `HTTP 200 + marker found`);
  }
}

function verifyHandoffSummaryContract() {
  const summary = buildTestnetHandoffSummary({
    mode: 'testnet',
    walletReady: true,
    accountAddress: '0xabc123',
    walletNetwork: 'testnet',
    origin: 'http://127.0.0.1:3000',
    session: {
      source: 'mixed',
      latestReceipt: {
        id: 'rr-testnet-fixture',
        runId: 'upload-pack-testnet-fixture',
        timestamp: '2026-05-09T00:00:00.000Z',
        receiptMode: 'shelby-testnet',
      },
      latestReceiptBlobs: [
        {
          id: 'blob-testnet-fixture',
          shelbyRef: 'shelby://testnet/0xabc123/evidence/fixture.txt',
          accountAddress: '0xabc123',
          blobName: 'evidence/fixture.txt',
          network: 'testnet',
          storageStatus: 'registered',
          explorerUrl: 'https://explorer.shelby.xyz/testnet/blob/evidence/fixture.txt',
          retrievalUrl: 'https://api.testnet.shelby.xyz/shelby/0xabc123/evidence/fixture.txt',
        },
      ],
      blobs: [],
    },
  });

  const failures = [];
  if (summary.milestone !== 'X15 public testnet handoff artifact') failures.push('milestone');
  if (summary.routes.testnetConsole !== 'http://127.0.0.1:3000/testnet') failures.push('testnet route');
  if (summary.routes.upload !== 'http://127.0.0.1:3000/upload') failures.push('upload route');
  if (summary.latestReceipt?.url !== 'http://127.0.0.1:3000/read-receipt/rr-testnet-fixture') failures.push('receipt url');
  if (summary.blobs[0]?.url !== 'http://127.0.0.1:3000/blob/blob-testnet-fixture') failures.push('blob url');
  if (summary.blobs[0]?.explorerUrl !== 'https://explorer.shelby.xyz/testnet/blob/evidence/fixture.txt') failures.push('explorer url');
  if (!summary.smokeCommands[0]?.command.includes('SHELBY_SMOKE_ACCOUNT_ADDRESS=0xabc123')) failures.push('smoke account');
  if (!summary.smokeCommands[0]?.command.includes('SHELBY_SMOKE_BLOB_NAME=evidence/fixture.txt')) failures.push('smoke blob');
  if (!summary.acceptanceStatus.runtimeModeReady) failures.push('runtimeModeReady');
  if (!summary.acceptanceStatus.walletReady) failures.push('walletReady');
  if (!summary.acceptanceStatus.testnetReceiptPresent) failures.push('testnetReceiptPresent');
  if (!summary.acceptanceStatus.testnetBlobPresent) failures.push('testnetBlobPresent');
  if (!summary.acceptanceStatus.smokeCommandReady) failures.push('smokeCommandReady');

  if (failures.length === 0) {
    pass('testnet-handoff-contract', 'testnet handoff summary contract');
  } else {
    fail('testnet-handoff-contract', 'testnet handoff summary contract', `failed fields: ${failures.join(', ')}`);
  }
}

// ── Write artifact ────────────────────────────────────────────────────────────
function writeArtifact(overallStatus) {
  try {
    mkdirSync(artifactDir, { recursive: true });
    const artifact = {
      timestamp: new Date().toISOString(),
      gitSha: getGitSha(),
      nodeVersion: process.version,
      checks: checkResults,
      localServerPort: serverPort,
      routes: routeResults,
      overallStatus,
    };
    writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');
    console.log(`\n[rc] Artifact written to: ${artifactPath}`);
  } catch (err) {
    console.error(`[rc] Warning: could not write artifact: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log('');
console.log('[rc] ══ C12 Release-Candidate Acceptance Harness ══════════════════════════');
console.log(`[rc] Temp DB : ${tmpDb}`);
console.log(`[rc] Node    : ${process.version}`);
const gitSha = getGitSha();
if (gitSha) console.log(`[rc] Git SHA : ${gitSha}`);
console.log('');

// ── Check 1: shelby-doctor — mock/local mode ──────────────────────────────────
section('1. shelby-doctor — mock/local mode (expect PASS)');

const doctorMock = runCheck(
  'doctor-mock',
  'shelby-doctor (mock mode, zero credentials)',
  [NPM, 'run', 'shelby-doctor'],
  // Use 'mock' explicitly so there is no ambiguity about which mode is active.
  // Empty string is not a valid SHELBY_MODE value — the doctor would reject it.
  { env: { SHELBY_MODE: 'mock', SHELBY_DB_PATH: tmpDb }, expectedExit: 0 }
);

// Also confirm "PASS" appears in the output
if (doctorMock.exitCode === 0 && !doctorMock.stdout.includes('PASS')) {
  fail('doctor-mock-output', 'shelby-doctor mock output contains PASS', 'PASS keyword not found in stdout');
} else if (doctorMock.exitCode === 0) {
  pass('doctor-mock-output', 'shelby-doctor mock output contains PASS');
}

// ── Check 2: shelby-doctor — testnet mode, no config ─────────────────────────
section('2. shelby-doctor — testnet mode, no config (expect exit 1)');

runCheck(
  'doctor-testnet-no-config',
  'shelby-doctor (testnet mode, no config — must fail closed)',
  [NPM, 'run', 'shelby-doctor'],
  {
    env: {
      SHELBY_MODE: 'testnet',
      // Explicitly unset any lingering testnet vars (defensive)
      SHELBY_NETWORK: '',
      SHELBY_RPC_URL: '',
      SHELBY_API_KEY: '',
      SHELBY_ACCOUNT_ADDRESS: '',
      SHELBY_BLOB_EXPIRATION_MICROS: '',
      APTOS_NETWORK: '',
      SHELBY_APTOS_FULLNODE_URL: '',
      SHELBY_INDEXER_URL: '',
      NEXT_PUBLIC_SHELBY_NETWORK: '',
      NEXT_PUBLIC_SHELBY_RPC_URL: '',
      NEXT_PUBLIC_SHELBY_INDEXER_URL: '',
      NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS: '',
    },
    expectedExit: 1,
  }
);

// ── Check 3: shelby-doctor — public-secret guard ──────────────────────────────
section('3. shelby-doctor — public-secret guard (expect exit 1)');

runCheck(
  'doctor-public-key-guard',
  'shelby-doctor (NEXT_PUBLIC_SHELBY_API_KEY set — must fail closed)',
  [NPM, 'run', 'shelby-doctor'],
  {
    env: {
      SHELBY_MODE: 'mock',
      NEXT_PUBLIC_SHELBY_API_KEY: 'fake_public_key',
    },
    expectedExit: 1,
  }
);

// ── Check 4: verify-community-demo ───────────────────────────────────────────
section('4. verify-community-demo (zero-credential DB harness)');

runCheck(
  'verify-community-demo',
  'npm run verify-community-demo',
  [NPM, 'run', 'verify-community-demo'],
  { env: {}, expectedExit: 0 }
);

// ── Check 5: generate-agent-run + C8 ID assertions ───────────────────────────
section('5. generate-agent-run → C8 IDs in isolated DB');

const generatorScript = join(ROOT, 'scripts', 'generate-agent-run.mjs');
let generatorFailed = false;
try {
  execFileSync(process.execPath, [generatorScript], {
    cwd: ROOT,
    env: { ...process.env, SHELBY_DB_PATH: tmpDb },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
  });
  pass('generate-agent-run', 'generate-agent-run script exits 0', `SHELBY_DB_PATH=${tmpDb}`);
} catch (/** @type {unknown} */ err) {
  const msg = err instanceof Error ? err.message : String(err);
  const stderr = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr) : '';
  fail('generate-agent-run', 'generate-agent-run script exits 0', msg + (stderr ? ' | ' + stderr : ''));
  generatorFailed = true;
}

if (!generatorFailed) {
  // Verify C8 IDs exist in the temp DB
  try {
    const db = new Database(tmpDb, { readonly: true });
    const packs = db.prepare('SELECT id FROM evidence_packs').all();
    const blobs = db.prepare('SELECT id FROM blob_records').all();
    const receipts = db.prepare('SELECT id FROM read_receipts').all();
    db.close();

    const packIds = packs.map((r) => r.id);
    const blobIds = blobs.map((r) => r.id);
    const receiptIds = receipts.map((r) => r.id);

    if (packIds.includes(C8_PACK_ID)) {
      pass('c8-pack-id', `C8 pack id "${C8_PACK_ID}" persisted`);
    } else {
      fail('c8-pack-id', `C8 pack id "${C8_PACK_ID}" persisted`, `found: ${JSON.stringify(packIds)}`);
    }
    if (blobIds.includes(C8_BLOB_INPUT_ID)) {
      pass('c8-blob-input-id', `C8 blob id "${C8_BLOB_INPUT_ID}" persisted`);
    } else {
      fail('c8-blob-input-id', `C8 blob id "${C8_BLOB_INPUT_ID}" persisted`, `found: ${JSON.stringify(blobIds)}`);
    }
    if (blobIds.includes(C8_BLOB_OUTPUT_ID)) {
      pass('c8-blob-output-id', `C8 blob id "${C8_BLOB_OUTPUT_ID}" persisted`);
    } else {
      fail('c8-blob-output-id', `C8 blob id "${C8_BLOB_OUTPUT_ID}" persisted`, `found: ${JSON.stringify(blobIds)}`);
    }
    if (receiptIds.includes(C8_RECEIPT_ID)) {
      pass('c8-receipt-id', `C8 receipt id "${C8_RECEIPT_ID}" persisted`);
    } else {
      fail('c8-receipt-id', `C8 receipt id "${C8_RECEIPT_ID}" persisted`, `found: ${JSON.stringify(receiptIds)}`);
    }

    // Idempotency: run again and confirm no duplicates
    execFileSync(process.execPath, [generatorScript], {
      cwd: ROOT,
      env: { ...process.env, SHELBY_DB_PATH: tmpDb },
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
    const db2 = new Database(tmpDb, { readonly: true });
    const packs2 = db2.prepare('SELECT id FROM evidence_packs').all();
    const blobs2 = db2.prepare('SELECT id FROM blob_records').all();
    const receipts2 = db2.prepare('SELECT id FROM read_receipts').all();
    db2.close();

    if (packs2.length === packs.length && blobs2.length === blobs.length && receipts2.length === receipts.length) {
      pass('c8-idempotency', 'generate-agent-run is idempotent (no duplicate rows)');
    } else {
      fail('c8-idempotency', 'generate-agent-run is idempotent (no duplicate rows)',
        `packs ${packs.length}→${packs2.length}, blobs ${blobs.length}→${blobs2.length}, receipts ${receipts.length}→${receipts2.length}`);
    }
  } catch (/** @type {unknown} */ err) {
    fail('c8-db-assertions', 'C8 DB assertions', err instanceof Error ? err.message : String(err));
  }
} else {
  skip('c8-pack-id', `C8 pack id check (skipped — generator failed)`);
  skip('c8-blob-input-id', `C8 blob input id check (skipped — generator failed)`);
  skip('c8-blob-output-id', `C8 blob output id check (skipped — generator failed)`);
  skip('c8-receipt-id', `C8 receipt id check (skipped — generator failed)`);
  skip('c8-idempotency', `C8 idempotency check (skipped — generator failed)`);
}

// ── Check 6: Testnet handoff summary contract ────────────────────────────────
section('6. testnet handoff summary contract');

verifyHandoffSummaryContract();

// ── Check 7: npm run build ────────────────────────────────────────────────────
section('7. npm run build');

const buildResult = runCheck(
  'build',
  'npm run build',
  [NPM, 'run', 'build'],
  { env: {}, expectedExit: 0 }
);
const buildSucceeded = buildResult.exitCode === 0;

// ── Check 8: Start server + route smoke ───────────────────────────────────────
section('8. Start built app + route smoke checks');

if (!buildSucceeded) {
  skip('server-start', 'Server start (skipped — build failed)');
  skip('route-smoke', 'Route smoke checks (skipped — build failed)');
} else {
  // Find an available port
  let port;
  try {
    port = await findAvailablePort();
    serverPort = port;
    console.log(`  → Using port ${port}`);
  } catch (err) {
    fail('server-port', 'Find available port', err instanceof Error ? err.message : String(err));
    port = null;
  }

  if (port !== null) {
    const baseUrl = `http://127.0.0.1:${port}`;

    // Spawn next start with isolated DB and mock mode
    serverProcess = spawn(NPM, ['run', 'start', '--', '--port', String(port)], {
      cwd: ROOT,
      env: {
        ...process.env,
        SHELBY_DB_PATH: tmpDb,
        SHELBY_MODE: 'mock',
        PORT: String(port),
        HOSTNAME: '127.0.0.1',
      },
      stdio: 'pipe',
    });

    serverProcess.on('error', (err) => {
      console.error(`[rc] Server process error: ${err.message}`);
    });

    // Wait for server to be ready
    console.log(`  → Waiting for server at ${baseUrl}/…`);
    const ready = await waitForServer(`${baseUrl}/`);

    if (!ready) {
      fail('server-start', `Server started and ready at :${port}`, 'timed out waiting for HTTP response');
      shutdownServer();
    } else {
      pass('server-start', `Server started and ready at :${port}`);

      // Route smoke checks
      section('8a. Route smoke checks');

      await smokeRoute('/', baseUrl, 'Evidence Vault');
      await smokeRoute('/dashboard', baseUrl, 'Evidence index');
      await smokeRoute('/testnet', baseUrl, '公开测试网参与控制台');
      await smokeRoute('/upload', baseUrl, 'Package files into a verifiable');
      await smokeRoute('/blob/blob-001', baseUrl, 'Shelby AI Evidence Vault');
      await smokeRoute('/read-receipt/rr-001', baseUrl, 'Shelby AI Evidence Vault');

      if (!generatorFailed) {
        await smokeRoute(`/read-receipt/${C8_RECEIPT_ID}`, baseUrl, 'Shelby AI Evidence Vault');
      } else {
        skip(`route-/read-receipt/${C8_RECEIPT_ID}`, `/read-receipt/${C8_RECEIPT_ID} (skipped — generator failed)`);
      }

      // Shut down server cleanly
      shutdownServer();
      pass('server-shutdown', 'Server shut down cleanly');
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
section('Summary');

console.log(`  Passed  : ${passCount}`);
console.log(`  Failed  : ${failCount}`);
console.log(`  Skipped : ${checkResults.filter((c) => c.status === 'skip').length}`);
console.log('');

const overallStatus = failCount === 0 ? 'pass' : 'fail';
writeArtifact(overallStatus);

if (failCount > 0) {
  console.error(`\n[rc] FAILED — ${failCount} check(s) did not pass. See details above.`);
  console.error('[rc] ═══════════════════════════════════════════════════════════════════════');
  process.exitCode = 1;
  process.exit(1);
} else {
  console.log('\n[rc] All release-candidate checks passed.');
  console.log('');
  console.log('  Verified:');
  console.log('    shelby-doctor  : mock PASS, testnet fail-closed, public-key guard');
  console.log('    community-demo : zero-credential DB harness');
  console.log('    generate-agent-run: C8 IDs persisted, idempotent');
  console.log('    testnet handoff: copied JSON contract verified');
  console.log('    npm run build  : production build succeeded');
  console.log('    route smoke    : /, /dashboard, /testnet, /upload, /blob, /read-receipt');
  console.log('');
  console.log('[rc] ═══════════════════════════════════════════════════════════════════════');
}
