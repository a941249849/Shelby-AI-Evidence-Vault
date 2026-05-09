'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Copy,
  ExternalLink,
  FileCheck2,
  FileJson,
  FlaskConical,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { AdapterNotDetectedWallet, AdapterWallet } from '@aptos-labs/wallet-adapter-react';
import { useLanguage, type Language } from '@/components/language-state';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';
import { getLocalBlobs, getLocalReadReceipts } from '@/lib/store/local-store';
import { getPersistedBlobsAction, getPersistedReceiptsAction } from '@/app/actions/persist';
import { formatDateTime } from '@/lib/utils';

const copy = {
  zh: {
    eyebrow: 'Shelby Testnet Launch',
    title: '公开测试网参与控制台',
    subtitle: '给社区用户看的正式入口：确认当前部署模式、准备钱包和测试资产、上传证据包，并从 Blob 详情与读取回执检查 Shelby testnet 证明。',
    body:
      '这里把协议路径变成产品路径：钱包签名、Shelby Blob 注册、本地回执持久化，以及面向检索的验证。',
    start: '开始上传',
    docs: 'Shelby React SDK',
    status: '运行状态',
    connected: '已连接',
    disconnected: '未连接',
    wrongNetwork: '网络错误',
    ready: '钱包就绪',
    walletTitle: '钱包 readiness',
    walletBody:
      '公开测试前先在这里检查钱包扩展、连接状态和 Aptos Testnet 网络。真实上传仍在 /upload 完成。',
    walletBlocked:
      '当前部署仍是 Mock 预览；可以检查钱包，但公开测试网实传需要 SHELBY_MODE=testnet。',
    walletMissing: '未检测到 Aptos 钱包。请安装 Petra 或兼容钱包后刷新页面。',
    detectedWallets: '检测到的钱包',
    notInstalled: '可安装的钱包',
    connect: '连接',
    disconnect: '断开连接',
    account: '账号',
    network: '网络',
    continueUpload: '进入上传页',
    enabled: 'Testnet 已启用',
    enabledBody: '当前部署已开启 Shelby 测试网参与路径。',
    mock: 'Mock 预览',
    mockBody: '当前部署仍是本地预览；公开参与需开启 testnet。',
    steps: [
      ['连接 Aptos 钱包', '使用 Petra 或兼容钱包，并切换到 Aptos Testnet。', 'Petra'],
      ['准备测试资产', '测试网 APT 用于 gas，ShelbyUSD 用于 Shelby 文件上传。', 'Aptos Faucet'],
      ['上传证据包', '钱包签名后，文件注册为 Shelby testnet Blob。', 'Upload'],
      ['检查回执', '验证账号、blobName、哈希、状态、检索链接与 explorer 入口。', 'Receipt'],
    ],
    acceptanceTitle: '发布验收',
    sessionTitle: '社区测试会话',
    sessionBody:
      '完成真实测试网上传后，这里会从浏览器缓存和 SQLite 账本聚合最近的 shelby-testnet 回执、引用 Blob 与可提交的测试摘要。',
    sessionEmptyTitle: '尚未形成测试网会话',
    sessionEmptyBody:
      '当前浏览器还没有 shelby-testnet 回执。先连接钱包并完成一次测试网上传，再回到这里检查会话。',
    latestReceipt: '最近回执',
    linkedBlobs: '引用 Blob',
    noReceipt: '无测试网回执',
    openReceipt: '打开回执',
    openBlob: '打开 Blob',
    copySession: '复制会话摘要',
    copied: '已复制',
    refreshSession: '刷新会话',
    ledgerSource: '数据来源',
    ledgerSourceValue: '浏览器缓存 + SQLite',
    sessionMode: '会话模式',
    generatedAt: '生成时间',
    proofPath: '证明链路',
    proofPathValue: '钱包 → 上传 → Blob 证明 → 回执聚合 → smoke 可选验证',
    acceptance: [
      '自动门禁：lint、build、release-candidate verifier 必须全绿。',
      '真实测试：连接 Aptos Testnet 钱包，完成一次小文件上传。',
      '结果检查：Blob 详情和读取回执必须展示 testnet account、blobName、hash、status 和 retrieval URL。',
      '烟雾验证：使用真实 account/blobName 跑 opt-in smoke retrieval。',
    ],
    boundaryTitle: '产品边界',
    boundaries: [
      '测试网候选版，不声称 mainnet 或生产存储。',
      '不托管私钥，不提供 server signer，不接触助记词。',
      '不做 token 购买、支付、交易或 marketplace。',
      'Mock 模式只用于评审和开发 fallback，真实证明以 Shelby testnet 上传为准。',
    ],
  },
  en: {
    eyebrow: 'Shelby Testnet Launch',
    title: 'Public testnet participation console',
    subtitle:
      'A public entry point for community users: confirm runtime mode, prepare wallet and test assets, upload evidence, then inspect Shelby testnet proof through Blob details and read receipts.',
    body:
      'This page turns the protocol path into a product path: wallet signing, Shelby Blob registration, local receipt persistence, and retrieval-oriented verification.',
    start: 'Start upload',
    docs: 'Shelby React SDK',
    status: 'Runtime status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    wrongNetwork: 'Wrong network',
    ready: 'Wallet ready',
    walletTitle: 'Wallet readiness',
    walletBody:
      'Before public testing, check wallet extension detection, connection state, and Aptos Testnet alignment here. Real upload still happens on /upload.',
    walletBlocked:
      'This deployment is still in Mock preview. Wallet readiness can be checked, but real public testnet upload requires SHELBY_MODE=testnet.',
    walletMissing: 'No Aptos wallet detected. Install Petra or a compatible wallet extension, then refresh.',
    detectedWallets: 'Detected wallets',
    notInstalled: 'Installable wallets',
    connect: 'Connect',
    disconnect: 'Disconnect',
    account: 'Account',
    network: 'Network',
    continueUpload: 'Open upload',
    enabled: 'Testnet enabled',
    enabledBody: 'This deployment has enabled the Shelby testnet participation path.',
    mock: 'Mock preview',
    mockBody: 'This deployment is still a local preview; public participation requires testnet mode.',
    steps: [
      ['Connect Aptos wallet', 'Use Petra or a compatible wallet, then switch to Aptos Testnet.', 'Petra'],
      ['Prepare test assets', 'Testnet APT pays gas; ShelbyUSD pays Shelby upload costs.', 'Aptos Faucet'],
      ['Upload evidence', 'After wallet signing, files register as Shelby testnet Blobs.', 'Upload'],
      ['Inspect receipt', 'Verify account, blobName, hash, status, retrieval URL, and explorer entry.', 'Receipt'],
    ],
    acceptanceTitle: 'Launch acceptance',
    sessionTitle: 'Community test session',
    sessionBody:
      'After a real testnet upload, this panel aggregates the latest shelby-testnet receipt, referenced Blobs, and a shareable test summary from browser cache plus the SQLite ledger.',
    sessionEmptyTitle: 'No testnet session yet',
    sessionEmptyBody:
      'This browser has no shelby-testnet receipt yet. Connect a wallet, complete one testnet upload, then return here to inspect the session.',
    latestReceipt: 'Latest receipt',
    linkedBlobs: 'Referenced blobs',
    noReceipt: 'No testnet receipt',
    openReceipt: 'Open receipt',
    openBlob: 'Open Blob',
    copySession: 'Copy session summary',
    copied: 'Copied',
    refreshSession: 'Refresh session',
    ledgerSource: 'Data source',
    ledgerSourceValue: 'browser cache + SQLite',
    sessionMode: 'Session mode',
    generatedAt: 'Generated at',
    proofPath: 'Proof path',
    proofPathValue: 'wallet → upload → Blob proof → receipt aggregation → optional smoke check',
    acceptance: [
      'Automated gate: lint, build, and release-candidate verifier must stay green.',
      'Real test: connect an Aptos Testnet wallet and upload one small file.',
      'Result check: Blob details and read receipts must show testnet account, blobName, hash, status, and retrieval URL.',
      'Smoke check: run opt-in smoke retrieval with the real account/blobName.',
    ],
    boundaryTitle: 'Product boundary',
    boundaries: [
      'Testnet candidate only; no mainnet or production storage claim.',
      'No private-key custody, no server signer, no seed phrase handling.',
      'No token purchase, payment, trading, or marketplace surface.',
      'Mock mode is only a review and development fallback; real proof comes from Shelby testnet upload.',
    ],
  },
} satisfies Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    start: string;
    docs: string;
    status: string;
    connected: string;
    disconnected: string;
    wrongNetwork: string;
    ready: string;
    walletTitle: string;
    walletBody: string;
    walletBlocked: string;
    walletMissing: string;
    detectedWallets: string;
    notInstalled: string;
    connect: string;
    disconnect: string;
    account: string;
    network: string;
    continueUpload: string;
    enabled: string;
    enabledBody: string;
    mock: string;
    mockBody: string;
    steps: Array<[string, string, string]>;
    acceptanceTitle: string;
    sessionTitle: string;
    sessionBody: string;
    sessionEmptyTitle: string;
    sessionEmptyBody: string;
    latestReceipt: string;
    linkedBlobs: string;
    noReceipt: string;
    openReceipt: string;
    openBlob: string;
    copySession: string;
    copied: string;
    refreshSession: string;
    ledgerSource: string;
    ledgerSourceValue: string;
    sessionMode: string;
    generatedAt: string;
    proofPath: string;
    proofPathValue: string;
    acceptance: string[];
    boundaryTitle: string;
    boundaries: string[];
  }
>;

const stepMeta = [
  { icon: Wallet, href: 'https://petra.app/', external: true },
  { icon: FlaskConical, href: 'https://aptoslabs.com/testnet-faucet', external: true },
  { icon: CloudUpload, href: '/upload', external: false },
  { icon: ReceiptText, href: '/read-receipt/rr-001', external: false },
];

export default function TestnetPageClient({ mode }: { mode: 'mock' | 'testnet' }) {
  const { language } = useLanguage();
  const t = copy[language];
  const enabled = mode === 'testnet';
  const wallet = useWallet();
  const [walletError, setWalletError] = useState<string | null>(null);
  const accountAddress = wallet.account?.address?.toString() ?? null;
  const walletNetwork = wallet.network?.name ? String(wallet.network.name) : null;
  const walletReady = wallet.connected && walletNetwork === Network.TESTNET;
  const walletStatus = walletReady
    ? t.ready
    : wallet.connected
      ? t.wrongNetwork
      : t.disconnected;

  const launchChecks: Array<{ label: string; value: string; ok: boolean }> = [
    { label: 'SHELBY_MODE', value: enabled ? 'testnet' : 'mock', ok: enabled },
    { label: 'NEXT_PUBLIC_SHELBY_NETWORK', value: 'testnet', ok: true },
    { label: 'Wallet', value: walletStatus, ok: walletReady },
    { label: 'Wallet custody', value: 'browser wallet only', ok: true },
    { label: 'Mainnet claim', value: 'none', ok: true },
  ];

  async function connectWallet(name: string) {
    setWalletError(null);
    try {
      await wallet.connect(name);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : String(err));
    }
  }

  async function disconnectWallet() {
    setWalletError(null);
    try {
      await wallet.disconnect();
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
          <div className="shelby-surface shelby-cut p-7 sm:p-9">
            <div className="ui-chip mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#de8aff]" />
              {t.eyebrow}
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-[#2f1f12] sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#6d5f55]">{t.subtitle}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#7b695d]">{t.body}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/upload" className="shelby-primary-button">
                <CloudUpload size={18} />
                {t.start}
                <span className="button-arrow">
                  <ArrowRight size={19} />
                </span>
              </Link>
              <a
                href="https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs"
                target="_blank"
                rel="noopener noreferrer"
                className="shelby-secondary-button"
              >
                {t.docs}
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          <aside className="shelby-surface-soft shelby-cut p-6">
            <p className="font-mono text-xs font-bold uppercase text-[#6d5f55]">{t.status}</p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className={`grid h-12 w-12 place-items-center border ${
                  enabled
                    ? 'border-[#317c24]/20 bg-[#dff5d7] text-[#317c24]'
                    : 'border-[#ff8b64]/25 bg-[#fff0ea] text-[#9a361f]'
                }`}
              >
                {enabled ? <CheckCircle2 size={24} /> : <FlaskConical size={24} />}
              </span>
              <div>
                <p className="text-2xl font-black text-[#2f1f12]">{enabled ? t.enabled : t.mock}</p>
                <p className="mt-1 text-sm text-[#6d5f55]">{enabled ? t.enabledBody : t.mockBody}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              {launchChecks.map(({ label, value, ok }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border border-[#2f1f12]/10 bg-white/45 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs font-bold uppercase text-[#7b695d]">{label}</span>
                  <span className={ok ? 'font-semibold text-[#317c24]' : 'font-semibold text-[#9a361f]'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.steps.map(([title, body, link], index) => {
            const { icon: Icon, href, external } = stepMeta[index];
            const card = (
              <article className="h-full border border-[#eadfd6] bg-[#fffdf9]/88 p-5 shadow-[0_18px_48px_rgba(47,31,18,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center border border-[#9fe878]/35 bg-[#f1ffe9] text-[#317c24]">
                    <Icon size={21} />
                  </span>
                  <span className="font-mono text-xs font-black text-[#b29e92]">0{index + 1}</span>
                </div>
                <h2 className="mt-5 text-lg font-black text-[#2f1f12]">{title}</h2>
                <p className="mt-4 min-h-18 text-sm leading-6 text-[#6d5f55]">{body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#de5cff]">
                  {link}
                  {external ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
                </span>
              </article>
            );

            return external ? (
              <a key={title} href={href} target="_blank" rel="noopener noreferrer" className="block">
                {card}
              </a>
            ) : (
              <Link key={title} href={href} className="block">
                {card}
              </Link>
            );
          })}
        </section>

        <WalletReadinessPanel
          mode={mode}
          wallets={wallet.wallets}
          notDetectedWallets={wallet.notDetectedWallets}
          connected={wallet.connected}
          walletName={wallet.wallet?.name ?? null}
          accountAddress={accountAddress}
          walletNetwork={walletNetwork}
          walletReady={walletReady}
          walletError={walletError}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          language={language}
        />

        <TestnetSessionPanel
          mode={mode}
          walletReady={walletReady}
          accountAddress={accountAddress}
          walletNetwork={walletNetwork}
          language={language}
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <InfoPanel icon={FileCheck2} title={t.acceptanceTitle} items={t.acceptance} />
          <InfoPanel icon={ShieldCheck} title={t.boundaryTitle} items={t.boundaries} green />
        </section>
      </div>
    </div>
  );
}

function WalletReadinessPanel({
  mode,
  wallets,
  notDetectedWallets,
  connected,
  walletName,
  accountAddress,
  walletNetwork,
  walletReady,
  walletError,
  connectWallet,
  disconnectWallet,
  language,
}: {
  mode: 'mock' | 'testnet';
  wallets: ReadonlyArray<AdapterWallet>;
  notDetectedWallets: ReadonlyArray<AdapterNotDetectedWallet>;
  connected: boolean;
  walletName: string | null;
  accountAddress: string | null;
  walletNetwork: string | null;
  walletReady: boolean;
  walletError: string | null;
  connectWallet: (name: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  language: Language;
}) {
  const t = copy[language];
  const modeEnabled = mode === 'testnet';
  const noWallets = wallets.length === 0 && notDetectedWallets.length === 0;

  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="shelby-surface shelby-cut p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-[#ff4faf]">{t.walletTitle}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d5f55]">{t.walletBody}</p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-2 border px-3 py-1.5 font-mono text-xs font-bold ${
              walletReady
                ? 'border-[#317c24]/20 bg-[#dff5d7] text-[#317c24]'
                : connected
                  ? 'border-[#fd8565]/35 bg-[#fff0ea] text-[#9a361f]'
                  : 'border-[#d8c7bb] bg-[#fffdf9] text-[#6d5f55]'
            }`}
          >
            {walletReady ? <CheckCircle2 size={14} /> : connected ? <WifiOff size={14} /> : <Wallet size={14} />}
            {walletReady ? t.ready : connected ? t.wrongNetwork : t.disconnected}
          </span>
        </div>

        {!modeEnabled && (
          <div className="mb-5 flex gap-3 border border-[#fd8565]/35 bg-[#fff0ea]/85 px-4 py-3 text-sm text-[#7d2a15]">
            <FlaskConical className="mt-0.5 h-4 w-4 flex-none" />
            <p>{t.walletBlocked}</p>
          </div>
        )}

        {walletError && (
          <div className="mb-5 flex gap-3 border border-red-400/35 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <p>{walletError}</p>
          </div>
        )}

        {connected ? (
          <div className="grid gap-3 md:grid-cols-2">
            <StatusLine label={t.account} value={accountAddress ?? 'unknown'} ok={Boolean(accountAddress)} />
            <StatusLine label={t.network} value={walletNetwork ?? 'unknown'} ok={walletNetwork === Network.TESTNET} />
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border border-[#eadfd6] bg-white/50 px-4 py-3">
              <span className="text-sm font-semibold text-[#2f1f12]">
                {walletName ?? 'Wallet'} {t.connected}
              </span>
              <button
                type="button"
                onClick={disconnectWallet}
                className="border border-[#d8c7bb] px-3 py-1.5 text-sm font-bold text-[#6d5f55] transition hover:border-[#fd8565]/60 hover:text-[#9a361f]"
              >
                {t.disconnect}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {noWallets && (
              <p className="mb-4 text-sm leading-6 text-[#6d5f55]">
                {t.walletMissing}{' '}
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#de5cff] underline"
                >
                  Petra
                </a>
              </p>
            )}

            {wallets.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-xs font-bold uppercase text-[#7b695d]">{t.detectedWallets}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {wallets.map((candidate) => (
                    <button
                      key={candidate.name}
                      type="button"
                      onClick={() => connectWallet(candidate.name)}
                      className="flex items-center justify-between gap-3 border border-[#eadfd6] bg-white/55 px-3 py-2.5 text-left text-sm font-bold text-[#2f1f12] transition hover:border-[#de8aff]/50 hover:text-[#de5cff]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {candidate.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={candidate.icon} alt={candidate.name} className="h-5 w-5 flex-none rounded" />
                        )}
                        <span className="truncate">{candidate.name}</span>
                      </span>
                      <span className="font-mono text-xs">{t.connect}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {notDetectedWallets.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 font-mono text-xs font-bold uppercase text-[#7b695d]">{t.notInstalled}</p>
                <div className="flex flex-wrap gap-2">
                  {notDetectedWallets.map((candidate) => (
                    <a
                      key={candidate.name}
                      href={candidate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-[#eadfd6] bg-white/55 px-3 py-2 text-sm font-semibold text-[#6d5f55] hover:border-[#de8aff]/50 hover:text-[#de5cff]"
                    >
                      {candidate.name}
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shelby-surface-soft shelby-cut p-6">
        <p className="font-mono text-xs font-bold uppercase text-[#6d5f55]">
          {language === 'zh' ? '下一步' : 'Next step'}
        </p>
        <h2 className="mt-3 text-2xl font-black text-[#2f1f12]">{t.continueUpload}</h2>
        <p className="mt-3 text-sm leading-6 text-[#6d5f55]">
          {language === 'zh'
            ? '钱包 readiness 通过后，进入上传页创建证据包。上传页会继续执行网络校验，并在真实签名后生成 Blob 与回执。'
            : 'After wallet readiness passes, open the upload flow to create an evidence pack. The upload page still enforces network checks and creates Blob/receipt records after real signing.'}
        </p>
        <Link href="/upload" className="shelby-primary-button mt-5 w-full">
          <CloudUpload size={18} />
          {t.continueUpload}
          <span className="button-arrow">
            <ArrowRight size={19} />
          </span>
        </Link>
      </div>
    </section>
  );
}

interface CommunitySession {
  receipts: ReadReceipt[];
  blobs: BlobRecord[];
  latestReceipt: ReadReceipt | null;
  latestReceiptBlobs: BlobRecord[];
  source: 'browser' | 'sqlite' | 'mixed';
}

function emptyCommunitySession(): CommunitySession {
  return { receipts: [], blobs: [], latestReceipt: null, latestReceiptBlobs: [], source: 'browser' };
}

function isTestnetBlobRecord(blob: BlobRecord): boolean {
  return blob.dataSource === 'shelby-testnet' || blob.uploadMode === 'testnet' || blob.network === 'testnet';
}

function dedupeById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const record of records) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    deduped.push(record);
  }
  return deduped;
}

function buildCommunitySession(
  receiptsInput: ReadReceipt[],
  blobsInput: BlobRecord[],
  source: CommunitySession['source']
): CommunitySession {
  const receipts = dedupeById(receiptsInput)
    .filter((receipt) => receipt.receiptMode === 'shelby-testnet')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const blobs = dedupeById(blobsInput)
    .filter(isTestnetBlobRecord)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latestReceipt = receipts[0] ?? null;
  const latestReceiptBlobs = latestReceipt
    ? (latestReceipt.referencedBlobIds
        .map((blobId) => blobs.find((blob) => blob.id === blobId))
        .filter(Boolean) as BlobRecord[])
    : [];

  return { receipts, blobs, latestReceipt, latestReceiptBlobs, source };
}

function loadBrowserCommunitySession(): CommunitySession {
  if (typeof window === 'undefined') {
    return emptyCommunitySession();
  }

  return buildCommunitySession(getLocalReadReceipts(), getLocalBlobs(), 'browser');
}

async function loadLedgerCommunitySession(): Promise<CommunitySession> {
  const browserSession = loadBrowserCommunitySession();
  try {
    const [persistedReceipts, persistedBlobs] = await Promise.all([
      getPersistedReceiptsAction(),
      getPersistedBlobsAction(),
    ]);
    return buildCommunitySession(
      [...browserSession.receipts, ...persistedReceipts],
      [...browserSession.blobs, ...persistedBlobs],
      browserSession.receipts.length > 0 || browserSession.blobs.length > 0 ? 'mixed' : 'sqlite'
    );
  } catch {
    return browserSession;
  }
}

function buildSessionSummary({
  mode,
  walletReady,
  accountAddress,
  walletNetwork,
  session,
}: {
  mode: 'mock' | 'testnet';
  walletReady: boolean;
  accountAddress: string | null;
  walletNetwork: string | null;
  session: CommunitySession;
}) {
  const proofBlobs = session.latestReceiptBlobs.length > 0 ? session.latestReceiptBlobs : session.blobs;

  return {
    product: 'Shelby AI Evidence Vault',
    milestone: 'X14 persistent testnet session ledger',
    generatedAt: new Date().toISOString(),
    runtimeMode: mode,
    ledgerSource: session.source,
    wallet: {
      ready: walletReady,
      accountAddress,
      network: walletNetwork,
    },
    latestReceipt: session.latestReceipt
      ? {
          id: session.latestReceipt.id,
          runId: session.latestReceipt.runId,
          timestamp: session.latestReceipt.timestamp,
          receiptMode: session.latestReceipt.receiptMode,
          url: `/read-receipt/${session.latestReceipt.id}`,
        }
      : null,
    blobs: proofBlobs.map((blob) => ({
      id: blob.id,
      shelbyRef: blob.shelbyRef,
      accountAddress: blob.accountAddress,
      blobName: blob.blobName,
      network: blob.network,
      storageStatus: blob.storageStatus,
      explorerUrl: blob.explorerUrl,
      retrievalUrl: blob.retrievalUrl,
      url: `/blob/${blob.id}`,
    })),
    acceptancePath: [
      'connect Aptos Testnet wallet',
      'upload evidence through Shelby browser-wallet flow',
      'verify Blob detail proof panel',
      'verify receipt-level testnet audit panel',
      'optionally run npm run smoke with accountAddress/blobName',
    ],
  };
}

function TestnetSessionPanel({
  mode,
  walletReady,
  accountAddress,
  walletNetwork,
  language,
}: {
  mode: 'mock' | 'testnet';
  walletReady: boolean;
  accountAddress: string | null;
  walletNetwork: string | null;
  language: Language;
}) {
  const t = copy[language];
  const [session, setSession] = useState<CommunitySession>(loadBrowserCommunitySession);
  const [copied, setCopied] = useState(false);
  const proofBlobs = session.latestReceiptBlobs.length > 0 ? session.latestReceiptBlobs : session.blobs;
  const hasSession = Boolean(session.latestReceipt || session.blobs.length > 0);

  const refreshSession = async () => {
    const nextSession = await loadLedgerCommunitySession();
    setSession(nextSession);
    setCopied(false);
  };

  useEffect(() => {
    let cancelled = false;
    loadLedgerCommunitySession()
      .then((nextSession) => {
        if (cancelled) return;
        setSession(nextSession);
      })
      .catch(() => {
        if (!cancelled) setSession(loadBrowserCommunitySession());
      });

    const onFocus = () => {
      void refreshSession();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const copySummary = async () => {
    const summary = buildSessionSummary({
      mode,
      walletReady,
      accountAddress,
      walletNetwork,
      session,
    });
    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
  };

  return (
    <section className="mt-8 shelby-surface shelby-cut p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase text-[#ff4faf]">{t.sessionTitle}</p>
          <h2 className="mt-3 text-2xl font-black text-[#2f1f12]">
            {hasSession ? t.sessionTitle : t.sessionEmptyTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6d5f55]">
            {hasSession ? t.sessionBody : t.sessionEmptyBody}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshSession}
            className="inline-flex items-center gap-2 border border-[#d8c7bb] bg-white/55 px-3 py-2 text-sm font-bold text-[#6d5f55] transition hover:border-[#de8aff]/50 hover:text-[#de5cff]"
          >
            <RefreshCw size={15} />
            {t.refreshSession}
          </button>
          <button
            type="button"
            onClick={copySummary}
            disabled={!hasSession}
            className="inline-flex items-center gap-2 border border-[#2f1f12] bg-[#2f1f12] px-3 py-2 text-sm font-bold text-[#fffdf9] transition hover:bg-[#3a281a] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            {copied ? t.copied : t.copySession}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SessionMetric label={t.sessionMode} value={mode} ok={mode === 'testnet'} />
        <SessionMetric label={t.latestReceipt} value={session.latestReceipt?.id ?? t.noReceipt} ok={Boolean(session.latestReceipt)} />
        <SessionMetric label={t.linkedBlobs} value={String(proofBlobs.length)} ok={proofBlobs.length > 0} />
        <SessionMetric label={t.ledgerSource} value={t.ledgerSourceValue} ok={session.source !== 'browser' || hasSession} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="border border-[#eadfd6] bg-white/50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-mono text-xs font-bold uppercase text-[#7b695d]">{t.linkedBlobs}</p>
            <FileJson className="h-4 w-4 text-[#de5cff]" />
          </div>
          {proofBlobs.length > 0 ? (
            <div className="space-y-3">
              {proofBlobs.slice(0, 4).map((blob) => (
                <div key={blob.id} className="border border-[#eadfd6] bg-[#fffdf9]/80 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/blob/${blob.id}`} className="font-mono text-xs font-bold text-[#2f1f12] hover:text-[#de5cff]">
                      {blob.id}
                    </Link>
                    <Link href={`/blob/${blob.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#de5cff]">
                      {t.openBlob}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-[#6d5f55]">{blob.shelbyRef}</p>
                  <div className="mt-2 grid gap-2 text-xs text-[#6d5f55] sm:grid-cols-2">
                    <span className="break-all">account: {blob.accountAddress ?? '-'}</span>
                    <span className="break-all">blobName: {blob.blobName ?? '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-[#6d5f55]">{t.sessionEmptyBody}</p>
          )}
        </div>

        <aside className="border border-[#eadfd6] bg-[#fffdf9]/75 p-4">
          <p className="font-mono text-xs font-bold uppercase text-[#7b695d]">{t.proofPath}</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#2f1f12]">{t.proofPathValue}</p>
          <div className="mt-5 space-y-3 text-sm text-[#6d5f55]">
            <p>
              {t.generatedAt}: <span className="font-mono">{formatDateTime(new Date().toISOString())}</span>
            </p>
            <p>
              wallet: <span className="font-mono">{accountAddress ?? '-'}</span>
            </p>
            <p>
              network: <span className="font-mono">{walletNetwork ?? '-'}</span>
            </p>
          </div>
          {session.latestReceipt && (
            <Link href={`/read-receipt/${session.latestReceipt.id}`} className="shelby-secondary-button mt-5 w-full">
              {t.openReceipt}
              <ArrowRight size={15} />
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}

function SessionMetric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="border border-[#eadfd6] bg-white/50 px-4 py-3">
      <p className="font-mono text-xs font-bold uppercase text-[#7b695d]">{label}</p>
      <p className={`mt-1 break-all text-lg font-black ${ok ? 'text-[#317c24]' : 'text-[#9a361f]'}`}>
        {value}
      </p>
    </div>
  );
}

function StatusLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="border border-[#eadfd6] bg-white/50 px-4 py-3">
      <p className="font-mono text-xs font-bold uppercase text-[#7b695d]">{label}</p>
      <p className={`mt-1 break-all text-sm font-semibold ${ok ? 'text-[#317c24]' : 'text-[#9a361f]'}`}>
        {value}
      </p>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  items,
  green = false,
}: {
  icon: typeof FileCheck2;
  title: string;
  items: string[];
  green?: boolean;
}) {
  return (
    <div className="shelby-surface shelby-cut p-6">
      <div className="mb-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${green ? 'text-[#9fe878]' : 'text-[#de8aff]'}`} />
        <h2 className="text-xl font-black text-[#2f1f12]">{title}</h2>
      </div>
      <ul className="space-y-3 text-sm leading-6 text-[#6d5f55]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
