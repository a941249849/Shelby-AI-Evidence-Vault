# Final Product Acceptance — Shelby AI Evidence Vault

Date: 2026-05-09
Status: X15 public testnet handoff acceptance package

This document is the final manual acceptance pass for the current public testnet candidate.

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

The default path is **Mock + SQLite** so community testers can inspect the product loop without credentials. The real protocol proof path is **Shelby testnet browser-wallet upload**, which requires an Aptos testnet wallet, testnet APT, ShelbyUSD, and manual signing.

## Routes to inspect

| Route | Acceptance target |
|---|---|
| `/` | Chinese-first product home with Shelby ecosystem positioning, evidence-flow board, core capability cards, product preview, developer band |
| `/testnet` | Public testnet launch console with mode status, wallet readiness, upload entry, proof steps, and a persistent community handoff summary from browser cache plus SQLite |
| `/dashboard` | Evidence registry with demo/local/SQLite/Shelby testnet records, search, filter, sort, user/testnet records, evidence cards, and first-Blob deep links |
| `/upload` | Evidence intake flow with pack metadata, file hash computation, Mock + SQLite boundary, testnet wallet gating |
| `/blob/blob-001` | Blob provenance inspector with Shelby ref, hash, source, size, MIME type, evidence pack link, tags, and protocol-proof boundary |
| `/read-receipt/rr-001` | Read receipt with query, answer summary, run metadata, referenced blob identity, evidence pack link, and receipt-level proof boundary |
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
- `verify-release-candidate` exits 0 with `Passed: 23`, `Failed: 0`, `Skipped: 0`.

## Manual product QA

1. Start the app:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`.
3. Inspect the home page at desktop width.
4. Toggle English and Chinese once from the top nav.
5. Visit `/testnet`, confirm wallet readiness, upload entry, proof steps, empty or populated community session state, and copyable handoff summary behavior.
6. Visit `/dashboard`, search `benchmark`, clear filters, then filter data source by Demo, Local, and Shelby testnet.
7. Visit `/upload`, add metadata, select a small local file, confirm SHA-256 appears, and save locally.
8. Open the generated blob detail link and confirm the proof panel states the correct mock/testnet boundary.
9. Open the generated read receipt link and confirm receipt-level proof aggregation appears with the correct mock/testnet boundary.
10. Refresh the receipt page and confirm it still resolves from SQLite.
11. Return to `/testnet` after a real testnet upload and confirm copied handoff JSON contains full route URLs, receipt/blob URLs, explorer/retrieval identity, smoke commands, and acceptance-status flags.
12. Save the copied handoff JSON locally and run `npm run verify-testnet-handoff -- path/to/handoff.json`.
13. Run `npm run generate-agent-run`, then open `/read-receipt/c8-rr-agent-sentinel-v1`.

## Boundaries that must remain clear

- Mock refs are local demonstration identifiers, not Shelby mainnet claims.
- Demo refs are illustrative built-in examples.
- Testnet upload is opt-in, wallet-gated, and requires manual browser signing.
- No private keys, seed phrases, or server signer are handled by the app.
- No real LLM calls are performed.
- No marketplace, token, payment, trading, or dataset-sale behavior is present.
- Local SQLite plus browser cache is the current community experiment persistence layer, not a hosted production database.

## Final acceptance statement

The product is ready for community experiment review when:

- The automated gate is green.
- The manual product QA path above passes.
- The final Copilot review brief returns `merge-ready` or `needs-real-testnet-run` without code blockers.
- The reviewer understands the distinction between Mock + SQLite preview, browser-cache fallback, and Shelby testnet proof.
- No page presents the product as mainnet, production-hosted, or custody-bearing.
