# Product Experience Stage

This stage turns the Shelby AI Evidence Vault from a set of working pages into
a coherent public testnet product candidate.

## Scope

The product experience must present one continuous path:

1. Prepare wallet and testnet readiness.
2. Create an evidence pack.
3. Register files as Shelby testnet Blobs.
4. Inspect the evidence registry.
5. Verify Blob and read-receipt proof.

## Page Responsibilities

| Surface | Responsibility |
| --- | --- |
| Home | Product entry, current testnet proof, and Shelby ecosystem positioning. |
| Testnet | Runtime readiness, wallet readiness, latest community session, and operator acceptance. |
| Upload | Core action surface for packaging evidence and registering Shelby testnet Blobs. |
| Registry | Evidence inventory, user/testnet records, current proof, and discovery filters. |
| Blob detail | Single-object proof inspection and retrieval verification. |
| Read receipt | Answer-level provenance and grouped testnet verification. |

## Acceptance Criteria

- The global product path is visible on every product surface.
- A real testnet upload appears outside the success page, especially on Home and Registry.
- Upload explains its current operational state without duplicating onboarding content.
- Footer and runtime labels reflect the actual configured mode.
- Mock/demo records remain visibly distinct from Shelby testnet records.
- `npm run lint`, `npm run build`, and `npm run final-readiness` must pass before handoff.

## Current Boundary

This is still a public testnet candidate. It does not claim mainnet storage, does
not custody keys, and does not include token purchase, payment, trading, or
marketplace surfaces.
