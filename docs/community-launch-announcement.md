# Community Launch Announcement

Date: 2026-05-09
Status: X20 draft for public testnet participation

## Short Version

Shelby AI Evidence Vault is open for public testnet experimentation.

It turns files, datasets, and AI agent outputs into Evidence Packs, registers
them as Shelby testnet Blobs, and creates Read Receipts that show which evidence
an answer or run used.

## What You Can Test

- Connect an Aptos Testnet wallet.
- Upload a small evidence file.
- Create a Shelby testnet Blob identity.
- Inspect the generated Blob proof page.
- Inspect the generated Read Receipt page.
- Copy the public testnet handoff JSON from `/testnet`.

## Requirements

- Aptos Testnet wallet.
- Testnet APT for transaction gas.
- ShelbyUSD or the current Shelby testnet storage credit requirement.
- A small file suitable for a public testnet experiment.

## Start Here

```txt
<deployment-url>/testnet
```

## Test Path

1. Open the testnet console.
2. Connect wallet.
3. Open upload.
4. Upload one small evidence file.
5. Approve the wallet transaction.
6. Open the generated Blob detail route.
7. Open the generated Read Receipt route.
8. Return to `/testnet` and copy the handoff JSON.

## What To Share Back

Please share:

- Wallet type used.
- Whether upload completed.
- Blob detail URL.
- Read Receipt URL.
- Copied handoff JSON.
- Any wallet signing, funding, or retrieval verification issue.

## Boundaries

This is a Shelby public testnet experiment, not a mainnet product launch.

The app does not custody private keys, does not include a server signer, does
not offer token purchase, payment, trading, marketplace, or dataset-sale
features, and does not claim production-hosted storage.
