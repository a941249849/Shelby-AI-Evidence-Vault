# Release-Candidate Checklist — Shelby AI Evidence Vault

**Stage: C12/X3 — Release-candidate gate plus product closeout QA**

This document describes the release-candidate validation gate for the Shelby AI Evidence Vault community experiment. The gate is zero-credential, mock-safe by default, and is designed to verify the complete product loop in a single deterministic command.

The X3 product closeout keeps this command as the hard automated gate, then adds a manual UI/product pass for the Chinese-first bilingual Shelby ecosystem surface.

> **This is a community experiment and demo.** Nothing here implies mainnet or production Shelby storage readiness. Mock/local references (e.g. `shelby://mock/blob/…`) are deterministic local identifiers that demonstrate the data model and UI.

---

## The one-command gate

```bash
npm run verify-release-candidate
```

This command runs the complete acceptance harness from a clean checkout with zero Shelby credentials. It is safe to run on any machine and does not modify the operator's normal local database.

---

## What the verifier checks

The verifier (`scripts/verify-release-candidate.mjs`) runs the following checks in order:

### 1. Shelby doctor — mock/local mode

```bash
npm run shelby-doctor
```

- **Expect:** exit 0, output contains `PASS`
- **Why:** Confirms that the app's zero-credential local path is ready with no config.

### 2. Shelby doctor — testnet mode, no config

```bash
SHELBY_MODE=testnet npm run shelby-doctor
```

- **Expect:** exit 1 (fail-closed)
- **Why:** Confirms that the testnet path fails closed when required configuration is missing. This is a security invariant — it must never silently succeed without credentials.

### 3. Shelby doctor — public-secret guard

```bash
NEXT_PUBLIC_SHELBY_API_KEY=fake_public_key npm run shelby-doctor
```

- **Expect:** exit 1 (fail-closed)
- **Why:** Confirms that an API key set as a `NEXT_PUBLIC_` variable is rejected. Browser-public API keys would be embedded in the JS bundle. This guard must always trigger.

### 4. Community demo harness

```bash
npm run verify-community-demo
```

- **Expect:** exit 0, all 35 DB-level assertions pass
- **Why:** Confirms the complete C8 product chain works with zero credentials: source evidence → agent run → EvidencePack → BlobRecord → ReadReceipt.

### 5. Agent-run generator + C8 ID assertions

```bash
SHELBY_DB_PATH=<isolated-temp-db> npm run generate-agent-run
```

- **Expect:** C8 pack, blob, and receipt IDs persist correctly; idempotent on second run
- **IDs checked:**
  - Pack: `c8-pack-agent-sentinel-v1`
  - Blobs: `c8-blob-input-v1`, `c8-blob-output-v1`
  - Receipt: `c8-rr-agent-sentinel-v1`
- **Why:** Confirms the generation script works and that INSERT OR REPLACE is truly idempotent.

### 6. Production build

```bash
npm run build
```

- **Expect:** exit 0
- **Why:** Confirms the full Next.js production build succeeds. This is the artefact that is served in the route smoke checks.

### 7. Route smoke checks

The verifier starts the built Next.js app (`next start`) on an available local port with `SHELBY_MODE=mock` and the isolated temp database, then fetches the following routes:

| Route | Expected HTTP status | Page marker checked |
|---|---|---|
| `/` | 200 | `Evidence Vault` |
| `/dashboard` | 200 | `Evidence index` |
| `/upload` | 200 | `Package files into a verifiable` |
| `/blob/blob-001` | 200 | `Shelby AI Evidence Vault` |
| `/read-receipt/rr-001` | 200 | `Shelby AI Evidence Vault` |
| `/read-receipt/c8-rr-agent-sentinel-v1` | 200 | `Shelby AI Evidence Vault` |

The server is shut down cleanly after the smoke checks, even on failure.

---

## Machine-readable output

The verifier writes a JSON artifact to:

```
artifacts/release-candidate/latest.json
```

This file is gitignored and never committed. It contains:

- `timestamp` — ISO 8601 run time
- `gitSha` — short SHA of the current commit (if available)
- `nodeVersion` — Node.js version used
- `checks` — per-check pass/fail/skip results with labels and details
- `localServerPort` — port the Next.js server ran on
- `routes` — route smoke results (status code, marker found, errors)
- `overallStatus` — `"pass"` or `"fail"`

---

## Isolated temp database

The verifier uses a temp directory (via `os.tmpdir()`) for the SQLite database in all steps. The operator's normal database at `data/shelby-vault.sqlite` (or `SHELBY_DB_PATH`) is never read or modified.

The temp database is deleted when the verifier exits, even on failure.

---

## Boundaries (what this does not do)

- No real Shelby network calls
- No private keys, seed phrases, or wallet credentials
- No real LLM or API calls
- No mutations to the operator's local database
- No secrets printed to stdout or the artifact file
- No browser automation (Playwright, Selenium, etc.)
- No marketplace, trading, token, or payment features

---

## Manual product QA after the automated gate

After `npm run verify-release-candidate` passes, run the local app and inspect the actual product surface:

```bash
npm run dev
# Open http://localhost:3000
```

Manual checks:

| Area | Expected result |
|---|---|
| Language | Default surface is Chinese; top-nav language toggle switches the main product routes to English |
| Home | Shelby ecosystem positioning, evidence-flow board, core capability cards, product preview |
| Registry | Evidence packs from demo/local/SQLite are visible; search, filters, sort, and cards remain usable |
| Upload | Mock + SQLite path is clear; testnet path is gated by wallet and operator prerequisites |
| Blob detail | Shows provenance, Shelby ref, SHA-256 hash, source, metadata, and pack relationship |
| Read receipt | Shows query, answer summary, run metadata, referenced Blob identity, and evidence pack links |
| Boundaries | No UI implies mainnet readiness, token trading, marketplace behavior, or server-side wallet custody |

---

## Running manually

```bash
# From a clean checkout:
git clone https://github.com/a941249849/Shelby-AI-Evidence-Vault.git
cd Shelby-AI-Evidence-Vault
npm install
npm run verify-release-candidate
```

The verifier requires Node.js 18 or later (the same requirement as the app itself). No environment variables are needed.

---

## Individual checks

Each check in the verifier can also be run independently for debugging:

```bash
# Mock-mode readiness (always passes with zero credentials)
npm run shelby-doctor

# Testnet fail-closed guard (must exit 1)
SHELBY_MODE=testnet npm run shelby-doctor

# Public-key guard (must exit 1)
NEXT_PUBLIC_SHELBY_API_KEY=fake_public_key npm run shelby-doctor

# Zero-credential DB-level harness (35 assertions)
npm run verify-community-demo

# Generate C8 evidence pack (writes to default data/shelby-vault.sqlite)
npm run generate-agent-run

# Production build
npm run build

# Development server (for manual inspection after generate-agent-run)
npm run dev
```

---

## Expected output (abbreviated)

```
[rc] ══ C12 Release-Candidate Acceptance Harness ══════════════════════════
[rc] Temp DB : /tmp/shelby-rc-<random>/rc.sqlite
[rc] Node    : v20.x.x
[rc] Git SHA : abc1234

[rc] ── 1. shelby-doctor — mock/local mode (expect PASS) ─────────────────
  ✓  shelby-doctor (mock mode, zero credentials): exit 0
  ✓  shelby-doctor mock output contains PASS

[rc] ── 2. shelby-doctor — testnet mode, no config (expect exit 1) ───────
  ✓  shelby-doctor (testnet mode, no config — must fail closed): exit 1

[rc] ── 3. shelby-doctor — public-secret guard (expect exit 1) ───────────
  ✓  shelby-doctor (NEXT_PUBLIC_SHELBY_API_KEY set — must fail closed): exit 1

[rc] ── 4. verify-community-demo (zero-credential DB harness) ────────────
  ✓  npm run verify-community-demo: exit 0

[rc] ── 5. generate-agent-run → C8 IDs in isolated DB ───────────────────
  ✓  generate-agent-run script exits 0
  ✓  C8 pack id "c8-pack-agent-sentinel-v1" persisted
  ✓  C8 blob id "c8-blob-input-v1" persisted
  ✓  C8 blob id "c8-blob-output-v1" persisted
  ✓  C8 receipt id "c8-rr-agent-sentinel-v1" persisted
  ✓  generate-agent-run is idempotent (no duplicate rows)

[rc] ── 6. npm run build ─────────────────────────────────────────────────
  ✓  npm run build: exit 0

[rc] ── 7. Start built app + route smoke checks ─────────────────────────
  → Using port 34821
  → Waiting for server at http://127.0.0.1:34821/…
  ✓  Server started and ready at :34821

[rc] ── 7a. Route smoke checks ───────────────────────────────────────────
  ✓  GET /: HTTP 200 + marker found
  ✓  GET /dashboard: HTTP 200 + marker found
  ✓  GET /upload: HTTP 200 + marker found
  ✓  GET /blob/blob-001: HTTP 200 + marker found
  ✓  GET /read-receipt/rr-001: HTTP 200 + marker found
  ✓  GET /read-receipt/c8-rr-agent-sentinel-v1: HTTP 200 + marker found

[rc] ── Summary ──────────────────────────────────────────────────────────
  Passed  : 18
  Failed  : 0
  Skipped : 0

[rc] Artifact written to: /path/to/artifacts/release-candidate/latest.json

[rc] All release-candidate checks passed.
```

---

## Maintenance

When new routes or significant product features are added, the route smoke table in `scripts/verify-release-candidate.mjs` and this checklist should be updated. The verifier should remain zero-credential and mock-safe at all times.
