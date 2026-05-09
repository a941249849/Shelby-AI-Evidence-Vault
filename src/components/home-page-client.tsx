'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  CloudUpload,
  Database,
  ExternalLink,
  FileArchive,
  FolderOpen,
  GitBranch,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useLanguage, type Language } from '@/components/language-state';
import { evidencePacks } from '@/lib/demo-data';

const copy = {
  zh: {
    eyebrow: '为持久而建，为流动而生。',
    title: '面向 AI Agent 的可验证记忆。',
    body:
      '将源文件封装成证据包，绑定为 Shelby-ready Blob，并把每次回答引用的证据沉淀为可追溯回执。',
    actions: {
      wallet: '连接钱包测试',
      upload: '上传证据',
      registry: '打开证据索引',
      receipt: '查看回执',
    },
    quick: ['封装来源', '绑定 Blob', '解析回执'],
    flowTitle: '证据如何流动',
    live: '实时运行中',
    flow: [
      ['证据包', '将源材料整理为类型化证据包'],
      ['Shelby Blob', '计算哈希并绑定为 Shelby-ready 身份'],
      ['读取回执', '记录每次回答引用的证据与运行状态'],
      ['可验证记忆', '形成可追溯、可审计的 AI 记忆链条'],
    ],
    stats: [
      ['证据包', '类型化元数据'],
      ['Shelby Blob', '哈希绑定对象'],
      ['回执', '可追溯记录'],
      ['当前存储', '上传记录可跨浏览器查看和保留。'],
    ],
    section: '核心能力',
    sectionBody: '构建 AI 时代的可验证数据基础设施',
    capabilities: [
      ['结构化证据包', '源材料会带上分类、标签、哈希和持久化状态，形成可理解的证据集。', 'Evidence Pack'],
      ['Blob 身份', 'Demo、Mock、Testnet 记录保持视图区分，同时不掩盖协议事实。', 'Shelby Blob'],
      ['回执证明', '每个回答都会从回答追溯到存储证据的来源链路。', 'Read Receipt'],
      ['可验证 & 可审计', '让证据在产品界面中流动，支持审计、复现与长期追溯。', 'Verifiable'],
    ],
    testnet: {
      label: 'PUBLIC TESTNET PATH',
      title: '面向社区的 Shelby 测试网参与入口',
      body:
        '部署方开启 testnet 后，用户连接 Aptos 钱包、准备测试网 APT 与 ShelbyUSD，即可把证据包写入 Shelby 测试网并生成可追溯回执。',
      points: ['钱包签名', 'Shelby Blob 注册', '回执可审计'],
      cta: '连接钱包',
      docs: '查看接入文档',
    },
    preview: '产品预览',
    previewBody: '从上传到回执，体验完整的证据流',
    previewCards: [
      ['证据索引', '浏览所有证据包、Blob 身份与状态'],
      ['上传证据', '选择文件、计算哈希、生成证据包'],
      ['读取回执', '追溯一次回答引用了哪些证据'],
    ],
    footerCta: '切换运行模式',
    footerStatus: 'Mock 模式',
  },
  en: {
    eyebrow: 'Built for persistence. Designed for flow.',
    title: 'Verifiable memory for AI agents.',
    body:
      'Package source files into Evidence Packs, bind them as Shelby-ready Blobs, and turn every referenced answer into an auditable Read Receipt.',
    actions: {
      wallet: 'Connect wallet',
      upload: 'Upload evidence',
      registry: 'Open registry',
      receipt: 'View receipt',
    },
    quick: ['Package source', 'Bind Blob', 'Resolve receipt'],
    flowTitle: 'How evidence flows',
    live: 'Live path ready',
    flow: [
      ['Evidence Pack', 'Turn source materials into typed evidence packages'],
      ['Shelby Blob', 'Hash and bind them into Shelby-ready identity'],
      ['Read Receipt', 'Record evidence and runtime status for each answer'],
      ['Verifiable Memory', 'Create an auditable memory chain for AI systems'],
    ],
    stats: [
      ['Evidence packs', 'Typed metadata'],
      ['Shelby Blob', 'Hash-bound objects'],
      ['Receipts', 'Traceable records'],
      ['Current store', 'Uploads remain inspectable across browser sessions.'],
    ],
    section: 'Core capability',
    sectionBody: 'A verifiable data foundation for agent-era applications',
    capabilities: [
      ['Structured evidence packs', 'Sources carry category, tags, hashes, and persistence state as readable evidence sets.', 'Evidence Pack'],
      ['Blob identity', 'Demo, Mock, and Testnet records stay distinct without hiding protocol facts.', 'Shelby Blob'],
      ['Receipt proof', 'Every answer can be traced back to the evidence stored underneath it.', 'Read Receipt'],
      ['Verifiable & auditable', 'Evidence moves through the product surface for audit, replay, and long-term provenance.', 'Verifiable'],
    ],
    testnet: {
      label: 'PUBLIC TESTNET PATH',
      title: 'A community entry point for Shelby testnet participation',
      body:
        'When deployed with testnet mode enabled, users connect an Aptos wallet, prepare testnet APT and ShelbyUSD, upload evidence to Shelby testnet, and receive traceable receipts.',
      points: ['Wallet signing', 'Shelby Blob registration', 'Auditable receipts'],
      cta: 'Connect wallet',
      docs: 'Read integration docs',
    },
    preview: 'Product preview',
    previewBody: 'Walk the flow from upload to receipt',
    previewCards: [
      ['Evidence registry', 'Browse evidence packs, Blob identity, and status'],
      ['Upload evidence', 'Select files, compute hashes, and create a pack'],
      ['Read receipt', 'Trace which evidence informed one answer'],
    ],
    footerCta: 'Switch runtime mode',
    footerStatus: 'Mock mode',
  },
};

const flowIcons = [FolderOpen, Box, ReceiptText, ShieldCheck];
const capabilityIcons = [FileArchive, Box, ReceiptText, ShieldCheck];

function FlowBoard({ language }: { language: Language }) {
  const t = copy[language];

  return (
    <section className="flow-board" aria-label={t.flowTitle}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#9fdc93] text-[#1f2a16]">
            <ShieldCheck size={20} />
          </span>
          <h2 className="text-xl font-black text-[#fffaf4]">{t.flowTitle}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-mono text-xs font-bold text-[#bfe8b5]">
          <span className="h-2 w-2 rounded-full bg-[#8fe27d]" />
          {t.live}
        </span>
      </div>

      <div className="flow-rail">
        {t.flow.map(([title, body], index) => {
          const Icon = flowIcons[index];
          return (
            <article key={title} className="flow-step">
              <div className="flow-orb">
                <Icon size={28} />
              </div>
              <p className="font-mono text-xs font-bold text-[#cfc7be]">0{index + 1}</p>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  body,
  tone,
}: {
  label: string;
  value: string;
  body: string;
  tone: 'green' | 'violet' | 'orange' | 'plain';
}) {
  return (
    <article className={`home-stat home-stat-${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <span>{body}</span>
    </article>
  );
}

function TestnetParticipationBand({ language }: { language: Language }) {
  const t = copy[language].testnet;

  return (
    <section className="mx-auto mt-10 max-w-[1320px] px-5 sm:px-8">
      <div className="grid gap-6 border border-[#2f1f12]/12 bg-[#2f1f12] p-6 text-[#fffaf4] md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-normal text-[#ff77c9]">
            {t.label}
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-black">{t.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d8d0c4]">{t.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {t.points.map((point, index) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#fffaf4]"
              >
                {index === 0 && <Wallet size={14} />}
                {index === 1 && <Box size={14} />}
                {index === 2 && <ReceiptText size={14} />}
                {point}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href="/testnet" className="shelby-primary-button">
            <CloudUpload size={18} />
            {t.cta}
            <span className="button-arrow">
              <ArrowRight size={19} />
            </span>
          </Link>
          <a
            href="https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs"
            target="_blank"
            rel="noopener noreferrer"
            className="shelby-secondary-button border-white/18 bg-white/[0.06] text-[#fffaf4] hover:border-[#ff77c9]/60 hover:text-[#ff77c9]"
          >
            {t.docs}
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePageClient() {
  const { language } = useLanguage();
  const t = copy[language];
  const blobCount = evidencePacks.reduce((sum, pack) => sum + pack.blobCount, 0);

  return (
    <main className="shelby-home min-h-screen overflow-hidden text-[#2f1f12]">
      <section className="home-hero">
        <div className="brand-shard brand-shard-left" />
        <div className="brand-shard brand-shard-right" />
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="hero-pill">
              <span className="h-2 w-2 rounded-full bg-[#83c879]" />
              {t.eyebrow}
            </p>
            {language === 'zh' ? (
              <h1>
                面向 AI Agent 的
                <span>可验证记忆。</span>
              </h1>
            ) : (
              <h1>{t.title}</h1>
            )}
            <p className="hero-body">{t.body}</p>

            <div className="quick-actions">
              {t.quick.map((item, index) => (
                <span key={item}>
                  {index === 0 && <FileArchive size={18} />}
                  {index === 1 && <Box size={18} />}
                  {index === 2 && <ReceiptText size={18} />}
                  {item}
                </span>
              ))}
            </div>

            <div className="hero-actions">
              <Link href="/testnet" className="shelby-primary-button">
                <Wallet size={19} />
                {t.actions.wallet}
                <span className="button-arrow">
                  <ArrowRight size={20} />
                </span>
              </Link>
              <Link href="/upload" className="shelby-secondary-button">
                <CloudUpload size={16} />
                {t.actions.upload}
              </Link>
              <Link href="/dashboard" className="shelby-secondary-button">
                {t.actions.registry}
                <ArrowRight size={16} />
              </Link>
              <Link href="/read-receipt/rr-001" className="receipt-link">
                {t.actions.receipt}
                <ReceiptText size={16} />
              </Link>
            </div>
          </div>

          <FlowBoard language={language} />
        </div>

        <div className="home-stats">
          <StatCard label={t.stats[0][0]} value={String(evidencePacks.length)} body={t.stats[0][1]} tone="green" />
          <StatCard label={t.stats[1][0]} value={String(blobCount)} body={t.stats[1][1]} tone="violet" />
          <StatCard label={t.stats[2][0]} value="4" body={t.stats[2][1]} tone="orange" />
          <StatCard label={t.stats[3][0]} value="SQLite" body={t.stats[3][1]} tone="plain" />
        </div>
      </section>

      <section id="product" className="product-section">
        <div className="section-heading">
          <h2>{t.section}</h2>
          <p>{t.sectionBody}</p>
        </div>

        <div className="capability-grid">
          {t.capabilities.map(([title, body, meta], index) => {
            const Icon = capabilityIcons[index];
            return (
              <article key={title} className="capability-card">
                <div className="capability-icon">
                  <Icon size={23} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <span>{meta}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <TestnetParticipationBand language={language} />

      <section className="preview-section">
        <div className="section-heading">
          <h2>{t.preview}</h2>
          <p>{t.previewBody}</p>
        </div>

        <div className="preview-grid">
          {t.previewCards.map(([title, body], index) => (
            <article key={title} className="preview-card">
              <div className="preview-card-head">
                <span>{index === 0 ? <Database size={18} /> : index === 1 ? <CloudUpload size={18} /> : <ReceiptText size={18} />}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
              {index === 0 && (
                <div className="mini-table">
                  {['AI Research Paper.pdf', 'Market Data.csv', 'Meeting Notes.md'].map((name, row) => (
                    <div key={name}>
                      <span>{name}</span>
                      <code>b_{row + 73}fa...a9d1</code>
                      <strong>{row === 0 ? 'Mock' : 'Local'}</strong>
                    </div>
                  ))}
                </div>
              )}
              {index === 1 && (
                <div className="drop-preview">
                  <CloudUpload size={28} />
                  <p>{language === 'zh' ? '拖拽文件到此处，或点击选择文件' : 'Drop files here or browse'}</p>
                </div>
              )}
              {index === 2 && (
                <div className="receipt-preview">
                  <p>Run ID <strong>run_20250308_001</strong></p>
                  <p>GPT-4o / v2.1</p>
                  <p><CheckCircle2 size={14} /> {language === 'zh' ? '完成' : 'Complete'}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="developers" className="developer-band">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-md bg-[#2f1f12] text-[#ff5fb8]">
            <GitBranch size={24} />
          </span>
          <div>
            <h2>{language === 'zh' ? '为开发者而生' : 'Built for developers'}</h2>
            <p>
              {language === 'zh'
                ? '通过 API 与 SDK 将证据能力集成到你的应用或 Agent 中。'
                : 'Use APIs and SDKs to wire verifiable evidence into your app or agent.'}
            </p>
          </div>
        </div>
        <div className="developer-links">
          <span>REST API</span>
          <span>TypeScript SDK</span>
          <span>CLI</span>
          <Link href="https://github.com/a941249849/Shelby-AI-Evidence-Vault">
            {language === 'zh' ? '访问开发者文档' : 'Open developer docs'}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
