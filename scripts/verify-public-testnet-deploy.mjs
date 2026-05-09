#!/usr/bin/env node
/**
 * Public deployment preflight for the Shelby browser-wallet testnet path.
 *
 * This script validates the environment shape needed by a community-facing
 * deployment. It does not make network calls and never prints secret values.
 */

import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const env = process.env;
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const checks = [];

function add(status, id, message, action) {
  checks.push({ status, id, message, action });
}

function validUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function positiveInteger(value) {
  if (!value) return false;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function gitValue(command) {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

const forbiddenPublicSecrets = [
  'NEXT_PUBLIC_SHELBY_API_KEY',
  'NEXT_PUBLIC_SHELBY_SECRET',
  'NEXT_PUBLIC_SHELBY_SECRET_KEY',
  'NEXT_PUBLIC_SHELBY_PRIVATE_KEY',
  'NEXT_PUBLIC_SHELBY_SEED',
  'NEXT_PUBLIC_SHELBY_MNEMONIC',
];

add('info', 'stage', 'X20 public testnet deployment preflight');

if (env.SHELBY_MODE === 'testnet') {
  add('pass', 'mode', 'SHELBY_MODE=testnet');
} else {
  add(
    'fail',
    'mode',
    `SHELBY_MODE is "${env.SHELBY_MODE ?? '(unset)'}", expected "testnet".`,
    'Set SHELBY_MODE=testnet in the deployment environment.'
  );
}

if ((env.NEXT_PUBLIC_SHELBY_NETWORK ?? 'testnet') === 'testnet') {
  add('pass', 'browser-network', 'NEXT_PUBLIC_SHELBY_NETWORK targets testnet.');
} else {
  add(
    'fail',
    'browser-network',
    `NEXT_PUBLIC_SHELBY_NETWORK is "${env.NEXT_PUBLIC_SHELBY_NETWORK}".`,
    'Set NEXT_PUBLIC_SHELBY_NETWORK=testnet for the public testnet deployment.'
  );
}

if (env.NEXT_PUBLIC_TESTNET_API_KEY) {
  add('pass', 'frontend-api-key', 'NEXT_PUBLIC_TESTNET_API_KEY is set (value redacted).');
} else {
  add(
    'fail',
    'frontend-api-key',
    'NEXT_PUBLIC_TESTNET_API_KEY is missing.',
    'Set a Shelby/Geomi frontend client key intended for browser DApp use.'
  );
}

for (const name of forbiddenPublicSecrets) {
  if (env[name]) {
    add(
      'fail',
      `forbidden-${name.toLowerCase()}`,
      `${name} is set.`,
      `Remove ${name}. Never expose server/private keys, seed phrases, or signer material through NEXT_PUBLIC_.`
    );
  }
}

if (!forbiddenPublicSecrets.some((name) => env[name])) {
  add('pass', 'forbidden-public-secrets', 'No forbidden browser-public secret names are set.');
}

if (env.NEXT_PUBLIC_SHELBY_RPC_URL) {
  if (validUrl(env.NEXT_PUBLIC_SHELBY_RPC_URL)) {
    add('pass', 'browser-rpc-url', 'NEXT_PUBLIC_SHELBY_RPC_URL is a valid URL.');
  } else {
    add('fail', 'browser-rpc-url', 'NEXT_PUBLIC_SHELBY_RPC_URL is not a valid URL.');
  }
} else {
  add('warn', 'browser-rpc-url', 'NEXT_PUBLIC_SHELBY_RPC_URL is unset; SDK default will be used.');
}

if (env.NEXT_PUBLIC_SHELBY_INDEXER_URL) {
  if (validUrl(env.NEXT_PUBLIC_SHELBY_INDEXER_URL)) {
    add('pass', 'browser-indexer-url', 'NEXT_PUBLIC_SHELBY_INDEXER_URL is a valid URL.');
  } else {
    add('fail', 'browser-indexer-url', 'NEXT_PUBLIC_SHELBY_INDEXER_URL is not a valid URL.');
  }
} else {
  add('warn', 'browser-indexer-url', 'NEXT_PUBLIC_SHELBY_INDEXER_URL is unset; SDK default will be used.');
}

if (positiveInteger(env.NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS ?? '24')) {
  add('pass', 'expiration-hours', 'NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS is positive.');
} else {
  add(
    'fail',
    'expiration-hours',
    'NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS must be a positive integer.',
    'Set NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24 unless the operator has a different policy.'
  );
}

if (!env.SHELBY_DB_PATH) {
  add(
    'fail',
    'sqlite-path',
    'SHELBY_DB_PATH is not set for deployment.',
    'Use an absolute path on a persistent disk, for example /app/data/shelby-vault.sqlite.'
  );
} else if (!isAbsolute(env.SHELBY_DB_PATH)) {
  add(
    'fail',
    'sqlite-path',
    'SHELBY_DB_PATH is not absolute.',
    'Use an absolute path on a persistent disk, for example /app/data/shelby-vault.sqlite.'
  );
} else {
  const dbDir = dirname(env.SHELBY_DB_PATH);
  try {
    mkdirSync(dbDir, { recursive: true });
    const probePath = join(dbDir, `.shelby-write-probe-${Date.now()}`);
    writeFileSync(probePath, 'ok\n', 'utf-8');
    unlinkSync(probePath);
    add('pass', 'sqlite-path', `SHELBY_DB_PATH directory is writable: ${dbDir}`);
  } catch (err) {
    add(
      'fail',
      'sqlite-path',
      `SHELBY_DB_PATH directory is not writable: ${dbDir}`,
      err instanceof Error ? err.message : 'Check deployment volume permissions.'
    );
  }
}

if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.NEXT_RUNTIME === 'edge') {
  add(
    'warn',
    'serverless-runtime',
    'Serverless/edge-like runtime detected.',
    'This candidate uses better-sqlite3 and should be deployed on a long-running Node runtime with a persistent disk.'
  );
}

const failed = checks.filter((check) => check.status === 'fail');
const warned = checks.filter((check) => check.status === 'warn');
const result = {
  product: 'Shelby AI Evidence Vault',
  stage: 'X20 public testnet deployment preflight',
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

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('\n[public-testnet-deploy] Shelby AI Evidence Vault');
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
}

if (!result.deployReady) {
  process.exit(1);
}
