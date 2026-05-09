#!/usr/bin/env node
/**
 * Vercel builder-demo preflight.
 *
 * This validates the environment shape for the low-cost deployment target:
 * Vercel for the website/API, Neon/Postgres for evidence records, Shelby
 * testnet for Blob storage, and browser wallet signing for uploads.
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const env = process.env;
const checks = [];

function add(status, id, message, action) {
  checks.push({ status, id, message, action });
}

function gitValue(command) {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function isDatabaseUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

const forbiddenPublicSecrets = [
  'NEXT_PUBLIC_SHELBY_API_KEY',
  'NEXT_PUBLIC_SHELBY_SECRET',
  'NEXT_PUBLIC_SHELBY_SECRET_KEY',
  'NEXT_PUBLIC_SHELBY_PRIVATE_KEY',
  'NEXT_PUBLIC_SHELBY_SEED',
  'NEXT_PUBLIC_SHELBY_MNEMONIC',
  'NEXT_PUBLIC_DATABASE_URL',
  'NEXT_PUBLIC_POSTGRES_URL',
  'NEXT_PUBLIC_NEON_DATABASE_URL',
];

add('info', 'stage', 'X21 Vercel Builder Demo preflight');

if (env.SHELBY_MODE === 'testnet') {
  add('pass', 'mode', 'SHELBY_MODE=testnet');
} else {
  add('fail', 'mode', `SHELBY_MODE is "${env.SHELBY_MODE ?? '(unset)'}".`, 'Set SHELBY_MODE=testnet.');
}

if ((env.NEXT_PUBLIC_SHELBY_NETWORK ?? 'testnet') === 'testnet') {
  add('pass', 'browser-network', 'NEXT_PUBLIC_SHELBY_NETWORK targets testnet.');
} else {
  add('fail', 'browser-network', 'NEXT_PUBLIC_SHELBY_NETWORK must be testnet.');
}

if (env.NEXT_PUBLIC_TESTNET_API_KEY) {
  add('pass', 'frontend-api-key', 'NEXT_PUBLIC_TESTNET_API_KEY is set (value redacted).');
} else {
  add('fail', 'frontend-api-key', 'Set the Shelby/Geomi frontend client key.');
}

const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || env.NEON_DATABASE_URL;
if (isDatabaseUrl(databaseUrl)) {
  add('pass', 'database-url', 'Server-side Postgres/Neon URL is configured (value redacted).');
} else {
  add(
    'fail',
    'database-url',
    'DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL is missing or invalid.',
    'Create a Neon Postgres database and set its connection string as a server-side Vercel env var.'
  );
}

if ((env.EVIDENCE_STORE ?? 'auto') === 'sqlite') {
  add(
    'fail',
    'evidence-store',
    'EVIDENCE_STORE=sqlite is not suitable for Vercel Builder Demo.',
    'Unset EVIDENCE_STORE or set EVIDENCE_STORE=postgres.'
  );
} else {
  add('pass', 'evidence-store', 'Evidence store will use hosted Postgres on Vercel.');
}

for (const name of forbiddenPublicSecrets) {
  if (env[name]) {
    add('fail', `forbidden-${name.toLowerCase()}`, `${name} is set.`, `Remove ${name} from public env.`);
  }
}

if (!forbiddenPublicSecrets.some((name) => env[name])) {
  add('pass', 'forbidden-public-secrets', 'No forbidden NEXT_PUBLIC secret/database variables are set.');
}

if (env.SHELBY_DB_PATH) {
  add(
    'warn',
    'sqlite-path',
    'SHELBY_DB_PATH is set but ignored by the Vercel/Neon path.',
    'Keep SHELBY_DB_PATH for local dev only; do not depend on it in Vercel.'
  );
}

const failed = checks.filter((check) => check.status === 'fail');
const warned = checks.filter((check) => check.status === 'warn');
const result = {
  product: 'Shelby AI Evidence Vault',
  stage: 'X21 Vercel Builder Demo preflight',
  generatedAt: new Date().toISOString(),
  git: {
    branch: gitValue('git branch --show-current'),
    sha: gitValue('git rev-parse --short HEAD'),
  },
  deployReady: failed.length === 0,
  passed: checks.filter((check) => check.status === 'pass').length,
  failed: failed.length,
  warned: warned.length,
  checks,
};

console.log('\n[vercel-builder-demo] Shelby AI Evidence Vault');
console.log(`  Branch       : ${result.git.branch ?? '(unknown)'}`);
console.log(`  SHA          : ${result.git.sha ?? '(unknown)'}`);
console.log(`  Passed       : ${result.passed}`);
console.log(`  Warnings     : ${result.warned}`);
console.log(`  Failed       : ${result.failed}`);
console.log(`  Deploy ready : ${result.deployReady ? 'yes' : 'no'}`);

for (const check of checks) {
  const icon =
    check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : check.status === 'warn' ? '!' : '·';
  console.log(`  ${icon} ${check.id}: ${check.message}`);
  if (check.action) console.log(`      ${check.action}`);
}

if (!result.deployReady) process.exit(1);
