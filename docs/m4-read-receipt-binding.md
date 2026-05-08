# M4: Read Receipt — BlobRecord Identity Binding

Date: 2026-05-08

## Overview

M4 makes read receipts first-class evidence objects by binding them to real `BlobRecord` identity, rather than carrying only raw blob ID strings. A receipt now resolves its referenced blobs from built-in demo data or browser-local localStorage, and the receipt page exposes the full lineage surface for each blob.

## Model

### `ReadReceipt` (src/lib/demo-data/read-receipts.ts)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable ID. Demo receipts use `rr-NNN`. Local receipts use `local-rr-{uuid}`. |
| `runId` | `string` | Logical run identifier. Upload receipts use `upload-{packId}`. |
| `query` | `string` | User prompt or upload description. |
| `answerSummary` | `string` | Summary text. Upload receipts use a deterministic placeholder — no LLM call. |
| `referencedBlobIds` | `string[]` | Blob IDs. Resolved to full `BlobRecord` objects at display time. |
| `evidencePackIds` | `string[]` | Pack IDs. Resolved to full `EvidencePack` objects at display time. |
| `timestamp` | `string` | ISO 8601. |
| `agentVersion` | `string` | Identifies the agent or tool. Upload receipts use `shelby-vault/upload`. |
| `receiptMode` | `'demo' \| 'local' \| 'shelby-testnet' \| undefined` | **New in M4.** Undefined = demo data (backward compatible). `'local'` = mock browser upload. `'shelby-testnet'` = real Shelby testnet upload. |

### `BlobRecord` identity fields shown in receipt (existing, surfaced in M4)

| Field | When present |
|---|---|
| `shelbyRef` | Always |
| `hash` | Always |
| `source` | Always |
| `dataSource` badge | Distinguishes demo / local mock / Shelby testnet |
| `accountAddress` | Real testnet uploads only |
| `blobName` | Real testnet and local mock uploads |
| `network` | Local and testnet uploads |
| `storageStatus` | Real testnet uploads (from Shelby RPC) |
| `explorerUrl` | Real testnet uploads |
| `retrievalUrl` | Real testnet uploads |

## localStorage keys

| Key | Content |
|---|---|
| `shelby_vault_packs` | `EvidencePack[]` — local uploads |
| `shelby_vault_blobs` | `BlobRecord[]` — local uploads |
| `shelby_vault_receipts` | `ReadReceipt[]` — **New in M4** |

All three keys are cleared by `resetLocalData()`.

## Receipt creation flow

```
User submits upload form
  → buildEvidencePack()        — creates EvidencePack with local-pack-{uuid}
  → per-file: buildBlobRecord() — creates BlobRecord with local-blob-{uuid}
  → addLocalPack() / addLocalBlob() — persisted to localStorage
  → ReadReceipt constructed:
      id:              local-rr-{uuid}
      referencedBlobIds: [blob.id, ...]
      evidencePackIds:   [pack.id]
      receiptMode:      'local' | 'shelby-testnet'
  → addLocalReadReceipt()      — persisted to localStorage
  → Upload success screen shows link to /read-receipt/{receiptId}
```

## Receipt resolution flow

```
/read-receipt/[id] (server shell)
  → ReadReceiptClient (client component, runs in browser)
      1. getReadReceiptById(id)         — checks demo data (rr-001 to rr-004)
      2. getLocalReadReceiptById(id)    — checks localStorage
      3. For each referencedBlobId:
           getBlobById(id)              — demo data
           || getLocalBlobById(id)      — localStorage
      4. For each evidencePackId:
           getEvidencePackById(id)      — demo data
           || getLocalPackById(id)      — localStorage
      5. Renders resolved blobs with full identity surface
```

## Manual verification steps

1. Start the dev server: `npm run dev`
2. Navigate to `/upload`.
3. Fill in a pack title, add a file (any file ≤ 5 MB), and click **Save locally**.
4. The success screen shows a **Read receipt** link. Click it.
5. Verify the receipt page loads at `/read-receipt/local-rr-{uuid}`.
6. Verify the **Referenced blobs** section shows the blob's shelbyRef, SHA-256 hash, source, and a "Local mock" badge.
7. Refresh the page. The receipt must still resolve (localStorage persistence).
8. Navigate to `/dashboard` and click **Reset local data**.
9. Revisit the receipt URL — it should show "Read receipt not found".
10. Visit `/read-receipt/rr-001` — the demo receipt must still render correctly.

## Constraints and non-goals

- No LLM is called. The `answerSummary` in upload receipts is a deterministic placeholder.
- No private key, seed phrase, or server signer is involved.
- No UI redesign was done. The receipt page uses the same design tokens as the rest of the app.
- Real Shelby testnet fields (accountAddress, explorerUrl, etc.) are displayed when present in `BlobRecord`, but are never invented when absent.
- The `receiptMode` field is optional: demo receipts never set it (undefined = backward compatible).
