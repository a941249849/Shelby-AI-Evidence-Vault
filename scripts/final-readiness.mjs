#!/usr/bin/env node
/**
 * Produce the final readiness artifact for Shelby AI Evidence Vault.
 *
 * This does not replace the release-candidate verifier. It reads the latest
 * verifier artifact, checks that the final review/handoff files exist, and
 * writes a concise machine-readable status that separates code readiness from
 * the still-manual real Shelby testnet upload requirement.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const rcArtifactPath = join(ROOT, 'artifacts', 'release-candidate', 'latest.json');
const outputDir = join(ROOT, 'artifacts', 'final-readiness');
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

const rcArtifact = readJson(rcArtifactPath);
const checks = Array.isArray(rcArtifact?.checks) ? rcArtifact.checks : [];
const failedChecks = checks.filter((check) => check.status === 'fail');
const skippedChecks = checks.filter((check) => check.status === 'skip');
const passedChecks = checks.filter((check) => check.status === 'pass');

const requiredFiles = [
  'docs/final-copilot-review-brief.md',
  'docs/final-product-acceptance.md',
  'docs/public-testnet-participation.md',
  'scripts/verify-release-candidate.mjs',
  'scripts/verify-testnet-handoff.mjs',
  'src/lib/testnet/handoff.mjs',
];

const missingFiles = requiredFiles.filter((file) => !existsSync(join(ROOT, file)));
const rcPassed =
  rcArtifact?.overallStatus === 'pass' &&
  passedChecks.length === 23 &&
  failedChecks.length === 0 &&
  skippedChecks.length === 0;

const readiness = {
  product: 'Shelby AI Evidence Vault',
  stage: 'X18 final readiness artifact',
  generatedAt: new Date().toISOString(),
  git: {
    branch: gitValue('git branch --show-current'),
    sha: gitValue('git rev-parse --short HEAD'),
  },
  codeCandidateReady: rcPassed && missingFiles.length === 0,
  releaseCandidate: {
    artifact: rcArtifactPath,
    exists: Boolean(rcArtifact),
    overallStatus: rcArtifact?.overallStatus ?? 'missing',
    passed: passedChecks.length,
    failed: failedChecks.length,
    skipped: skippedChecks.length,
    expectedPassed: 23,
  },
  requiredFiles: requiredFiles.map((file) => ({
    file,
    exists: existsSync(join(ROOT, file)),
  })),
  missingFiles,
  externalAcceptanceRequired: [
    {
      id: 'real-shelby-testnet-upload',
      status: 'manual-required',
      description:
        'Connect an Aptos Testnet wallet, upload a small file through /upload, verify Blob proof, verify receipt audit, copy /testnet handoff JSON, then run npm run verify-testnet-handoff -- path/to/handoff.json.',
    },
    {
      id: 'copilot-final-review',
      status: 'manual-required',
      description:
        'Run final Copilot review using docs/final-copilot-review-brief.md and return merge-ready, blocked, or needs-real-testnet-run.',
    },
  ],
  boundaries: [
    'public testnet candidate only',
    'no mainnet claim',
    'no private-key custody',
    'no server signer',
    'no NEXT_PUBLIC_SHELBY_API_KEY',
    'no trading/payment/marketplace surface',
  ],
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(readiness, null, 2) + '\n', 'utf-8');

console.log('\n[final-readiness] Shelby AI Evidence Vault');
console.log(`  Branch              : ${readiness.git.branch ?? '(unknown)'}`);
console.log(`  SHA                 : ${readiness.git.sha ?? '(unknown)'}`);
console.log(`  RC artifact          : ${readiness.releaseCandidate.exists ? 'present' : 'missing'}`);
console.log(
  `  RC checks            : ${readiness.releaseCandidate.passed}/${readiness.releaseCandidate.failed}/${readiness.releaseCandidate.skipped}`
);
console.log(`  Required files       : ${missingFiles.length === 0 ? 'present' : `missing ${missingFiles.join(', ')}`}`);
console.log(`  Code candidate ready : ${readiness.codeCandidateReady ? 'yes' : 'no'}`);
console.log(`  Output               : ${outputPath}`);

if (!readiness.codeCandidateReady) {
  console.error('\n[final-readiness] FAIL — code candidate is not ready. Run npm run verify-release-candidate first.\n');
  process.exit(1);
}

console.log('\n[final-readiness] PASS — code candidate is ready; real testnet upload and Copilot final review remain manual gates.\n');
