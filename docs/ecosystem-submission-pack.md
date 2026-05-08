# Ecosystem Submission Pack — Shelby AI Evidence Vault

Date: 2026-05-08
Milestone: M5 — Public Ecosystem Package

---

## English Positioning

**Shelby AI Evidence Vault** is a verifiable evidence storage and read-receipt demo for AI agents, built on Shelby testnet. It demonstrates how AI pipelines can store datasets, agent run outputs, and documents with cryptographic provenance — and produce auditable receipts that trace every query back to the evidence that informed it.

It ships as a complete, runnable open-source demo. Local mock mode works with zero configuration. A browser-wallet Shelby testnet upload path is available for operators with funded wallets. An opt-in smoke harness verifies RPC connectivity and blob retrieval against the live testnet.

**What it is:**
- A public demo of AI evidence storage using Shelby blob references and on-chain registration
- An evidence pack model: grouped blobs with metadata, tags, provenance, and status
- An audit trail: read receipts that bind to real BlobRecord identity (hash, shelbyRef, accountAddress, blobName, network, storageStatus)
- A practical reference for teams integrating Shelby testnet into AI workflows

**What it is not:**
- Not a marketplace or dataset trading platform
- Not a token or tokenomics model
- Not a production database or authentication system
- Not a real AI agent framework or LLM integration
- Not a private key custody solution
- No server signer — the browser wallet signs transactions

---

## 中文定位（Chinese Positioning）

**Shelby AI 证据库（Shelby AI Evidence Vault）** 是一个面向 AI 智能体的可验证证据存储与读取收据演示项目，构建于 Shelby 测试网之上。它展示了 AI 流水线如何通过密码学证明来存储数据集、智能体运行产出及文档，并生成可审计的收据，将每一次查询与所依据的证据关联起来。

该项目作为完整的、可运行的开源演示发布。本地模拟模式无需任何配置即可使用。对于拥有充值钱包的运营方，也提供了通过浏览器钱包上传至 Shelby 测试网的路径。此外还提供了一个可选的冒烟测试工具，用于验证 RPC 连通性和 Blob 检索。

**产品定位：**
- 使用 Shelby Blob 引用和链上注册的 AI 证据存储公开演示
- 证据包模型：包含元数据、标签、来源及状态的 Blob 集合
- 审计追踪：读取收据绑定真实 BlobRecord 身份（哈希值、shelbyRef、账户地址、Blob 名称、网络、存储状态）
- 为将 Shelby 测试网集成到 AI 工作流的团队提供实践参考

**明确不包含：**
- 不包含市场交易或数据集交易功能
- 不涉及代币或代币经济模型
- 不包含生产级数据库或认证系统
- 不包含真正的 AI 智能体框架或大语言模型集成
- 不包含私钥托管解决方案
- 无服务端签名者——交易由浏览器钱包签名

---

## 30-Second Elevator Pitch

AI agents make decisions based on data — but how do you prove which data they used, and that it hasn't been tampered with? Shelby AI Evidence Vault gives every dataset and agent output a cryptographic identity on Shelby testnet, and produces auditable read receipts that trace every answer back to its evidence. Local mock mode works in under a minute with no setup. Operators with a funded Aptos testnet wallet can upload real blobs today.

---

## 3-Minute Demo Narrative

**Opening — the problem (30 seconds)**

AI systems are becoming decision-makers in consequential domains. But when an AI system gives you an answer, can you tell which dataset it used? Can you verify that dataset hasn't changed? Can you produce an audit trail that a regulator or counterparty would accept? Today, most AI pipelines have no answer. That's the gap Shelby AI Evidence Vault addresses.

**Core demo — local mock (60 seconds)**

Clone the repo, run `npm install && npm run dev`, and open `http://localhost:3000`. No accounts, no API keys, no wallet. Navigate to `/upload`, drop in a file, and within seconds you have:

- A SHA-256 hash computed in your browser
- A `shelby://mock/blob/{id}` reference — a deterministic local identity
- An evidence pack persisted to localStorage
- A read receipt with the blob's identity surface, auto-generated and linked on the success screen

Refresh the page. Navigate to `/read-receipt/local-rr-{uuid}`. The receipt resolves. Blob hash, source, and Shelby ref are all there. That's the audit trail, working locally, zero infrastructure.

**Testnet path — operator demo (60 seconds)**

For operators with a funded Aptos testnet wallet: set `SHELBY_MODE=testnet` and `NEXT_PUBLIC_SHELBY_NETWORK=testnet`, start the dev server, connect Petra wallet on Aptos Testnet, and upload. The upload uses `@shelby-protocol/react` `useUploadBlobs` — the browser wallet signs the transaction. On success you get a real `shelby://testnet/{account}/{blobName}` reference, a `storageStatus: registered`, and an explorer URL. Run `npm run smoke` with the returned address and blobName to verify retrieval from the Shelby RPC.

**Read receipts — the audit trail (30 seconds)**

Every upload — mock or testnet — creates a read receipt that binds to real BlobRecord identity. The receipt page shows the blob's Shelby ref, hash, data-source badge, account address (testnet), network, and storage status. Receipts survive refresh. A real AI agent can produce the same receipts for every query it answers. That's the evidence chain.

---

## Current Milestone Matrix

| Milestone | Status | Description |
|---|---|---|
| M0 | Merged | Project scaffold, Next.js 16, Tailwind v4, demo data, read receipt pages |
| M1A | Merged | Official Shelby docs audit and integration research |
| M1B | Merged | Local mock upload, dual-mode adapter, localStorage persistence, SHA-256 in-browser |
| M2 design | Merged | Shelby testnet integration design spike (docs/m2-shelby-testnet-integration-design.md) |
| M3 | Merged | Browser-wallet Shelby testnet upload path: use-shelby-upload, browser-client, providers |
| C3 smoke | Merged | Opt-in smoke harness (npm run smoke), status-map.ts, c3-smoke-test-guide.md |
| M4 | Merged | Read receipt binding to BlobRecord identity, ReadReceiptClient, localStorage receipt persistence |
| M5 | Current | Public ecosystem package: README rewrite, demo script update, architecture update, this document, production queue update |

---

## Known Operator Prerequisites (testnet upload)

The following are required for a real Shelby testnet upload and are not provided by this demo:

| Prerequisite | Notes |
|---|---|
| Aptos browser wallet | e.g. [Petra](https://petra.app/) on Aptos Testnet |
| Testnet APT | From [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet) for transaction gas fees |
| Shelby storage credits | ShelbyUSD or SHEL tokens on the connected account |
| `NEXT_PUBLIC_SHELBY_NETWORK=testnet` | In `.env.local` |
| `SHELBY_MODE=testnet` | In `.env.local` (activates testnet UI path) |
| Manual browser session | `@shelby-protocol/react` hook requires interactive wallet — cannot be run in CI |

CI does not run real uploads. All real-upload paths are operator-dependent. See `docs/c3-smoke-test-guide.md`.

---

## What Is Explicitly Out of Scope

- **No trading or marketplace.** No dataset trading, no NFT minting, no exchange integration.
- **No token speculation.** No tokenomics modeling, no price data, no yield strategies.
- **No production database.** localStorage only. A real backend is a future operator decision.
- **No authentication system.** No user accounts, no session management, no OAuth.
- **No real LLM/AI calls.** Read receipt answer summaries are deterministic placeholders — no API calls to any AI provider.
- **No private key custody.** No server signer, no seed phrase handling, no mnemonic anywhere in the codebase.
- **No wallet payment UX.** No token purchase flow, no APT/SHEL purchase UI.
- **No social posting.** No automated posting to Twitter/X, Discord, or any other platform.
- **No production deployment.** This is a local demo. Production hosting is an operator decision.
- **No UI redesign in this milestone.** UI improvements are a Codex task (X2) deferred until protocol boundaries stabilize.

---

## Key Links

| Resource | Path / URL |
|---|---|
| README | `README.md` |
| Architecture | `docs/architecture.md` |
| Demo script | `docs/demo-script.md` |
| Production queue | `docs/production-queue.md` |
| Smoke test guide | `docs/c3-smoke-test-guide.md` |
| M4 read receipt binding | `docs/m4-read-receipt-binding.md` |
| M2–M4 architecture plan | `docs/m2-m4-product-architecture-plan.md` |
| M2 integration design | `docs/m2-shelby-testnet-integration-design.md` |
| GitHub repository | https://github.com/a941249849/Shelby-AI-Evidence-Vault |
| Upload page | `/upload` |
| Dashboard | `/dashboard` |
| Demo receipt | `/read-receipt/rr-001` |
| Demo blob | `/blob/blob-001` |
