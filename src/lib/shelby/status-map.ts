/**
 * Evidence storage status mapping utilities.
 *
 * Maps raw SDK/RPC results to the app's stable evidence status fields.
 * States are conservative — never overclaim success.
 *
 * App-facing storage status values:
 *   'registered' — on-chain commitment recorded; storage upload initiated
 *   'ready'      — blob confirmed retrievable via Shelby RPC (HTTP 200)
 *   'failed'     — upload or registration failed with a clear error
 *   'unknown'    — SDK/RPC did not return enough proof to determine status
 *
 * Design notes:
 * - @shelby-protocol/react v2.0.0 useUploadBlobs() returns void on success.
 *   transactionHash and commitmentRoot are therefore not available from the
 *   React hook path. Do not invent these fields.
 * - Only promote to 'ready' when a retrieval HTTP 200 confirms the blob exists.
 * - On timeout or network error, always fall back to 'unknown'.
 */

export type EvidenceStorageStatus = 'registered' | 'ready' | 'failed' | 'unknown';

/**
 * Maps an HTTP response status code from a Shelby RPC retrieval request
 * to a stable evidence storage status.
 *
 * Conservative mapping:
 *   200           → 'ready'     (blob confirmed retrievable)
 *   404           → 'unknown'   (may not have propagated yet)
 *   401/403       → 'unknown'   (blob may exist but require auth)
 *   4xx (other)   → 'failed'    (client-level error)
 *   5xx           → 'unknown'   (server-side; do not infer failure)
 */
export function mapHttpStatusToStorageStatus(httpStatus: number): EvidenceStorageStatus {
  if (httpStatus === 200) return 'ready';
  if (httpStatus === 404) return 'unknown';
  if (httpStatus === 401 || httpStatus === 403) return 'unknown';
  if (httpStatus >= 400 && httpStatus < 500) return 'failed';
  // 5xx or unexpected: do not assert failure; the RPC may be temporarily unavailable
  return 'unknown';
}

/**
 * Maps the outcome of a @shelby-protocol/react useUploadBlobs() call
 * to a storage status.
 *
 * The React hook returns void on success, so the highest-confidence claim
 * is 'registered' (not 'ready'). Promote to 'ready' only after a successful
 * retrieval check via mapRetrievalCheckToStorageStatus().
 */
export function mapHookUploadToStorageStatus(success: boolean): EvidenceStorageStatus {
  return success ? 'registered' : 'failed';
}

/**
 * Maps a retrieval check result to a storage status.
 * Only returns 'ready' when an HTTP 200 is confirmed.
 */
export function mapRetrievalCheckToStorageStatus(
  retrievalOk: boolean,
  httpStatus?: number
): EvidenceStorageStatus {
  if (retrievalOk && httpStatus === 200) return 'ready';
  if (httpStatus !== undefined) return mapHttpStatusToStorageStatus(httpStatus);
  return 'unknown';
}

/**
 * Returns a human-readable label for a storage status value.
 */
export function storageStatusLabel(status: EvidenceStorageStatus): string {
  switch (status) {
    case 'registered':
      return 'Registered (on-chain commitment recorded; storage upload initiated)';
    case 'ready':
      return 'Ready (blob confirmed retrievable via Shelby RPC)';
    case 'failed':
      return 'Failed';
    case 'unknown':
      return 'Unknown (SDK did not return sufficient proof)';
  }
}
