#!/usr/bin/env node
/**
 * Generate the public Shelby testnet release operator package.
 *
 * This script is intentionally local and non-networked. It reads the final
 * readiness artifact, then writes one concise JSON packet for the human
 * operator who will run the real wallet upload, copied handoff validation, and
 * final Copilot review.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const readinessPath = join(ROOT, 'artifacts', 'final-readiness', 'latest.json');
const outputDir = join(ROOT, 'artifacts', 'public-testnet-release');
const outputPath = join(outputDir, 'latest.json');

function gitValue(command) {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

const readiness = readJson(readinessPath);
const codeCandidateReady = readiness?.codeCandidateReady === true;

const packet = {
  product: 'Shelby AI Evidence Vault',
  stage: 'X19 public testnet release operator package',
  generatedAt: new Date().toISOString(),
  git: {
    branch: gitValue('git branch --show-current'),
    sha: gitValue('git rev-parse --short HEAD'),
  },
  readiness: {
    artifact: readinessPath,
    exists: existsSync(readinessPath),
    codeCandidateReady,
    rcChecks: readiness?.releaseCandidate
      ? {
          passed: readiness.releaseCandidate.passed,
          failed: readiness.releaseCandidate.failed,
          skipped: readiness.releaseCandidate.skipped,
          expectedPassed: readiness.releaseCandidate.expectedPassed,
        }
      : null,
  },
  localGateCommands: [
    'npm run lint',
    'npm run build',
    'npm run verify-release-candidate',
    'npm run final-readiness',
    'npm run public-testnet-release-pack',
  ],
  deploymentEnv: {
    required: {
      SHELBY_MODE: 'testnet',
      NEXT_PUBLIC_SHELBY_NETWORK: 'testnet',
    },
    recommendedPublic: {
      NEXT_PUBLIC_SHELBY_RPC_URL: 'https://api.testnet.shelby.xyz/shelby',
      NEXT_PUBLIC_SHELBY_INDEXER_URL:
        'https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql',
      NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS: '24',
    },
    forbidden: [
      'NEXT_PUBLIC_SHELBY_API_KEY',
      'NEXT_PUBLIC_SHELBY_SECRET',
      'NEXT_PUBLIC_SHELBY_SECRET_KEY',
      'NEXT_PUBLIC_SHELBY_PRIVATE_KEY',
      'NEXT_PUBLIC_SHELBY_SEED',
      'NEXT_PUBLIC_SHELBY_MNEMONIC',
    ],
  },
  publicRoutes: [
    '/',
    '/testnet',
    '/dashboard',
    '/upload',
    '/blob/blob-001',
    '/read-receipt/rr-001',
    '/read-receipt/c8-rr-agent-sentinel-v1',
  ],
  manualTestnetRun: [
    'Open /testnet and confirm public testnet mode, wallet readiness, and boundaries.',
    'Connect an Aptos Testnet wallet with testnet APT and ShelbyUSD/storage credits.',
    'Open /upload and upload one small evidence file through the browser-wallet Shelby path.',
    'Open the generated Blob route and run the in-app proof verification panel.',
    'Open the generated read receipt route and run receipt-level proof aggregation.',
    'Return to /testnet and copy the community handoff JSON.',
    'Save the copied JSON locally and run npm run verify-testnet-handoff -- path/to/handoff.json.',
    'Optionally run the smoke command emitted inside the handoff JSON for retrieval confirmation.',
  ],
  finalReview: {
    copilotBrief: 'docs/final-copilot-review-brief.md',
    expectedOutputs: ['merge-ready', 'needs-real-testnet-run', 'blocked'],
  },
  hardBoundaries: [
    'testnet only',
    'no mainnet claim',
    'no private-key custody',
    'no server signer',
    'no browser-public Shelby API key',
    'no trading/payment/marketplace surface',
  ],
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(packet, null, 2) + '\n', 'utf-8');

console.log('\n[public-testnet-release-pack] Shelby AI Evidence Vault');
console.log(`  Branch              : ${packet.git.branch ?? '(unknown)'}`);
console.log(`  SHA                 : ${packet.git.sha ?? '(unknown)'}`);
console.log(`  Final readiness      : ${packet.readiness.exists ? 'present' : 'missing'}`);
console.log(`  Code candidate ready : ${packet.readiness.codeCandidateReady ? 'yes' : 'no'}`);
console.log(`  Output               : ${outputPath}`);

if (!codeCandidateReady) {
  console.error(
    '\n[public-testnet-release-pack] FAIL — run npm run verify-release-candidate and npm run final-readiness first.\n'
  );
  process.exit(1);
}

console.log('\n[public-testnet-release-pack] PASS — operator package generated for the real testnet run.\n');
