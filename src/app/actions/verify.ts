'use server';

export interface VerifyShelbyRetrievalInput {
  accountAddress?: string;
  blobName?: string;
  retrievalUrl?: string;
}

export interface VerifyShelbyRetrievalResult {
  checked: boolean;
  ok: boolean;
  httpStatus: number | null;
  retrievalUrl: string | null;
  contentType: string | null;
  contentLength: string | null;
  checkedAt: string;
  detail: string;
}

const ALLOWED_RETRIEVAL_HOSTS = new Set(['api.testnet.shelby.xyz']);
const DEFAULT_TESTNET_RPC_URL = 'https://api.testnet.shelby.xyz/shelby';

function encodeBlobNamePath(blobName: string): string {
  return blobName.split('/').map(encodeURIComponent).join('/');
}

function buildShelbyRetrievalUrl(
  rpcBaseUrl: string,
  accountAddress: string,
  blobName: string
): string {
  const base = rpcBaseUrl.replace(/\/$/, '');
  return `${base}/v1/blobs/${accountAddress}/${encodeBlobNamePath(blobName)}`;
}

function getAllowedHosts(): Set<string> {
  const hosts = new Set(ALLOWED_RETRIEVAL_HOSTS);
  const configuredRpc = process.env.SHELBY_RPC_URL || process.env.NEXT_PUBLIC_SHELBY_RPC_URL;

  if (configuredRpc) {
    try {
      const url = new URL(configuredRpc);
      if (url.protocol === 'https:') hosts.add(url.hostname);
    } catch {
      // Ignore invalid operator config here; shelby-doctor owns config validation.
    }
  }

  return hosts;
}

function resolveRetrievalUrl(input: VerifyShelbyRetrievalInput): string | null {
  if (input.retrievalUrl) {
    return input.retrievalUrl;
  }

  if (!input.accountAddress || !input.blobName) {
    return null;
  }

  const rpcUrl = process.env.SHELBY_RPC_URL || DEFAULT_TESTNET_RPC_URL;
  return buildShelbyRetrievalUrl(rpcUrl, input.accountAddress, input.blobName);
}

function assertSafeRetrievalUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') {
    throw new Error('Retrieval URL must use https.');
  }
  if (!getAllowedHosts().has(url.hostname)) {
    throw new Error(`Retrieval host is not allowed: ${url.hostname}`);
  }
  if (!url.pathname.includes('/v1/blobs/')) {
    throw new Error('Retrieval URL must point to a Shelby blob retrieval path.');
  }
  return url;
}

export async function verifyShelbyRetrievalAction(
  input: VerifyShelbyRetrievalInput
): Promise<VerifyShelbyRetrievalResult> {
  const checkedAt = new Date().toISOString();
  const retrievalUrl = resolveRetrievalUrl(input);

  if (!retrievalUrl) {
    return {
      checked: false,
      ok: false,
      httpStatus: null,
      retrievalUrl: null,
      contentType: null,
      contentLength: null,
      checkedAt,
      detail: 'Missing accountAddress/blobName or retrievalUrl.',
    };
  }

  try {
    const url = assertSafeRetrievalUrl(retrievalUrl);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Range: 'bytes=0-0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    const ok = response.status >= 200 && response.status < 300;
    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length') ?? contentRange;
    const contentType = response.headers.get('content-type');

    return {
      checked: true,
      ok,
      httpStatus: response.status,
      retrievalUrl: url.toString(),
      contentType,
      contentLength,
      checkedAt,
      detail: ok
        ? 'Shelby retrieval endpoint responded successfully.'
        : `Shelby retrieval endpoint returned HTTP ${response.status}.`,
    };
  } catch (err) {
    return {
      checked: true,
      ok: false,
      httpStatus: null,
      retrievalUrl,
      contentType: null,
      contentLength: null,
      checkedAt,
      detail: err instanceof Error ? err.message : 'Unknown retrieval verification error.',
    };
  }
}
