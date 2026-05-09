# Builder Demo Presentation

Date: 2026-05-09
Status: X21 draft

## One-Liner

I built Shelby AI Evidence Vault as a developer demo for AI evidence provenance
on Shelby testnet.

## Short Pitch

Shelby AI Evidence Vault turns files, datasets, or agent outputs into Evidence
Packs, registers them as Shelby testnet Blobs, and creates Read Receipts that
show which evidence an AI workflow used.

This is not a production service. It is a builder demo meant to show the Shelby
team and community one possible application layer on top of Shelby Blob storage.

## Demo Link

```txt
<vercel-url>/testnet
```

## What To Try

- Open the testnet console.
- Connect an Aptos Testnet wallet.
- Upload a small evidence file.
- Inspect the generated Blob detail page.
- Inspect the generated Read Receipt page.
- Copy the handoff JSON.

## Architecture

```txt
Vercel website
  -> Neon Postgres evidence index
  -> Shelby testnet Blob storage
  -> Aptos wallet signing
```

## Boundaries

- Testnet only.
- No mainnet claim.
- No private-key custody.
- No server signer.
- No payment, trading, marketplace, or token-sale surface.
- Built as a developer showcase, not an official Shelby product.

## Feedback Wanted

- Does the evidence-pack/read-receipt flow make sense for AI agent memory?
- Is the Shelby Blob proof visible enough?
- What would make this more useful for builders?
- Any wallet, funding, upload, or retrieval issue during the testnet run?
