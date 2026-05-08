#!/usr/bin/env node
/**
 * C9: Community-experiment zero-credential verification harness.
 *
 * USAGE:
 *   node scripts/verify-community-demo.mjs
 *
 * Or via npm:
 *   npm run verify-community-demo
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Creates an isolated temporary SQLite database (in the OS tmp dir).
 *   2. Runs the C8 generation path (generate-agent-run.mjs) once — first pass.
 *   3. Inspects the resulting database and asserts:
 *        - All expected IDs are present (pack, blobs, receipt).
 *        - Blob records reference the correct evidence pack.
 *        - The read receipt references both blobs and the evidence pack.
 *        - All payload fields have the expected values.
 *   4. Runs the C8 generation path a second time — idempotency pass.
 *   5. Re-inspects the database and asserts that:
 *        - Row counts are identical (no duplicate rows via INSERT OR REPLACE).
 *        - All records are bit-for-bit identical to the first pass.
 *   6. Removes the temporary database before exiting.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Start a live HTTP server (too heavy for CI; DB-level verification is
 *     sufficient and deterministic). The route-smoke check is documented in
 *     docs/community-experiment-runbook.md.
 *   - Call any real LLM or external API.
 *   - Use, request, or store any private key or signing material.
 *   - Upload anything to Shelby testnet.
 *
 * EXPECTED IDs (stable across runs — defined in generate-agent-run.mjs):
 *   Pack    : c8-pack-agent-sentinel-v1
 *   Blobs   : c8-blob-input-v1, c8-blob-output-v1
 *   Receipt : c8-rr-agent-sentinel-v1
 *
 * EXIT CODES:
 *   0  — all assertions passed
 *   1  — assertion failure or unexpected error
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// ── Expected constants (must match generate-agent-run.mjs) ───────────────────
const PACK_ID = 'c8-pack-agent-sentinel-v1';
const BLOB_INPUT_ID = 'c8-blob-input-v1';
const BLOB_OUTPUT_ID = 'c8-blob-output-v1';
const RECEIPT_ID = 'c8-rr-agent-sentinel-v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

let failCount = 0;
let passCount = 0;

function pass(label) {
  passCount++;
  console.log(`  ✓  ${label}`);
}

function fail(label, detail = '') {
  failCount++;
  const msg = detail ? `${label}: ${detail}` : label;
  console.error(`  ✗  ${msg}`);
}

function assert(condition, label, detail = '') {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

function assertEq(actual, expected, label) {
  if (actual === expected) {
    pass(label);
  } else {
    fail(label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(arr, value, label) {
  if (Array.isArray(arr) && arr.includes(value)) {
    pass(label);
  } else {
    fail(label, `${JSON.stringify(value)} not found in ${JSON.stringify(arr)}`);
  }
}

// ── Temp DB path ──────────────────────────────────────────────────────────────
// Use mkdtempSync for a cryptographically collision-safe temp directory.
const tmpDir = mkdtempSync(join(tmpdir(), 'shelby-verify-'));
const tmpDb = join(tmpDir, 'verify.sqlite');
const tmpDbWal = `${tmpDb}-wal`;
const tmpDbShm = `${tmpDb}-shm`;

function cleanupTempDb() {
  for (const f of [tmpDb, tmpDbWal, tmpDbShm]) {
    if (existsSync(f)) rmSync(f);
  }
  // Remove the temp directory (best-effort; ignore if not empty)
  try { rmSync(tmpDir, { recursive: true }); } catch { /* best-effort */ }
}

// ── Run generate-agent-run.mjs with temp DB ───────────────────────────────────
function runGenerator(label) {
  console.log(`\n[verify] Running generator (${label})…`);
  const generatorScript = join(ROOT, 'scripts', 'generate-agent-run.mjs');
  try {
    execFileSync(process.execPath, [generatorScript], {
      env: { ...process.env, SHELBY_DB_PATH: tmpDb },
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
  } catch (/** @type {unknown} */ err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Include stderr if available
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr) : '';
    console.error(`[verify] ERROR: Generator script failed (${label}):`);
    if (stderr) console.error(stderr);
    console.error(msg);
    process.exitCode = 1;
    process.exit(1);
  }
}

// ── Inspect DB and return raw snapshot ───────────────────────────────────────
function snapshotDb() {
  const db = new Database(tmpDb, { readonly: true });
  /** @type {Record<string, {id: string, payload: string}[]>} */
  const snap = {};
  snap.packs = db.prepare('SELECT id, payload FROM evidence_packs').all();
  snap.blobs = db.prepare('SELECT id, payload FROM blob_records').all();
  snap.receipts = db.prepare('SELECT id, payload FROM read_receipts').all();
  db.close();
  return snap;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('');
console.log('[verify] ── C9 Community-demo verification harness ─────────────────────');
console.log(`[verify] Temp DB : ${tmpDb}`);

// Safety: clean up temp files at exit (even on SIGINT)
process.on('exit', cleanupTempDb);
process.on('SIGINT', () => { cleanupTempDb(); process.exit(130); });
process.on('SIGTERM', () => { cleanupTempDb(); process.exit(143); });

// ── Pass 1: first generation ─────────────────────────────────────────────────
runGenerator('pass 1');

console.log('\n[verify] ── Assertions after pass 1 ──────────────────────────────────');
const snap1 = snapshotDb();

// Row-count assertions
assertEq(snap1.packs.length, 1, 'exactly 1 evidence pack');
assertEq(snap1.blobs.length, 2, 'exactly 2 blob records');
assertEq(snap1.receipts.length, 1, 'exactly 1 read receipt');

// ID presence
assert(
  snap1.packs.some((r) => r.id === PACK_ID),
  `pack with id="${PACK_ID}" exists`
);
assert(
  snap1.blobs.some((r) => r.id === BLOB_INPUT_ID),
  `blob with id="${BLOB_INPUT_ID}" exists`
);
assert(
  snap1.blobs.some((r) => r.id === BLOB_OUTPUT_ID),
  `blob with id="${BLOB_OUTPUT_ID}" exists`
);
assert(
  snap1.receipts.some((r) => r.id === RECEIPT_ID),
  `receipt with id="${RECEIPT_ID}" exists`
);

// ── Payload correctness ───────────────────────────────────────────────────────
const packRow = snap1.packs.find((r) => r.id === PACK_ID);
const blobInputRow = snap1.blobs.find((r) => r.id === BLOB_INPUT_ID);
const blobOutputRow = snap1.blobs.find((r) => r.id === BLOB_OUTPUT_ID);
const receiptRow = snap1.receipts.find((r) => r.id === RECEIPT_ID);

if (!packRow || !blobInputRow || !blobOutputRow || !receiptRow) {
  fail('required rows exist for payload checks', 'one or more expected rows were not found — skipping payload assertions');
  console.error('\n[verify] FAILED — cannot continue without required rows.');
  process.exit(1);
}

const pack = JSON.parse(packRow.payload);
const blobInput = JSON.parse(blobInputRow.payload);
const blobOutput = JSON.parse(blobOutputRow.payload);
const receipt = JSON.parse(receiptRow.payload);

// Evidence pack fields
assertEq(pack.id, PACK_ID, 'pack.id matches constant');
assertEq(pack.category, 'agent-run', 'pack.category is agent-run');
assertEq(pack.blobCount, 2, 'pack.blobCount is 2');
assertEq(pack.dataSource, 'local', 'pack.dataSource is local');
assert(
  typeof pack.title === 'string' && pack.title.length > 0,
  'pack.title is non-empty string'
);

// Blob fields — both reference the pack
assertEq(blobInput.evidencePackId, PACK_ID, 'blobInput.evidencePackId references pack');
assertEq(blobOutput.evidencePackId, PACK_ID, 'blobOutput.evidencePackId references pack');
assertEq(blobInput.uploadMode, 'mock', 'blobInput.uploadMode is mock');
assertEq(blobOutput.uploadMode, 'mock', 'blobOutput.uploadMode is mock');
assertEq(blobInput.network, 'mock', 'blobInput.network is mock');
assertEq(blobOutput.network, 'mock', 'blobOutput.network is mock');

// Shelby refs use mock scheme
assert(
  typeof blobInput.shelbyRef === 'string' && blobInput.shelbyRef.startsWith('shelby://mock/blob/'),
  `blobInput.shelbyRef uses shelby://mock/blob/ scheme (got "${blobInput.shelbyRef}")`
);
assert(
  typeof blobOutput.shelbyRef === 'string' && blobOutput.shelbyRef.startsWith('shelby://mock/blob/'),
  `blobOutput.shelbyRef uses shelby://mock/blob/ scheme (got "${blobOutput.shelbyRef}")`
);

// Hashes are present and use sha256: prefix
assert(
  typeof blobInput.hash === 'string' && blobInput.hash.startsWith('sha256:'),
  `blobInput.hash has sha256: prefix (got "${blobInput.hash}")`
);
assert(
  typeof blobOutput.hash === 'string' && blobOutput.hash.startsWith('sha256:'),
  `blobOutput.hash has sha256: prefix (got "${blobOutput.hash}")`
);

// Receipt–blob relationship
assert(
  Array.isArray(receipt.referencedBlobIds),
  'receipt.referencedBlobIds is an array'
);
assertIncludes(receipt.referencedBlobIds, BLOB_INPUT_ID, `receipt references ${BLOB_INPUT_ID}`);
assertIncludes(receipt.referencedBlobIds, BLOB_OUTPUT_ID, `receipt references ${BLOB_OUTPUT_ID}`);

// Receipt–pack relationship
assert(
  Array.isArray(receipt.evidencePackIds),
  'receipt.evidencePackIds is an array'
);
assertIncludes(receipt.evidencePackIds, PACK_ID, `receipt references ${PACK_ID}`);

// Receipt mode
assertEq(receipt.receiptMode, 'local', 'receipt.receiptMode is local');

// ── Pass 2: idempotency run ───────────────────────────────────────────────────
runGenerator('pass 2 — idempotency check');

console.log('\n[verify] ── Idempotency assertions after pass 2 ───────────────────────');
const snap2 = snapshotDb();

// Row counts must be identical
assertEq(snap2.packs.length, snap1.packs.length, 'pack row count unchanged after second run');
assertEq(snap2.blobs.length, snap1.blobs.length, 'blob row count unchanged after second run');
assertEq(snap2.receipts.length, snap1.receipts.length, 'receipt row count unchanged after second run');

// Payloads must be identical (INSERT OR REPLACE must not change content)
const packRow2 = snap2.packs.find((r) => r.id === PACK_ID);
const blobInputRow2 = snap2.blobs.find((r) => r.id === BLOB_INPUT_ID);
const blobOutputRow2 = snap2.blobs.find((r) => r.id === BLOB_OUTPUT_ID);
const receiptRow2 = snap2.receipts.find((r) => r.id === RECEIPT_ID);

if (!packRow2 || !blobInputRow2 || !blobOutputRow2 || !receiptRow2) {
  fail('required rows exist for idempotency payload checks', 'one or more expected rows were not found after second run');
  console.error('\n[verify] FAILED — cannot continue without required rows.');
  process.exit(1);
}

const pack2 = JSON.parse(packRow2.payload);
const blobInput2 = JSON.parse(blobInputRow2.payload);
const blobOutput2 = JSON.parse(blobOutputRow2.payload);
const receipt2 = JSON.parse(receiptRow2.payload);

assertEq(JSON.stringify(pack2), JSON.stringify(pack), 'pack payload is identical after second run');
assertEq(JSON.stringify(blobInput2), JSON.stringify(blobInput), 'blobInput payload is identical after second run');
assertEq(JSON.stringify(blobOutput2), JSON.stringify(blobOutput), 'blobOutput payload is identical after second run');
assertEq(JSON.stringify(receipt2), JSON.stringify(receipt), 'receipt payload is identical after second run');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('[verify] ── Summary ──────────────────────────────────────────────────────');
console.log(`  Passed : ${passCount}`);
console.log(`  Failed : ${failCount}`);

if (failCount > 0) {
  console.error(`\n[verify] FAILED — ${failCount} assertion(s) failed. See details above.`);
  process.exit(1);
} else {
  console.log('\n[verify] All assertions passed. Community demo verification complete.');
  console.log('');
  console.log('  Expected IDs confirmed:');
  console.log(`    Pack    : ${PACK_ID}`);
  console.log(`    Blobs   : ${BLOB_INPUT_ID}, ${BLOB_OUTPUT_ID}`);
  console.log(`    Receipt : ${RECEIPT_ID}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    npm run dev   → start dev server');
  console.log('    npm run generate-agent-run   → populate default DB');
  console.log(`    http://localhost:3000/read-receipt/${RECEIPT_ID}`);
  console.log('[verify] ────────────────────────────────────────────────────────────────');
}
