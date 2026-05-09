# Final Product Acceptance — Shelby AI Evidence Vault

Date: 2026-05-09
Status: X4 final acceptance package

This document is the final manual acceptance pass for the current community experiment candidate.

## Product shape

Shelby AI Evidence Vault is a Shelby ecosystem application layer for AI evidence provenance.

The product flow is:

```txt
Source file / dataset / agent output
  -> Evidence Pack
  -> Shelby Blob identity
  -> Read Receipt
  -> auditable AI evidence memory
```

The default path is **Mock + SQLite** so community testers can inspect the full product without credentials. The real protocol proof path is **Shelby testnet browser-wallet upload**, which requires operator wallet/funding prerequisites.

## Routes to inspect

| Route | Acceptance target |
|---|---|
| `/` | Chinese-first product home with Shelby ecosystem positioning, evidence-flow board, core capability cards, product preview, developer band |
| `/dashboard` | Evidence registry with demo/local/SQLite records, search, filter, sort, local workspace, evidence cards |
| `/upload` | Evidence intake flow with pack metadata, file hash computation, Mock + SQLite boundary, testnet wallet gating |
| `/blob/blob-001` | Blob provenance inspector with Shelby ref, hash, source, size, MIME type, evidence pack link, tags |
| `/read-receipt/rr-001` | Read receipt with query, answer summary, run metadata, referenced blob identity, evidence pack link |
| `/read-receipt/c8-rr-agent-sentinel-v1` | Deterministic C8 agent-run receipt after `npm run generate-agent-run` |

## Language acceptance

- Default UI language is Chinese.
- Top navigation language toggle switches the product surface to English.
- The core product routes remain usable in both languages.
- Protocol identifiers and technical field names may remain English where they are literal field names or SDK concepts.

## Automated gate

Run from a clean main branch:

```bash
npm run lint
npm run build
npm run verify-release-candidate
```

Expected:

- `lint` exits 0.
- `build` exits 0.
- `verify-release-candidate` exits 0 with `Passed: 20`, `Failed: 0`, `Skipped: 0`.

## Manual product QA

1. Start the app:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`.
3. Inspect the home page at desktop width.
4. Toggle English and Chinese once from the top nav.
5. Visit `/dashboard`, search `benchmark`, clear filters, and confirm cards remain visible.
6. Visit `/upload`, add metadata, select a small local file, confirm SHA-256 appears, and save locally.
7. Open the generated blob detail link.
8. Open the generated read receipt link.
9. Refresh the receipt page and confirm it still resolves.
10. Run `npm run generate-agent-run`, then open `/read-receipt/c8-rr-agent-sentinel-v1`.

## Boundaries that must remain clear

- Mock refs are local demonstration identifiers, not Shelby mainnet claims.
- Demo refs are illustrative built-in examples.
- Testnet upload is opt-in and wallet-gated.
- No private keys, seed phrases, or server signer are handled by the app.
- No real LLM calls are performed.
- No marketplace, token, payment, trading, or dataset-sale behavior is present.
- Local SQLite is a community experiment persistence layer, not a production database.

## Final acceptance statement

The product is ready for community experiment review when:

- The automated gate is green.
- The manual product QA path above passes.
- The reviewer understands the distinction between Mock + SQLite preview and Shelby testnet proof.
- No page presents the product as mainnet, production-hosted, or custody-bearing.
