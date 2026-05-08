#!/usr/bin/env node
/**
 * C8: Deterministic agent-run evidence-pack generator.
 *
 * USAGE:
 *   node scripts/generate-agent-run.mjs
 *
 * Or via npm:
 *   npm run generate-agent-run
 *
 * WHAT THIS SCRIPT DOES:
 *   Demonstrates the core product story end-to-end with zero credentials:
 *
 *     source evidence  →  agent run output  →  EvidencePack  →  BlobRecord(s)  →  ReadReceipt
 *
 *   1. Reads fixtures/c8-agent-input.json as the source evidence input.
 *   2. Computes a SHA-256 hash of the input content.
 *   3. Runs a deterministic analysis (no LLM — pure computation) to produce
 *      an agent output artifact: top-performer rankings + per-model stats.
 *   4. Computes a SHA-256 hash of the output artifact.
 *   5. Builds:
 *        - One EvidencePack  (category: agent-run, sourceType: agent-output)
 *        - Two BlobRecords   (one for the input fixture, one for the output artifact)
 *        - One ReadReceipt   (binds the run to both blobs and the pack)
 *   6. Persists all three record types to the local SQLite database via
 *      better-sqlite3 using INSERT OR REPLACE — safe to run multiple times.
 *   7. Prints generated IDs and URL paths for manual verification.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Call any real LLM or external API.
 *   - Use, request, or store any private key, seed phrase, or signing material.
 *   - Modify browser localStorage.
 *   - Upload anything to Shelby testnet.
 *
 * OUTPUT:
 *   Persisted records in data/shelby-vault.sqlite (created if absent).
 *   Human-readable summary printed to stdout.
 *
 * GENERATED IDs (stable across runs — INSERT OR REPLACE):
 *   Pack    : c8-pack-agent-sentinel-v1
 *   Blobs   : c8-blob-input-v1, c8-blob-output-v1
 *   Receipt : c8-rr-agent-sentinel-v1
 *
 *   Verify at (dev server must be running):
 *     http://localhost:3000/read-receipt/c8-rr-agent-sentinel-v1
 *     http://localhost:3000/blob/c8-blob-input-v1
 *     http://localhost:3000/blob/c8-blob-output-v1
 */

import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ── Load better-sqlite3 via require (CJS module) ─────────────────────────────
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

// ── Constants — stable IDs so INSERT OR REPLACE is idempotent ────────────────
const PACK_ID = 'c8-pack-agent-sentinel-v1';
const BLOB_INPUT_ID = 'c8-blob-input-v1';
const BLOB_OUTPUT_ID = 'c8-blob-output-v1';
const RECEIPT_ID = 'c8-rr-agent-sentinel-v1';
const AGENT_VERSION = 'shelby-vault/c8-sentinel/1.0 (deterministic, no-llm)';
const RUN_ID = 'run-c8-agent-sentinel-v1';

// ── SHA-256 helper ────────────────────────────────────────────────────────────
function sha256Hex(content) {
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

// ── Shelby mock-ref helper (mirrors mock-adapter.ts behaviour) ────────────────
function mockShelbyRef(hash) {
  const hex = hash.replace(/^sha256:/, '');
  return `shelby://mock/blob/${hex.slice(0, 32)}`;
}

// ── Read input fixture ────────────────────────────────────────────────────────
const fixtureRelPath = 'fixtures/c8-agent-input.json';
const fixturePath = join(ROOT, fixtureRelPath);

if (!existsSync(fixturePath)) {
  console.error(`[generate-agent-run] ERROR: Fixture not found: ${fixturePath}`);
  process.exit(1);
}

const inputRaw = readFileSync(fixturePath, 'utf-8');
/** @type {{ dataset: string; version: string; description: string; records: Array<{ model: string; task: string; accuracy: number; latency_ms: number; benchmark: string }> }} */
const inputData = JSON.parse(inputRaw);

const inputHash = sha256Hex(inputRaw);

// ── Deterministic analysis (no LLM) ──────────────────────────────────────────
// Group records by task and find the top performer for each task.
/** @type {Map<string, Array<{ model: string; accuracy: number; latency_ms: number; benchmark: string }>>} */
const byTask = new Map();
for (const r of inputData.records) {
  if (!byTask.has(r.task)) byTask.set(r.task, []);
  byTask.get(r.task).push(r);
}

/** @type {Array<{ task: string; topModel: string; topAccuracy: number; topLatencyMs: number; benchmark: string }>} */
const topPerformers = [];
for (const [task, records] of byTask) {
  const top = records.reduce((a, b) => (a.accuracy >= b.accuracy ? a : b));
  topPerformers.push({
    task,
    topModel: top.model,
    topAccuracy: top.accuracy,
    topLatencyMs: top.latency_ms,
    benchmark: top.benchmark,
  });
}

// Compute per-model average accuracy across all tasks.
/** @type {Map<string, number[]>} */
const byModel = new Map();
for (const r of inputData.records) {
  if (!byModel.has(r.model)) byModel.set(r.model, []);
  byModel.get(r.model).push(r.accuracy);
}
/** @type {Array<{ model: string; avgAccuracy: number; taskCount: number }>} */
const modelStats = [...byModel.entries()]
  .map(([model, accs]) => ({
    model,
    avgAccuracy: Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 1000) / 1000,
    taskCount: accs.length,
  }))
  .sort((a, b) => b.avgAccuracy - a.avgAccuracy);

const analysisTimestamp = '2026-05-08T16:00:00.000Z'; // Fixed for determinism
const outputArtifact = {
  agentId: 'shelby-vault/c8-sentinel/1.0',
  runId: RUN_ID,
  analysisTimestamp,
  inputDataset: inputData.dataset,
  inputVersion: inputData.version,
  recordCount: inputData.records.length,
  taskCount: byTask.size,
  topPerformers,
  modelStats,
  conclusion: `Analysed ${inputData.records.length} benchmark records across ${byTask.size} tasks. ` +
    `Overall top model: ${modelStats[0].model} (avg accuracy ${modelStats[0].avgAccuracy}). ` +
    `Top performers by task: ${topPerformers.map(t => `${t.task}=${t.topModel}(${t.topAccuracy})`).join(', ')}.`,
};

const outputRaw = JSON.stringify(outputArtifact, null, 2);
const outputHash = sha256Hex(outputRaw);

// ── Build answer summary for the read receipt ─────────────────────────────────
const answerLines = [
  `Processed ${outputArtifact.recordCount} benchmark records across ${outputArtifact.taskCount} task categories.`,
  `Overall top model by average accuracy: ${modelStats[0].model} (avg ${modelStats[0].avgAccuracy}).`,
  ...topPerformers.map(
    (t) =>
      `Task "${t.task}": top model=${t.topModel}, accuracy=${t.topAccuracy}, latency=${t.topLatencyMs}ms (${t.benchmark}).`
  ),
];
const answerSummary = answerLines.join(' ');

// ── Compose record objects ────────────────────────────────────────────────────
const now = analysisTimestamp;

/** @type {import('../src/lib/demo-data/evidence-packs').EvidencePack} */
const pack = {
  id: PACK_ID,
  title: 'C8 Agent Run — AI Benchmark Sentinel v1',
  category: 'agent-run',
  sourceType: 'agent-output',
  tags: ['agent-run', 'benchmark', 'c8', 'deterministic', 'no-llm'],
  createdAt: now,
  blobCount: 2,
  status: 'active',
  description:
    'Deterministic C8 agent-run example. Analyses a synthetic AI model benchmark fixture and ' +
    'produces top-performer rankings and per-model stats. No LLM calls — reproducible with zero credentials.',
  dataSource: 'local',
};

/** @type {import('../src/lib/demo-data/blobs').BlobRecord} */
const blobInput = {
  id: BLOB_INPUT_ID,
  shelbyRef: mockShelbyRef(inputHash),
  mockRef: mockShelbyRef(inputHash),
  hash: inputHash,
  source: `fixture://${fixtureRelPath}`,
  tags: ['benchmark', 'input', 'fixture', 'c8'],
  evidencePackId: PACK_ID,
  createdAt: now,
  size: Buffer.byteLength(inputRaw, 'utf-8'),
  mimeType: 'application/json',
  dataSource: 'local',
  uploadMode: 'mock',
  blobName: 'c8-agent-input.json',
  network: 'mock',
};

/** @type {import('../src/lib/demo-data/blobs').BlobRecord} */
const blobOutput = {
  id: BLOB_OUTPUT_ID,
  shelbyRef: mockShelbyRef(outputHash),
  mockRef: mockShelbyRef(outputHash),
  hash: outputHash,
  source: `agent://shelby-vault/c8/sentinel-v1/output.json`,
  tags: ['benchmark', 'output', 'analysis', 'c8'],
  evidencePackId: PACK_ID,
  createdAt: now,
  size: Buffer.byteLength(outputRaw, 'utf-8'),
  mimeType: 'application/json',
  dataSource: 'local',
  uploadMode: 'mock',
  blobName: 'c8-agent-output.json',
  network: 'mock',
};

/** @type {import('../src/lib/demo-data/read-receipts').ReadReceipt} */
const receipt = {
  id: RECEIPT_ID,
  runId: RUN_ID,
  query:
    'Analyse the AI model benchmark dataset and identify top-performing models per task category, ' +
    'reporting average accuracy and latency rankings.',
  answerSummary,
  referencedBlobIds: [BLOB_INPUT_ID, BLOB_OUTPUT_ID],
  evidencePackIds: [PACK_ID],
  timestamp: now,
  agentVersion: AGENT_VERSION,
  receiptMode: 'local',
};

// ── Open / initialise SQLite ──────────────────────────────────────────────────
const dbPath =
  process.env.SHELBY_DB_PATH ??
  join(ROOT, 'data', 'shelby-vault.sqlite');

const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_packs (
    id          TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL,
    payload     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blob_records (
    id               TEXT PRIMARY KEY,
    evidence_pack_id TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    payload          TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_blob_pack
    ON blob_records (evidence_pack_id);

  CREATE TABLE IF NOT EXISTS read_receipts (
    id         TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    payload    TEXT NOT NULL
  );
`);

// ── Persist atomically ────────────────────────────────────────────────────────
const insertAll = db.transaction(() => {
  db.prepare(
    `INSERT OR REPLACE INTO evidence_packs (id, created_at, payload) VALUES (?, ?, ?)`
  ).run(pack.id, pack.createdAt, JSON.stringify(pack));

  for (const blob of [blobInput, blobOutput]) {
    db.prepare(
      `INSERT OR REPLACE INTO blob_records (id, evidence_pack_id, created_at, payload) VALUES (?, ?, ?, ?)`
    ).run(blob.id, blob.evidencePackId, blob.createdAt, JSON.stringify(blob));
  }

  db.prepare(
    `INSERT OR REPLACE INTO read_receipts (id, created_at, payload) VALUES (?, ?, ?)`
  ).run(receipt.id, receipt.timestamp, JSON.stringify(receipt));
});

try {
  insertAll();
} catch (/** @type {unknown} */ err) {
  console.error('[generate-agent-run] ERROR: SQLite write failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

db.close();

// ── Print summary ─────────────────────────────────────────────────────────────
console.log('\n[generate-agent-run] ── C8 agent-run generated ─────────────────────────');
console.log(`  Pack ID      : ${pack.id}`);
console.log(`  Blob (input) : ${blobInput.id}`);
console.log(`    shelbyRef  : ${blobInput.shelbyRef}`);
console.log(`    hash       : ${blobInput.hash}`);
console.log(`  Blob (output): ${blobOutput.id}`);
console.log(`    shelbyRef  : ${blobOutput.shelbyRef}`);
console.log(`    hash       : ${blobOutput.hash}`);
console.log(`  Receipt ID   : ${receipt.id}`);
console.log(`  DB path      : ${dbPath}`);
console.log('');
console.log('  Inspect (start dev server with `npm run dev` first):');
console.log(`    Read receipt : http://localhost:3000/read-receipt/${receipt.id}`);
console.log(`    Blob input   : http://localhost:3000/blob/${blobInput.id}`);
console.log(`    Blob output  : http://localhost:3000/blob/${blobOutput.id}`);
console.log('[generate-agent-run] ─────────────────────────────────────────────────────\n');
