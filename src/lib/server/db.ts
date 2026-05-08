/**
 * Server-only SQLite connection and schema initialisation.
 *
 * Database path resolution (in priority order):
 *  1. SHELBY_DB_PATH environment variable
 *  2. data/shelby-vault.sqlite (relative to the project root)
 *
 * The `data/` directory is gitignored so the database file is never committed.
 *
 * This module must only be imported from server-side code (Server Components,
 * Server Actions, Route Handlers). It will throw at runtime if imported on the
 * client because `better-sqlite3` is a native Node.js module.
 *
 * Schema design:
 *  - Each table stores a `payload` JSON column containing the full typed object
 *    so future model-field additions do not require immediate schema migrations.
 *  - Key columns (id, evidencePackId, etc.) are indexed for efficient lookups.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH =
  process.env.SHELBY_DB_PATH ??
  path.join(process.cwd(), 'data', 'shelby-vault.sqlite');

// Ensure the data directory exists before opening the database.
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Module-level singleton — reused across the Next.js hot-reload lifecycle in
// development.  In production the process is single-threaded per worker.
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  // WAL mode gives better read/write concurrency for a local dev server.
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
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
}
