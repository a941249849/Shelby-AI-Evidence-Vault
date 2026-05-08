#!/usr/bin/env node
/**
 * Shelby AI Evidence Vault — Readiness Doctor
 *
 * USAGE:
 *   node scripts/shelby-doctor.mjs
 *   npm run shelby-doctor
 *
 *   # Testnet mode (validates testnet-specific vars):
 *   SHELBY_MODE=testnet npm run shelby-doctor
 *
 *   # Machine-readable JSON output:
 *   npm run shelby-doctor -- --json
 *
 * WHAT THIS SCRIPT DOES:
 *   Inspects environment/config only and prints a clear human-readable report
 *   about readiness for local/mock mode or Shelby testnet mode.
 *
 *   1. Detects which mode is configured (mock vs testnet).
 *   2. In mock mode: confirms real upload is disabled; reports pass.
 *   3. In testnet mode: validates all required env vars are present; fails closed
 *      when any required var is missing; validates URL/number/address shapes.
 *   4. Always fails if NEXT_PUBLIC_SHELBY_API_KEY (or similar) is set — that
 *      would expose an API key to the browser bundle.
 *   5. Warns when server-side and browser-side network labels disagree.
 *   6. Warns when testnet and shelbynet endpoint families are mixed.
 *   7. Warns if SHELBY_RPC_URL appears to point at an Aptos fullnode/indexer
 *      rather than the Shelby RPC.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Print full API keys, private keys, seed phrases, or wallet secrets.
 *   - Make any network connections.
 *   - Enable or trigger real uploads.
 *   - Require any env vars in mock mode.
 *
 * EXIT CODES:
 *   0  — all checks passed (or passed with warnings)
 *   1  — one or more ERROR-level checks failed
 *
 * REQUIRED ENV VARS (testnet mode only):
 *   SHELBY_NETWORK, SHELBY_RPC_URL, SHELBY_API_KEY (presence only),
 *   SHELBY_ACCOUNT_ADDRESS, SHELBY_BLOB_EXPIRATION_MICROS, APTOS_NETWORK,
 *   SHELBY_APTOS_FULLNODE_URL, SHELBY_INDEXER_URL,
 *   NEXT_PUBLIC_SHELBY_NETWORK, NEXT_PUBLIC_SHELBY_RPC_URL,
 *   NEXT_PUBLIC_SHELBY_INDEXER_URL, NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS
 *
 * FORBIDDEN ENV VARS (any mode):
 *   NEXT_PUBLIC_SHELBY_API_KEY — API key must never be browser-public
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** @typedef {'PASS' | 'WARN' | 'FAIL' | 'INFO' | 'SKIP'} CheckStatus */

/**
 * @typedef {Object} CheckResult
 * @property {string} id
 * @property {CheckStatus} status
 * @property {string} message
 * @property {string} [detail]
 * @property {string} [action]
 */

/** @param {string} value - the env var value to redact */
function redactSecret(value) {
  if (!value || value.length === 0) return '(empty)';
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '***' + value.slice(-1);
}

/** @param {string} url */
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** @param {string} address */
function isValidAptosAddress(address) {
  return /^0x[0-9a-fA-F]{1,64}$/.test(address);
}

/** @param {string | undefined} value */
function isPositiveInteger(value) {
  if (!value) return false;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

/**
 * Returns true if the URL looks like an Aptos fullnode or indexer URL
 * rather than a Shelby RPC URL.
 * Note: SHELBY_RPC_URL should point to Shelby's blob storage API (Plane 1),
 * not the Aptos fullnode or its aliased indexer endpoints (Plane 2).
 * @param {string} url
 */
function looksLikeAptosEndpoint(url) {
  return (
    url.includes('aptoslabs.com') ||
    url.includes('/v1/graphql') ||
    (url.includes('/v1') && !url.includes('shelby'))
  );
}

/**
 * Returns true if the URL contains 'shelbynet' (older dev-prototype network).
 * @param {string} url
 */
function isShelbynetUrl(url) {
  return url.includes('shelbynet');
}

// ── Parse args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

// ── Read env ───────────────────────────────────────────────────────────────────
const env = process.env;
const shelbyMode = env.SHELBY_MODE ?? 'mock';
const isValidMode = shelbyMode === 'mock' || shelbyMode === 'testnet';
const isTestnet = shelbyMode === 'testnet';

// ── Build checks ──────────────────────────────────────────────────────────────

/** @type {CheckResult[]} */
const checks = [];

/** @param {CheckResult} c */
function addCheck(c) {
  checks.push(c);
}

// ── Section: Mode detection ────────────────────────────────────────────────────

addCheck({
  id: 'mode-detect',
  status: 'INFO',
  message: `SHELBY_MODE = "${shelbyMode}"`,
  detail: !isValidMode
    ? 'Invalid mode detected — only "mock" and "testnet" are supported.'
    : isTestnet
    ? 'Testnet mode detected — validating all required testnet env vars.'
    : 'Mock/local mode — real upload is disabled. No credentials needed.',
});

if (!isValidMode) {
  addCheck({
    id: 'shelby-mode-invalid',
    status: 'FAIL',
    message: `SHELBY_MODE="${shelbyMode}" is not supported.`,
    detail: 'A typo here can silently put an operator on the wrong path, so the doctor fails closed.',
    action: 'Unset SHELBY_MODE for mock/local mode, or set SHELBY_MODE=testnet for real Shelby testnet readiness checks.',
  });
}

// ── Section: Public API key guard (any mode) ───────────────────────────────────
// This is the most critical check. A NEXT_PUBLIC_ API key would be embedded in
// the browser bundle and exposed to every visitor.

const PUBLIC_KEY_NAMES = [
  'NEXT_PUBLIC_SHELBY_API_KEY',
  'NEXT_PUBLIC_SHELBY_SECRET',
  'NEXT_PUBLIC_SHELBY_SECRET_KEY',
  'NEXT_PUBLIC_SHELBY_PRIVATE_KEY',
  'NEXT_PUBLIC_SHELBY_SEED',
  'NEXT_PUBLIC_SHELBY_MNEMONIC',
];

let publicKeyFound = false;
for (const name of PUBLIC_KEY_NAMES) {
  if (env[name]) {
    publicKeyFound = true;
    addCheck({
      id: `public-secret-${name.toLowerCase()}`,
      status: 'FAIL',
      message: `SECURITY: ${name} is set — this exposes a secret to the browser bundle.`,
      detail: `Value starts with: "${redactSecret(env[name])}" (redacted). ` +
        `NEXT_PUBLIC_ variables are embedded in the JavaScript bundle sent to all users. ` +
        `API keys, secrets, and private material must never use a NEXT_PUBLIC_ prefix.`,
      action: `Unset ${name} immediately. If you need an API key, use a server-side ` +
        `variable (e.g. SHELBY_API_KEY) and call it only from a Server Action or API route.`,
    });
  }
}

if (!publicKeyFound) {
  addCheck({
    id: 'public-secret-guard',
    status: 'PASS',
    message: 'No browser-public API key variables detected.',
  });
}

// ── Section: Mock mode checks ──────────────────────────────────────────────────

if (!isTestnet && isValidMode) {
  addCheck({
    id: 'mock-mode-pass',
    status: 'PASS',
    message: 'Mock mode: real upload is disabled by default.',
    detail:
      'SHELBY_MODE is not "testnet", so the app uses the local mock adapter. ' +
      'No Shelby credentials are needed. All uploads produce shelby://mock/blob/ references.',
  });

  // Check browser-side vars in mock mode — not errors, but informational
  if (env.NEXT_PUBLIC_SHELBY_NETWORK && env.NEXT_PUBLIC_SHELBY_NETWORK !== 'mock') {
    addCheck({
      id: 'mock-nextpublic-network',
      status: 'WARN',
      message: `NEXT_PUBLIC_SHELBY_NETWORK="${env.NEXT_PUBLIC_SHELBY_NETWORK}" is set in mock mode.`,
      detail: 'This is harmless but may cause confusion — browser SDK config is not used in mock mode.',
      action: 'Omit NEXT_PUBLIC_SHELBY_NETWORK when testing in mock mode, or set it to "testnet" only when switching to testnet mode.',
    });
  } else {
    addCheck({
      id: 'mock-mode-no-testnet-vars',
      status: 'SKIP',
      message: 'Testnet-specific env var checks skipped (mock mode).',
    });
  }

  addCheck({
    id: 'mock-mode-summary',
    status: 'INFO',
    message: 'To enable Shelby testnet mode: set SHELBY_MODE=testnet and configure all required vars.',
    detail:
      'See docs/shelby-testnet-operator-runbook.md for prerequisites and setup instructions. ' +
      'Run: SHELBY_MODE=testnet npm run shelby-doctor',
  });
}

// ── Section: Testnet mode checks ───────────────────────────────────────────────

if (isTestnet) {
  // ── Plane 1: Shelby storage / RPC plane ──────────────────────────────────────

  addCheck({ id: 'testnet-plane1-header', status: 'INFO', message: '── Plane 1: Shelby storage / RPC plane ──' });

  // SHELBY_NETWORK
  const shelbyNetwork = env.SHELBY_NETWORK ?? '';
  if (!shelbyNetwork) {
    addCheck({
      id: 'shelby-network-missing',
      status: 'FAIL',
      message: 'SHELBY_NETWORK is not set.',
      action: 'Set SHELBY_NETWORK=testnet in .env.local.',
    });
  } else if (shelbyNetwork === 'shelbynet') {
    addCheck({
      id: 'shelby-network-shelbynet',
      status: 'WARN',
      message: `SHELBY_NETWORK="${shelbyNetwork}" — "shelbynet" is the older developer-prototype network.`,
      detail: 'The current official integration target is the Shelby testnet, not shelbynet. Mixing endpoint families causes "You must verify this" failures.',
      action: 'Set SHELBY_NETWORK=testnet unless you specifically need the legacy shelbynet.',
    });
  } else {
    addCheck({
      id: 'shelby-network',
      status: 'PASS',
      message: `SHELBY_NETWORK="${shelbyNetwork}"`,
    });
  }

  // SHELBY_RPC_URL
  const shelbyRpcUrl = env.SHELBY_RPC_URL ?? '';
  if (!shelbyRpcUrl) {
    addCheck({
      id: 'shelby-rpc-url-missing',
      status: 'FAIL',
      message: 'SHELBY_RPC_URL is not set.',
      action: 'Set SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby in .env.local.',
    });
  } else if (!isValidUrl(shelbyRpcUrl)) {
    addCheck({
      id: 'shelby-rpc-url-invalid',
      status: 'FAIL',
      message: `SHELBY_RPC_URL has an invalid URL format: "${shelbyRpcUrl}"`,
      action: 'Ensure SHELBY_RPC_URL is a valid https:// URL.',
    });
  } else if (looksLikeAptosEndpoint(shelbyRpcUrl)) {
    addCheck({
      id: 'shelby-rpc-url-aptos-confusion',
      status: 'WARN',
      message: `SHELBY_RPC_URL="${shelbyRpcUrl}" appears to point at an Aptos fullnode or indexer, not the Shelby RPC.`,
      detail:
        'SHELBY_RPC_URL should be the Shelby blob storage/API endpoint (Plane 1), not the Aptos fullnode or indexer (Plane 2). ' +
        'The official Shelby testnet RPC URL is: https://api.testnet.shelby.xyz/shelby',
      action:
        'Set SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby and put the Aptos fullnode URL in SHELBY_APTOS_FULLNODE_URL.',
    });
  } else if (isShelbynetUrl(shelbyRpcUrl) && shelbyNetwork === 'testnet') {
    addCheck({
      id: 'shelby-rpc-url-shelbynet-mix',
      status: 'WARN',
      message: `SHELBY_RPC_URL contains "shelbynet" but SHELBY_NETWORK="testnet" — endpoint family mismatch.`,
      detail:
        'Using a shelbynet URL with testnet network config mixes incompatible endpoint families. ' +
        'Requests may fail or use the wrong coordination layer.',
      action: 'Ensure both SHELBY_RPC_URL and SHELBY_NETWORK use the same endpoint family (both testnet or both shelbynet).',
    });
  } else {
    addCheck({
      id: 'shelby-rpc-url',
      status: 'PASS',
      message: `SHELBY_RPC_URL="${shelbyRpcUrl}"`,
    });
  }

  // SHELBY_API_KEY — validate presence only; never print value
  const shelbyApiKey = env.SHELBY_API_KEY ?? '';
  if (!shelbyApiKey) {
    addCheck({
      id: 'shelby-api-key-missing',
      status: 'FAIL',
      message: 'SHELBY_API_KEY is not set.',
      detail: 'This check only verifies the key is present — the value is never printed.',
      action: 'Set SHELBY_API_KEY in .env.local to your Shelby testnet API key. Never commit this value.',
    });
  } else {
    addCheck({
      id: 'shelby-api-key-present',
      status: 'PASS',
      message: 'SHELBY_API_KEY is set (value redacted).',
      detail: `Key prefix: "${redactSecret(shelbyApiKey)}" (redacted — never printed in full).`,
    });
  }

  // SHELBY_ACCOUNT_ADDRESS
  const shelbyAccountAddress = env.SHELBY_ACCOUNT_ADDRESS ?? '';
  if (!shelbyAccountAddress) {
    addCheck({
      id: 'shelby-account-address-missing',
      status: 'FAIL',
      message: 'SHELBY_ACCOUNT_ADDRESS is not set.',
      action: 'Set SHELBY_ACCOUNT_ADDRESS=0x<your-address> in .env.local.',
    });
  } else if (!isValidAptosAddress(shelbyAccountAddress)) {
    addCheck({
      id: 'shelby-account-address-invalid',
      status: 'WARN',
      message: `SHELBY_ACCOUNT_ADDRESS="${shelbyAccountAddress}" does not match the 0x<hex> Aptos address format.`,
      detail: 'Expected format: 0x followed by 1–64 hexadecimal characters.',
      action: 'Verify your Shelby account address from your wallet or the Shelby explorer.',
    });
  } else {
    addCheck({
      id: 'shelby-account-address',
      status: 'PASS',
      message: `SHELBY_ACCOUNT_ADDRESS="${shelbyAccountAddress}"`,
    });
  }

  // SHELBY_BLOB_EXPIRATION_MICROS
  const blobExpiration = env.SHELBY_BLOB_EXPIRATION_MICROS ?? '';
  if (!blobExpiration) {
    addCheck({
      id: 'shelby-blob-expiration-missing',
      status: 'FAIL',
      message: 'SHELBY_BLOB_EXPIRATION_MICROS is not set.',
      detail: 'This is required for real Shelby uploads. Example: 1800000000 = 30 minutes.',
      action: 'Set SHELBY_BLOB_EXPIRATION_MICROS=1800000000 (or your preferred expiration in microseconds) in .env.local.',
    });
  } else if (!isPositiveInteger(blobExpiration)) {
    addCheck({
      id: 'shelby-blob-expiration-invalid',
      status: 'FAIL',
      message: `SHELBY_BLOB_EXPIRATION_MICROS="${blobExpiration}" is not a positive integer.`,
      action: 'Use a positive integer value (microseconds). Example: 1800000000 = 30 min.',
    });
  } else {
    const micros = Number(blobExpiration);
    const minutes = Math.round(micros / 60_000_000);
    addCheck({
      id: 'shelby-blob-expiration',
      status: 'PASS',
      message: `SHELBY_BLOB_EXPIRATION_MICROS=${blobExpiration} (≈ ${minutes} min)`,
    });
  }

  // ── Plane 2: Aptos coordination plane ─────────────────────────────────────────

  addCheck({ id: 'testnet-plane2-header', status: 'INFO', message: '── Plane 2: Aptos coordination plane ──' });

  // APTOS_NETWORK
  const aptosNetwork = env.APTOS_NETWORK ?? '';
  if (!aptosNetwork) {
    addCheck({
      id: 'aptos-network-missing',
      status: 'FAIL',
      message: 'APTOS_NETWORK is not set.',
      action: 'Set APTOS_NETWORK=testnet in .env.local.',
    });
  } else {
    addCheck({
      id: 'aptos-network',
      status: 'PASS',
      message: `APTOS_NETWORK="${aptosNetwork}"`,
    });
  }

  // Warn if Plane 1 SHELBY_NETWORK and Plane 2 APTOS_NETWORK disagree
  if (shelbyNetwork && aptosNetwork && shelbyNetwork !== aptosNetwork) {
    addCheck({
      id: 'network-plane-mismatch',
      status: 'WARN',
      message: `SHELBY_NETWORK="${shelbyNetwork}" and APTOS_NETWORK="${aptosNetwork}" disagree.`,
      detail:
        'Both planes should target the same network. Mixing testnet and shelbynet endpoint families ' +
        'in one runtime config can cause authentication and coordination failures.',
      action: `Set both SHELBY_NETWORK and APTOS_NETWORK to the same value (e.g. "testnet").`,
    });
  }

  // SHELBY_APTOS_FULLNODE_URL
  const aptosFullnodeUrl = env.SHELBY_APTOS_FULLNODE_URL ?? '';
  if (!aptosFullnodeUrl) {
    addCheck({
      id: 'aptos-fullnode-url-missing',
      status: 'FAIL',
      message: 'SHELBY_APTOS_FULLNODE_URL is not set.',
      action: 'Set SHELBY_APTOS_FULLNODE_URL=https://api.testnet.aptoslabs.com/v1 in .env.local.',
    });
  } else if (!isValidUrl(aptosFullnodeUrl)) {
    addCheck({
      id: 'aptos-fullnode-url-invalid',
      status: 'FAIL',
      message: `SHELBY_APTOS_FULLNODE_URL has an invalid URL format.`,
      action: 'Ensure it is a valid https:// URL.',
    });
  } else if (isShelbynetUrl(aptosFullnodeUrl) && aptosNetwork === 'testnet') {
    addCheck({
      id: 'aptos-fullnode-shelbynet-mix',
      status: 'WARN',
      message: `SHELBY_APTOS_FULLNODE_URL contains "shelbynet" but APTOS_NETWORK="testnet" — endpoint family mismatch.`,
      action: 'Use the Aptos testnet fullnode URL with APTOS_NETWORK=testnet.',
    });
  } else {
    addCheck({
      id: 'aptos-fullnode-url',
      status: 'PASS',
      message: `SHELBY_APTOS_FULLNODE_URL="${aptosFullnodeUrl}"`,
    });
  }

  // SHELBY_INDEXER_URL
  const indexerUrl = env.SHELBY_INDEXER_URL ?? '';
  if (!indexerUrl) {
    addCheck({
      id: 'shelby-indexer-url-missing',
      status: 'FAIL',
      message: 'SHELBY_INDEXER_URL is not set.',
      action: 'Set SHELBY_INDEXER_URL=https://api.testnet.aptoslabs.com/v1/graphql in .env.local.',
    });
  } else if (!isValidUrl(indexerUrl)) {
    addCheck({
      id: 'shelby-indexer-url-invalid',
      status: 'FAIL',
      message: `SHELBY_INDEXER_URL has an invalid URL format.`,
      action: 'Ensure it is a valid https:// URL.',
    });
  } else if (isShelbynetUrl(indexerUrl) && shelbyNetwork === 'testnet') {
    addCheck({
      id: 'shelby-indexer-shelbynet-mix',
      status: 'WARN',
      message: `SHELBY_INDEXER_URL contains "shelbynet" but SHELBY_NETWORK="testnet" — endpoint family mismatch.`,
      action: 'Use the Aptos testnet indexer URL when targeting Shelby testnet.',
    });
  } else {
    addCheck({
      id: 'shelby-indexer-url',
      status: 'PASS',
      message: `SHELBY_INDEXER_URL="${indexerUrl}"`,
    });
  }

  // ── Browser-side (NEXT_PUBLIC_) configuration ──────────────────────────────────

  addCheck({ id: 'testnet-nextpublic-header', status: 'INFO', message: '── Browser-side (NEXT_PUBLIC_) configuration ──' });

  // NEXT_PUBLIC_SHELBY_NETWORK
  const nextPublicNetwork = env.NEXT_PUBLIC_SHELBY_NETWORK ?? '';
  if (!nextPublicNetwork) {
    addCheck({
      id: 'nextpublic-shelby-network-missing',
      status: 'FAIL',
      message: 'NEXT_PUBLIC_SHELBY_NETWORK is not set.',
      action: 'Set NEXT_PUBLIC_SHELBY_NETWORK=testnet in .env.local.',
    });
  } else {
    addCheck({
      id: 'nextpublic-shelby-network',
      status: 'PASS',
      message: `NEXT_PUBLIC_SHELBY_NETWORK="${nextPublicNetwork}"`,
    });
  }

  // Warn if server SHELBY_NETWORK and browser NEXT_PUBLIC_SHELBY_NETWORK disagree
  if (shelbyNetwork && nextPublicNetwork && shelbyNetwork !== nextPublicNetwork) {
    addCheck({
      id: 'network-label-disagree',
      status: 'WARN',
      message: `Server-side SHELBY_NETWORK="${shelbyNetwork}" and browser-side NEXT_PUBLIC_SHELBY_NETWORK="${nextPublicNetwork}" disagree.`,
      detail:
        'These should match. A mismatch means the browser SDK may connect to a different network than the server adapter expects.',
      action: 'Set both to the same value (e.g. "testnet").',
    });
  }

  // NEXT_PUBLIC_SHELBY_RPC_URL
  const nextPublicRpcUrl = env.NEXT_PUBLIC_SHELBY_RPC_URL ?? '';
  if (!nextPublicRpcUrl) {
    addCheck({
      id: 'nextpublic-shelby-rpc-url-missing',
      status: 'FAIL',
      message: 'NEXT_PUBLIC_SHELBY_RPC_URL is not set.',
      detail: 'Required for the browser wallet upload path (useShelbyUpload hook).',
      action: 'Set NEXT_PUBLIC_SHELBY_RPC_URL=https://api.testnet.shelby.xyz/shelby in .env.local.',
    });
  } else if (!isValidUrl(nextPublicRpcUrl)) {
    addCheck({
      id: 'nextpublic-shelby-rpc-url-invalid',
      status: 'FAIL',
      message: `NEXT_PUBLIC_SHELBY_RPC_URL has an invalid URL format.`,
    });
  } else {
    addCheck({
      id: 'nextpublic-shelby-rpc-url',
      status: 'PASS',
      message: `NEXT_PUBLIC_SHELBY_RPC_URL="${nextPublicRpcUrl}"`,
    });
  }

  // Warn if server and browser RPC URLs disagree (not identical — that would be a config mistake)
  if (shelbyRpcUrl && nextPublicRpcUrl && shelbyRpcUrl !== nextPublicRpcUrl) {
    addCheck({
      id: 'rpc-url-server-browser-disagree',
      status: 'WARN',
      message: `Server SHELBY_RPC_URL and browser NEXT_PUBLIC_SHELBY_RPC_URL point to different hosts.`,
      detail: `Server: "${shelbyRpcUrl}" | Browser: "${nextPublicRpcUrl}". ` +
        'This could cause operations to hit different endpoints depending on which path executes.',
      action: 'Confirm both should be the same Shelby RPC endpoint.',
    });
  }

  // NEXT_PUBLIC_SHELBY_INDEXER_URL
  const nextPublicIndexerUrl = env.NEXT_PUBLIC_SHELBY_INDEXER_URL ?? '';
  if (!nextPublicIndexerUrl) {
    addCheck({
      id: 'nextpublic-shelby-indexer-url-missing',
      status: 'FAIL',
      message: 'NEXT_PUBLIC_SHELBY_INDEXER_URL is not set.',
      action: 'Set NEXT_PUBLIC_SHELBY_INDEXER_URL to the Shelby-aliased indexer URL in .env.local.',
    });
  } else if (!isValidUrl(nextPublicIndexerUrl)) {
    addCheck({
      id: 'nextpublic-shelby-indexer-url-invalid',
      status: 'FAIL',
      message: `NEXT_PUBLIC_SHELBY_INDEXER_URL has an invalid URL format.`,
    });
  } else {
    addCheck({
      id: 'nextpublic-shelby-indexer-url',
      status: 'PASS',
      message: `NEXT_PUBLIC_SHELBY_INDEXER_URL="${nextPublicIndexerUrl}"`,
    });
  }

  // NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS
  const expirationHours = env.NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS ?? '';
  if (!expirationHours) {
    addCheck({
      id: 'nextpublic-expiration-hours-missing',
      status: 'FAIL',
      message: 'NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS is not set.',
      action: 'Set NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=24 in .env.local.',
    });
  } else if (!isPositiveInteger(expirationHours)) {
    addCheck({
      id: 'nextpublic-expiration-hours-invalid',
      status: 'FAIL',
      message: `NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS="${expirationHours}" is not a positive integer.`,
      action: 'Set it to a positive number of hours (e.g. 24).',
    });
  } else {
    addCheck({
      id: 'nextpublic-expiration-hours',
      status: 'PASS',
      message: `NEXT_PUBLIC_SHELBY_EXPIRATION_HOURS=${expirationHours} hours`,
    });
  }

  // ── Smoke harness reminder ────────────────────────────────────────────────────

  addCheck({
    id: 'smoke-harness-info',
    status: 'INFO',
    message: 'After a manual browser-wallet upload, run the smoke retrieval check:',
    detail:
      'SHELBY_SMOKE=true SHELBY_RPC_URL=<url> SHELBY_NETWORK=testnet ' +
      'SHELBY_SMOKE_ACCOUNT_ADDRESS=<addr> SHELBY_SMOKE_BLOB_NAME=<name> npm run smoke',
    action: 'See docs/c3-smoke-test-guide.md and docs/shelby-testnet-operator-runbook.md for the full manual path.',
  });
}

// ── Aggregate result ───────────────────────────────────────────────────────────

const failCount = checks.filter((c) => c.status === 'FAIL').length;
const warnCount = checks.filter((c) => c.status === 'WARN').length;
const passCount = checks.filter((c) => c.status === 'PASS').length;

const overallStatus = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'PASS_WITH_WARNINGS' : 'PASS';

// ── Output ─────────────────────────────────────────────────────────────────────

if (jsonMode) {
  // Machine-readable JSON output
  const output = {
    doctorVersion: '1',
    timestamp: new Date().toISOString(),
    mode: shelbyMode,
    overallStatus,
    summary: { pass: passCount, warn: warnCount, fail: failCount },
    checks,
  };
  console.log(JSON.stringify(output, null, 2));
} else {
  // Human-readable output
  const STATUS_ICON = {
    PASS: '✓',
    WARN: '~',
    FAIL: '✗',
    INFO: '·',
    SKIP: '·',
  };

  console.log('');
  console.log('[shelby-doctor] ── Shelby Readiness Doctor ────────────────────────────────');
  console.log(`  Mode         : ${shelbyMode}`);
  console.log(`  Timestamp    : ${new Date().toISOString()}`);
  console.log('');

  for (const check of checks) {
    const icon = STATUS_ICON[check.status] ?? '?';
    const prefix = `  ${icon} [${check.status.padEnd(4)}] `;
    console.log(`${prefix}${check.message}`);
    if (check.detail && (check.status === 'FAIL' || check.status === 'WARN' || check.status === 'INFO')) {
      for (const line of check.detail.split('\n')) {
        console.log(`         ${line}`);
      }
    }
    if (check.action) {
      console.log(`         Action: ${check.action}`);
    }
  }

  console.log('');
  console.log('[shelby-doctor] ── Summary ─────────────────────────────────────────────────');
  console.log(`  Passed : ${passCount}`);
  if (warnCount > 0) console.log(`  Warnings: ${warnCount}`);
  if (failCount > 0) console.log(`  Failed  : ${failCount}`);
  console.log(`  Overall : ${overallStatus}`);
  console.log('');

  if (failCount > 0) {
    console.error('[shelby-doctor] FAIL — fix errors above before attempting a real testnet operation.');
    console.error('  See docs/shelby-testnet-operator-runbook.md for setup instructions.');
  } else if (warnCount > 0 && isTestnet) {
    console.log('[shelby-doctor] PASS (with warnings) — review warnings above before uploading.');
  } else if (isTestnet) {
    console.log('[shelby-doctor] PASS — testnet config looks complete. Run preflight steps before upload.');
    console.log('  See docs/shelby-testnet-operator-runbook.md for the manual upload path.');
  } else {
    console.log('[shelby-doctor] PASS — mock/local mode is ready. No credentials needed.');
    console.log('  Real upload is disabled. To enable: SHELBY_MODE=testnet npm run shelby-doctor');
  }

  console.log('[shelby-doctor] ────────────────────────────────────────────────────────────');
  console.log('');
}

process.exit(failCount > 0 ? 1 : 0);
