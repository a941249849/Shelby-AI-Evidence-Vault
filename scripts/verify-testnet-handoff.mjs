#!/usr/bin/env node
/**
 * Verify a copied /testnet public handoff JSON artifact.
 *
 * Usage:
 *   npm run verify-testnet-handoff -- path/to/handoff.json
 *
 * This is the post-manual-upload acceptance check: after a real Shelby testnet
 * upload, copy the JSON from /testnet, save it to a local file, and run this
 * script. It performs no network calls and never needs private keys.
 */

import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
let passCount = 0;
let failCount = 0;

function pass(label) {
  passCount++;
  console.log(`  ✓  ${label}`);
}

function fail(label, detail = '') {
  failCount++;
  console.error(`  ✗  ${label}${detail ? ': ' + detail : ''}`);
}

function assert(condition, label, detail = '') {
  if (condition) pass(label);
  else fail(label, detail);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function includesTestnet(value) {
  return isNonEmptyString(value) && value.toLowerCase().includes('testnet');
}

function usage() {
  console.error('\n[handoff] Usage: npm run verify-testnet-handoff -- path/to/handoff.json\n');
}

if (!filePath) {
  usage();
  process.exit(2);
}

let handoff;
try {
  handoff = JSON.parse(readFileSync(filePath, 'utf-8'));
} catch (err) {
  console.error(`[handoff] Could not read or parse JSON: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
}

console.log('\n[handoff] Verifying public testnet handoff artifact');
console.log(`[handoff] File: ${filePath}\n`);

assert(isObject(handoff), 'handoff is a JSON object');
assert(handoff.product === 'Shelby AI Evidence Vault', 'product is Shelby AI Evidence Vault');
assert(handoff.milestone === 'X15 public testnet handoff artifact', 'milestone is X15 handoff');
assert(handoff.runtimeMode === 'testnet', 'runtimeMode is testnet');
assert(['browser', 'sqlite', 'mixed'].includes(handoff.ledgerSource), 'ledgerSource is recognized');

assert(isObject(handoff.routes), 'routes object exists');
assert(isHttpUrl(handoff.routes?.testnetConsole), 'routes.testnetConsole is an HTTP URL');
assert(isHttpUrl(handoff.routes?.upload), 'routes.upload is an HTTP URL');
assert(isHttpUrl(handoff.routes?.dashboard), 'routes.dashboard is an HTTP URL');

assert(isObject(handoff.wallet), 'wallet object exists');
assert(handoff.wallet?.ready === true, 'wallet.ready is true');
assert(isNonEmptyString(handoff.wallet?.accountAddress), 'wallet.accountAddress exists');
assert(includesTestnet(handoff.wallet?.network), 'wallet.network is testnet');

assert(isObject(handoff.latestReceipt), 'latestReceipt exists');
assert(isNonEmptyString(handoff.latestReceipt?.id), 'latestReceipt.id exists');
assert(isNonEmptyString(handoff.latestReceipt?.runId), 'latestReceipt.runId exists');
assert(handoff.latestReceipt?.receiptMode === 'shelby-testnet', 'latestReceipt.receiptMode is shelby-testnet');
assert(isHttpUrl(handoff.latestReceipt?.url), 'latestReceipt.url is an HTTP URL');

assert(Array.isArray(handoff.blobs) && handoff.blobs.length > 0, 'at least one Blob proof exists');
for (const [index, blob] of (Array.isArray(handoff.blobs) ? handoff.blobs : []).entries()) {
  const prefix = `blobs[${index}]`;
  assert(isNonEmptyString(blob.id), `${prefix}.id exists`);
  assert(isNonEmptyString(blob.shelbyRef) && blob.shelbyRef.startsWith('shelby://testnet/'), `${prefix}.shelbyRef is testnet`);
  assert(isNonEmptyString(blob.accountAddress), `${prefix}.accountAddress exists`);
  assert(isNonEmptyString(blob.blobName), `${prefix}.blobName exists`);
  assert(includesTestnet(blob.network), `${prefix}.network is testnet`);
  assert(isNonEmptyString(blob.storageStatus), `${prefix}.storageStatus exists`);
  assert(isHttpUrl(blob.explorerUrl), `${prefix}.explorerUrl is an HTTP URL`);
  assert(isHttpUrl(blob.retrievalUrl), `${prefix}.retrievalUrl is an HTTP URL`);
  assert(isHttpUrl(blob.url), `${prefix}.url is an HTTP URL`);
}

assert(Array.isArray(handoff.smokeCommands) && handoff.smokeCommands.length > 0, 'smokeCommands exists');
for (const [index, smoke] of (Array.isArray(handoff.smokeCommands) ? handoff.smokeCommands : []).entries()) {
  const command = smoke.command ?? '';
  const prefix = `smokeCommands[${index}]`;
  assert(isNonEmptyString(smoke.blobId), `${prefix}.blobId exists`);
  assert(command.includes('SHELBY_SMOKE=true'), `${prefix}.command enables smoke`);
  assert(command.includes('SHELBY_SMOKE_ACCOUNT_ADDRESS='), `${prefix}.command includes account`);
  assert(command.includes('SHELBY_SMOKE_BLOB_NAME='), `${prefix}.command includes blobName`);
  assert(command.includes('npm run smoke'), `${prefix}.command runs smoke`);
}

assert(isObject(handoff.acceptanceStatus), 'acceptanceStatus object exists');
assert(handoff.acceptanceStatus?.runtimeModeReady === true, 'acceptanceStatus.runtimeModeReady is true');
assert(handoff.acceptanceStatus?.walletReady === true, 'acceptanceStatus.walletReady is true');
assert(handoff.acceptanceStatus?.testnetReceiptPresent === true, 'acceptanceStatus.testnetReceiptPresent is true');
assert(handoff.acceptanceStatus?.testnetBlobPresent === true, 'acceptanceStatus.testnetBlobPresent is true');
assert(handoff.acceptanceStatus?.smokeCommandReady === true, 'acceptanceStatus.smokeCommandReady is true');
assert(Array.isArray(handoff.acceptancePath) && handoff.acceptancePath.length >= 4, 'acceptancePath is populated');

console.log(`\n[handoff] Passed: ${passCount}`);
console.log(`[handoff] Failed: ${failCount}`);

if (failCount > 0) {
  console.error('\n[handoff] FAIL — handoff is not ready for public testnet review.\n');
  process.exit(1);
}

console.log('\n[handoff] PASS — handoff is ready for public testnet review.\n');
