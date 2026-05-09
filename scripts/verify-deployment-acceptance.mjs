#!/usr/bin/env node
/**
 * Hosted deployment acceptance check.
 *
 * This verifies the deployed Builder Demo shape after Vercel env has been set:
 * Vercel website/API, Neon/Postgres evidence records, and Shelby testnet as the
 * real Blob storage path. It does not perform wallet signing or upload files.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const ARTIFACT_DIR = join(ROOT, 'artifacts', 'deployment-acceptance');
const ARTIFACT_PATH = join(ARTIFACT_DIR, 'latest.json');
const timeoutMs = Number(process.env.DEPLOYMENT_ACCEPTANCE_TIMEOUT_MS ?? 12000);
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

function normalizeBaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'shelby-ai-evidence-vault-deployment-acceptance/1.0',
      },
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const result = await fetchText(url);
  let json = null;
  try {
    json = JSON.parse(result.body);
  } catch {
    // Keep json null; caller records the failure with the HTTP details.
  }
  return { ...result, json };
}

function expectEqual(id, actual, expected, label, action) {
  if (actual === expected) {
    add('pass', id, `${label}: ${expected}`);
  } else {
    add('fail', id, `${label}: expected ${expected}, got ${String(actual)}`, action);
  }
}

async function smokeRoute(baseUrl, path, marker) {
  const url = `${baseUrl}${path}`;
  try {
    const result = await fetchText(url);
    if (!result.ok) {
      add('fail', `route-${path}`, `${path} returned HTTP ${result.status}`, `Open ${url} and inspect deployment logs.`);
      return;
    }
    if (!result.body.includes(marker)) {
      add('fail', `route-${path}`, `${path} did not contain marker "${marker}".`, `Confirm the deployed build includes the latest Builder Demo UI.`);
      return;
    }
    add('pass', `route-${path}`, `${path}: HTTP ${result.status} + marker found`);
  } catch (err) {
    add('fail', `route-${path}`, `${path} request failed: ${err instanceof Error ? err.message : String(err)}`, `Open ${url} and inspect deployment logs.`);
  }
}

const baseUrl = normalizeBaseUrl(process.env.DEPLOYMENT_URL || process.argv[2]);

add('info', 'stage', 'X23 hosted deployment acceptance');

if (!baseUrl) {
  add(
    'fail',
    'deployment-url',
    'DEPLOYMENT_URL is missing or invalid.',
    'Run DEPLOYMENT_URL=https://your-vercel-app.vercel.app npm run verify-deployment-acceptance.'
  );
} else {
  add('pass', 'deployment-url', `Target: ${baseUrl}`);

  const healthUrl = `${baseUrl}/api/health`;
  try {
    const health = await fetchJson(healthUrl);
    if (!health.ok) {
      add('fail', 'health-http', `/api/health returned HTTP ${health.status}.`, 'Check Vercel env and function logs.');
    } else {
      add('pass', 'health-http', '/api/health returned HTTP 200.');
    }

    if (!health.json) {
      add('fail', 'health-json', '/api/health did not return JSON.', 'Check that the deployed app is serving the Next.js API route.');
    } else {
      add('pass', 'health-json', '/api/health returned JSON.');
      expectEqual('health-positioning', health.json.positioning, 'builder-demo', 'positioning', 'Deploy the X22+ build.');
      expectEqual('health-ok', health.json.ok, true, 'ok', 'Check persistence and testnet env.');
      expectEqual('runtime-mode', health.json.runtime?.mode, 'testnet', 'runtime.mode', 'Set SHELBY_MODE=testnet.');
      expectEqual(
        'browser-network',
        health.json.browserTestnet?.network,
        'testnet',
        'browserTestnet.network',
        'Set NEXT_PUBLIC_SHELBY_NETWORK=testnet.'
      );
      expectEqual(
        'browser-api-key',
        health.json.browserTestnet?.apiKeyConfigured,
        true,
        'browserTestnet.apiKeyConfigured',
        'Set NEXT_PUBLIC_TESTNET_API_KEY in Vercel.'
      );
      expectEqual(
        'persistence-kind',
        health.json.persistence?.kind,
        'postgres',
        'persistence.kind',
        'Set DATABASE_URL or EVIDENCE_STORE=postgres for Neon/Postgres.'
      );
      expectEqual(
        'persistence-ready',
        health.json.persistence?.ready,
        true,
        'persistence.ready',
        'Check Neon connection string and database reachability.'
      );
      expectEqual(
        'persistence-configured',
        health.json.persistence?.configured,
        true,
        'persistence.configured',
        'Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL server-side only.'
      );

      const boundaries = Array.isArray(health.json.boundaries) ? health.json.boundaries : [];
      if (boundaries.includes('no private-key custody') && boundaries.includes('no mainnet claim')) {
        add('pass', 'health-boundaries', 'Boundary claims are exposed by health endpoint.');
      } else {
        add('fail', 'health-boundaries', 'Health endpoint is missing required boundary claims.', 'Deploy the latest /api/health route.');
      }
    }
  } catch (err) {
    add('fail', 'health-request', `/api/health request failed: ${err instanceof Error ? err.message : String(err)}`, `Open ${healthUrl} and inspect deployment logs.`);
  }

  await smokeRoute(baseUrl, '/', 'Shelby AI Evidence Vault');
  await smokeRoute(baseUrl, '/testnet', '开发者测试网演示控制台');
  await smokeRoute(baseUrl, '/upload', 'Package files into a verifiable');
  await smokeRoute(baseUrl, '/dashboard', 'Evidence index');
}

const failed = checks.filter((check) => check.status === 'fail');
const warned = checks.filter((check) => check.status === 'warn');
const result = {
  product: 'Shelby AI Evidence Vault',
  stage: 'X23 hosted deployment acceptance',
  generatedAt: new Date().toISOString(),
  baseUrl,
  git: {
    branch: gitValue('git branch --show-current'),
    sha: gitValue('git rev-parse --short HEAD'),
  },
  accepted: failed.length === 0,
  passed: checks.filter((check) => check.status === 'pass').length,
  failed: failed.length,
  warned: warned.length,
  checks,
};

mkdirSync(ARTIFACT_DIR, { recursive: true });
writeFileSync(ARTIFACT_PATH, `${JSON.stringify(result, null, 2)}\n`);

console.log('\n[deployment-acceptance] Shelby AI Evidence Vault');
console.log(`  Branch   : ${result.git.branch ?? '(unknown)'}`);
console.log(`  SHA      : ${result.git.sha ?? '(unknown)'}`);
console.log(`  Target   : ${result.baseUrl ?? '(missing)'}`);
console.log(`  Passed   : ${result.passed}`);
console.log(`  Warnings : ${result.warned}`);
console.log(`  Failed   : ${result.failed}`);
console.log(`  Accepted : ${result.accepted ? 'yes' : 'no'}`);

for (const check of checks) {
  const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : check.status === 'warn' ? '!' : '·';
  console.log(`  ${icon} ${check.id}: ${check.message}`);
  if (check.action) console.log(`      ${check.action}`);
}

console.log(`  Artifact : ${ARTIFACT_PATH}`);

if (!result.accepted) process.exit(1);
