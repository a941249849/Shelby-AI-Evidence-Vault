# Ecosystem Submission Pack — Shelby AI Evidence Vault

Date: 2026-05-09
Milestone: X15 — Public Testnet Handoff Candidate

---

## English Positioning

**Shelby AI Evidence Vault** is an AI evidence and read-receipt layer built for Shelby. It demonstrates how AI pipelines can turn datasets, agent run outputs, and documents into verifiable evidence records with Shelby Blob identity — then produce auditable receipts that trace every answer back to the evidence that informed it.

It ships as a complete, runnable open-source public testnet handoff candidate. Local mock mode works with zero configuration as a development and review fallback. The real community path starts at `/testnet`, where users can detect and connect an Aptos wallet, verify Aptos Testnet readiness, then move into the browser-wallet Shelby testnet upload flow: sign through the wallet, upload to Shelby testnet, inspect Blob identity, run an in-app retrieval verification probe, verify the generated read receipt as an aggregate audit bundle, and copy a durable session handoff for community participation. The session ledger reads both browser cache and SQLite records, and the handoff JSON includes route URLs, receipt/blob proof links, explorer/retrieval identity, smoke commands, and acceptance-status flags. An opt-in smoke harness still provides CLI-level RPC connectivity and blob retrieval verification, and the release-candidate verifier provides a one-command acceptance gate. The product surface is Chinese-first with an English toggle, matching the community-facing Shelby ecosystem positioning.

**What it is:**
- A Shelby ecosystem application layer for AI evidence storage using Shelby blob references and on-chain registration
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

**Shelby AI 证据库（Shelby AI Evidence Vault）** 是一个构建在 Shelby 之上的 AI 证据与读取回执应用层。它展示了 AI 流水线如何把数据集、智能体运行产出及文档转化为带有 Shelby Blob 身份的可验证证据记录，并生成可审计的回执，将每一次回答与所依据的证据关联起来。

该项目作为完整、可运行的持久化测试网会话账本候选版本发布。本地模拟模式无需任何配置即可使用，但它只是开发与评审 fallback；真实协议证明路径从 `/testnet` 开始，社区用户可以检测并连接 Aptos 钱包、确认 Aptos Testnet 状态，再通过浏览器钱包签名上传至 Shelby 测试网，检查 Blob 身份，运行产品内检索验证，在读取回执页面聚合验证所有引用的测试网 Blob，并复制一份可提交的持久化测试会话摘要。测试会话账本同时读取浏览器缓存与 SQLite 记录。此外还提供可选冒烟测试工具和一键验收命令，用于验证 RPC 连通性、Blob 检索和公开测试链路。产品界面默认中文，并提供英文切换，面向 Shelby 生态社区展示。

**产品定位：**
- 使用 Shelby Blob 引用和链上注册的 AI 证据应用层
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

AI agents make decisions based on data — but how do you prove which data they used, and that it hasn't been tampered with? Shelby AI Evidence Vault gives every dataset and agent output a Shelby Blob identity, then produces auditable read receipts that trace every answer back to its evidence. Local mock mode works in under a minute as a review path. The public testnet path lets community users connect an Aptos Testnet wallet and create real Shelby testnet proof.

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

**Testnet path — public participant demo (60 seconds)**

Deploy with `SHELBY_MODE=testnet` and `NEXT_PUBLIC_SHELBY_NETWORK=testnet`, open `/upload`, connect Petra wallet on Aptos Testnet, and upload. The upload uses `@shelby-protocol/react` `useUploadBlobs` — the browser wallet signs the transaction. On success you get a real `shelby://testnet/{account}/{blobName}` reference, a `storageStatus: registered`, and an explorer URL. Open the Blob detail proof panel, then open the generated read receipt and run the aggregate receipt verification. Run `npm run smoke` with the returned address and blobName for CLI-level confirmation.

**Read receipts — the audit trail (30 seconds)**

Every upload — mock or testnet — creates a read receipt that binds to real BlobRecord identity. The receipt page shows the blob's Shelby ref, hash, data-source badge, account address (testnet), network, and storage status. For Shelby testnet receipts, it also aggregates every referenced Blob into a verification panel with checked, verified, and failed states. Receipts survive refresh. A real AI agent can produce the same receipts for every query it answers. That's the evidence chain.

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
| M5 | Merged | Public ecosystem package: README rewrite, demo script update, architecture update, this document, production queue update |
| C7 | Merged | SQLite persistence for EvidencePack, BlobRecord, and ReadReceipt records |
| C8 | Merged | Deterministic agent-run evidence-pack example |
| C9 | Merged | Zero-credential community verification harness |
| C10 | Merged | Evidence registry search, filter, sort, and operator workflow hardening |
| C11 | Merged | Shelby testnet readiness doctor and operator runbook |
| C12 | Merged | Release-candidate acceptance harness and product QA gate |
| X2 | Merged | Shelby-first bilingual product UI: home, registry, upload, Blob detail, read receipt, footer |
| X3 | Merged | Product closeout docs, community experiment framing, final QA package |
| X8 | Merged | Public Shelby testnet participation path, participant docs, upload-page onboarding |
| X9 | Merged | Navigation-level `/testnet` launch console for community participation |
| X10 | Merged | Wallet readiness panel on `/testnet`: detect/connect wallet, show account and Aptos Testnet status |
| X11 | Merged | In-app testnet Blob proof verification: explorer/retrieval identity and server-side retrieval probe |
| X12 | Merged | Receipt-level testnet audit aggregation: verify all referenced Shelby testnet blobs from the read receipt |
| X13 | Merged | Community testnet session: `/testnet` aggregates latest testnet receipt/blob records and copies a participant summary |
| X14 | Merged | Persistent testnet session ledger: `/testnet` merges browser-cache and SQLite testnet receipts/blobs; `/dashboard` indexes Shelby testnet packs as first-class records |
| X15 | Merged | Public testnet handoff artifact: `/testnet` copies full route URLs, proof links, explorer/retrieval identity, smoke commands, and acceptance-status flags |
| X16 | Merged | Final Copilot review brief: fixed merge-readiness scope, gates, real-testnet path, and security boundaries |
| X17 | Merged | Copied handoff validator: `npm run verify-testnet-handoff -- path/to/handoff.json` validates real-upload handoff JSON |
| X18 | Merged | Final readiness artifact: `npm run final-readiness` separates code-candidate readiness from real testnet and review gates |
| X19 | Current | Public testnet release operator package: `npm run public-testnet-release-pack` writes the wallet-upload and final-review packet |

---

## Public Testnet Prerequisites

The following are required for a real Shelby testnet upload and are not provided by this demo:

| Prerequisite | Notes |
|---|---|
| Aptos browser wallet | e.g. [Petra](https://petra.app/) on Aptos Testnet |
| Testnet APT | From [Aptos testnet faucet](https://aptoslabs.com/testnet-faucet) for transaction gas fees |
| Shelby storage credits | ShelbyUSD tokens on the connected account |
| `NEXT_PUBLIC_SHELBY_NETWORK=testnet` | In `.env.local` |
| `SHELBY_MODE=testnet` | In `.env.local` (activates testnet UI path) |
| Manual browser session | `@shelby-protocol/react` hook requires interactive wallet — cannot be run in CI |

CI does not run real uploads. The participant path is documented in `docs/public-testnet-participation.md`; retrieval checks are documented in `docs/c3-smoke-test-guide.md`.

---

## What Is Explicitly Out of Scope

- **No trading or marketplace.** No dataset trading, no NFT minting, no exchange integration.
- **No token speculation.** No tokenomics modeling, no price data, no yield strategies.
- **No hosted production database or auth.** The project uses local SQLite plus browser localStorage fallback for demo/operator workflows.
- **No authentication system.** No user accounts, no session management, no OAuth.
- **No real LLM/AI calls.** Read receipt answer summaries are deterministic placeholders — no API calls to any AI provider.
- **No private key custody.** No server signer, no seed phrase handling, no mnemonic anywhere in the codebase.
- **No wallet payment UX.** No token purchase flow, no APT/SHEL purchase UI.
- **No social posting.** No automated posting to Twitter/X, Discord, or any other platform.
- **No mainnet production claim.** This is a public testnet candidate. Mainnet hosting is a separate decision.
- **No hidden mainnet claim.** The default path is Mock + SQLite. Shelby testnet proof requires operator wallet/funding prerequisites and explicit configuration.

---

## Key Links

| Resource | Path / URL |
|---|---|
| README | `README.md` |
| Architecture | `docs/architecture.md` |
| Demo script | `docs/demo-script.md` |
| Production queue | `docs/production-queue.md` |
| Release-candidate checklist | `docs/release-candidate-checklist.md` |
| Public testnet participation | `docs/public-testnet-participation.md` |
| Public testnet release playbook | `docs/public-testnet-release-playbook.md` |
| Smoke test guide | `docs/c3-smoke-test-guide.md` |
| M4 read receipt binding | `docs/m4-read-receipt-binding.md` |
| M2–M4 architecture plan | `docs/m2-m4-product-architecture-plan.md` |
| M2 integration design | `docs/m2-shelby-testnet-integration-design.md` |
| GitHub repository | https://github.com/a941249849/Shelby-AI-Evidence-Vault |
| Upload page | `/upload` |
| Testnet launch console | `/testnet` |
| Dashboard | `/dashboard` |
| Demo receipt | `/read-receipt/rr-001` |
| Demo blob | `/blob/blob-001` |
