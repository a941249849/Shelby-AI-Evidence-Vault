# Project Instructions

This repository is a public Shelby testnet ecosystem demo.

Product name:
Shelby AI Evidence Vault

One-sentence goal:
A verifiable evidence storage and read-receipt demo for AI agents, built on Shelby testnet.

Hard scope:
- Build a polished public web demo.
- Store AI evidence packs / dataset manifests / agent run artifacts.
- Show Shelby blob references, metadata, and read receipts.
- Keep the project reproducible for community users.

Out of scope:
- No trading execution.
- No private exchange APIs.
- No marketplace or paid dataset trading.
- No tokenomics modeling.
- No wallet fund movement.
- No production secrets.
- No complex backend unless explicitly requested.
- No full AI agent framework.
- No automatic social posting.
- No live financial advice.

Architecture rules:
- Shelby integration must be isolated in a service/adapter layer.
- UI must work with mock data if Shelby credentials are missing.
- Sample data must be safe and public.
- All secrets must use environment variables.
- No API keys, private keys, cookies, tokens, or seed phrases may be committed.
- Prefer simple local JSON or SQLite index for MVP.
- Prioritize demo clarity over infrastructure complexity.

Definition of done:
- The app runs locally.
- The README explains setup.
- Demo data is included.
- The UI is screenshot-ready.
- Tests or basic validation exist for schemas/services.
