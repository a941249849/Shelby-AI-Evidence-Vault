/**
 * Build the public testnet handoff summary copied from /testnet.
 *
 * The output is intentionally plain JSON: it should be readable by community
 * reviewers, easy to paste into an issue, and deterministic enough for the
 * release-candidate verifier to assert the product contract.
 */

function route(origin, path) {
  return origin ? `${origin}${path}` : path;
}

function canSmoke(blob) {
  return Boolean(blob.accountAddress && blob.blobName);
}

export function buildTestnetHandoffSummary(input) {
  const origin = input.origin ?? '';
  const proofBlobs =
    input.session.latestReceiptBlobs.length > 0
      ? input.session.latestReceiptBlobs
      : input.session.blobs;
  const smokeCommands = proofBlobs.filter(canSmoke).map((blob) => ({
    blobId: blob.id,
    command: `SHELBY_SMOKE=true SHELBY_SMOKE_ACCOUNT_ADDRESS=${blob.accountAddress} SHELBY_SMOKE_BLOB_NAME=${blob.blobName} npm run smoke`,
  }));

  return {
    product: 'Shelby AI Evidence Vault',
    milestone: 'X15 public testnet handoff artifact',
    generatedAt: new Date().toISOString(),
    runtimeMode: input.mode,
    ledgerSource: input.session.source,
    routes: {
      testnetConsole: route(origin, '/testnet'),
      upload: route(origin, '/upload'),
      dashboard: route(origin, '/dashboard'),
    },
    wallet: {
      ready: input.walletReady,
      accountAddress: input.accountAddress,
      network: input.walletNetwork,
    },
    latestReceipt: input.session.latestReceipt
      ? {
          id: input.session.latestReceipt.id,
          runId: input.session.latestReceipt.runId,
          timestamp: input.session.latestReceipt.timestamp,
          receiptMode: input.session.latestReceipt.receiptMode,
          url: route(origin, `/read-receipt/${input.session.latestReceipt.id}`),
        }
      : null,
    blobs: proofBlobs.map((blob) => ({
      id: blob.id,
      shelbyRef: blob.shelbyRef,
      accountAddress: blob.accountAddress,
      blobName: blob.blobName,
      network: blob.network,
      storageStatus: blob.storageStatus,
      explorerUrl: blob.explorerUrl,
      retrievalUrl: blob.retrievalUrl,
      url: route(origin, `/blob/${blob.id}`),
    })),
    smokeCommands,
    acceptanceStatus: {
      runtimeModeReady: input.mode === 'testnet',
      walletReady: input.walletReady,
      testnetReceiptPresent: Boolean(input.session.latestReceipt),
      testnetBlobPresent: proofBlobs.length > 0,
      smokeCommandReady: smokeCommands.length > 0,
    },
    acceptancePath: [
      'connect Aptos Testnet wallet',
      'upload evidence through Shelby browser-wallet flow',
      'verify Blob detail proof panel',
      'verify receipt-level testnet audit panel',
      'optionally run npm run smoke with accountAddress/blobName',
    ],
  };
}
