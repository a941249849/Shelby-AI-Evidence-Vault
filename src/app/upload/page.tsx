'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  FileUp,
  Hash,
  HardDrive,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { Network } from '@aptos-labs/ts-sdk';
import type { AdapterWallet, AdapterNotDetectedWallet } from '@aptos-labs/wallet-adapter-react';
import { shelbyUploadAction, getShelbyModeAction } from '@/app/actions/upload';
import { persistUploadAction } from '@/app/actions/persist';
import { parseTags, buildEvidencePack, buildBlobRecord } from '@/lib/validation';
import { addLocalPack, addLocalBlob, addLocalReadReceipt } from '@/lib/store/local-store';
import { formatBytes } from '@/lib/utils';
import { useShelbyUpload } from '@/lib/shelby/use-shelby-upload';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import { useLanguage } from '@/components/language-state';
import { useWalletSessionVerification } from '@/components/wallet-session-state';

type Category = 'dataset' | 'agent-run' | 'document' | 'manifest';
type SourceType = 'web-scrape' | 'api-export' | 'agent-output' | 'manual-upload';

interface FormState {
  title: string;
  category: Category;
  sourceType: SourceType;
  tags: string;
  description: string;
}

interface UploadFileEntry {
  file: File;
  hash: string | null;
  hashStatus: 'pending' | 'computing' | 'done' | 'error';
}

interface UploadedResult {
  packId: string;
  packTitle: string;
  blobIds: string[];
  mode: 'mock' | 'testnet';
  receiptId: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fieldClass =
  'w-full shelby-cut border border-white/10 bg-white/[0.055] px-3 py-2.5 text-sm text-[#f4f0e8] outline-none transition placeholder:text-[#6f716d] focus:border-[#de8aff]/60 focus:ring-2 focus:ring-[#de8aff]/15';

const uploadCopy = {
  zh: {
    intake: '证据入口',
    title: '将文件封装为可验证 AI 证据包。',
    mockSubtitle:
      '当前会在本地生成元数据、文件哈希与 Mock Shelby 引用；切换 testnet 后可接入钱包完成真实 Shelby 上传。',
    testnetSubtitle:
      '连接 Aptos 钱包后将文件注册到 Shelby 测试网，并把真实账号、blobName 与 explorer 链接写入 BlobRecord。',
    storage: '存储边界',
    mockStorage: 'Mock 模式 + SQLite',
    testnetStorage: 'Shelby 测试网 + SQLite',
    localActive: '本地 Demo 上传已启用',
    localActiveBody: '文件会收到确定性的 Mock Shelby 引用，并持久化以便检查。',
    walletRequiredTitle: '测试网上传需要钱包',
    walletRequiredBody:
      '连接 Aptos 钱包并完成右上角签名验证后，才能把 Blob 上传到 Shelby 测试网。上传交易仍由钱包签名，并需要测试网 APT 与 ShelbyUSD。',
    configMissingTitle: '测试网 API key 未配置',
    configMissingBody:
      'Shelby 测试网拒绝匿名 RPC / Indexer 请求。请先在 .env.local 设置 NEXT_PUBLIC_TESTNET_API_KEY 并重启站点，再开放真实上传。',
    wrongNetworkTitle: '网络错误 - 请切换到 Aptos Testnet',
    wrongNetworkBody: 'Shelby 测试网上传要求钱包处于 Aptos Testnet。切换网络并重新连接后可继续。',
    walletReadyTitle: '钱包已连接 - Shelby 测试网上传就绪',
    walletReadyBody: '每个文件都会注册到链上并上传到 Shelby 测试网 RPC。',
    protocolPreviewTitle: '本地预览路径',
    protocolPreviewBody: '用于封装证据包、计算哈希、生成 Mock Shelby 引用与读取回执；不声称真实 Shelby 存储。',
    protocolTestnetTitle: 'Shelby 证明路径',
    protocolTestnetBody: '切换 testnet 并连接钱包后，BlobRecord 会记录 accountAddress、blobName、网络、状态和 explorer 链接。',
    participationTitle: '公开测试网参与路径',
    participationBadgeMock: '待部署方开启 testnet',
    participationBadgeTestnet: 'Shelby testnet-ready',
    participationBody:
      '面向社区测试的真实路径：钱包在 Aptos Testnet 签名，文件注册为 Shelby Blob，回执记录账号、blobName、哈希、读取链路与 explorer 入口。',
    participationSteps: [
      ['连接钱包', '安装 Petra 或兼容 Aptos 钱包，并切换到 Aptos Testnet。', 'Petra', 'https://petra.app/'],
      ['准备资产', '测试网 APT 用于 gas，ShelbyUSD 用于 Shelby 文件上传。', 'Aptos Faucet', 'https://aptoslabs.com/testnet-faucet'],
      ['上传证据', '上传文件后由钱包签名；应用会保存真实 shelby://testnet 引用。', 'Shelby React SDK', 'https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs'],
      ['验证回执', '打开 Blob 详情和读取回执，检查账号、哈希、状态、检索链接。', '下载说明', 'https://docs.shelby.xyz/sdks/typescript/browser/guides/download'],
    ],
    stepMeta: '证据包元数据',
    stepFiles: '文件与哈希',
    stepSave: '本地保存',
    stepTestnet: '测试网上传',
    labels: {
      title: '证据包标题',
      category: '分类',
      sourceType: '来源类型',
      tags: '标签',
      tagsHelp: '逗号分隔',
      description: '描述',
    },
    placeholders: {
      title: 'Common Crawl 样本 - Web Text 2024-Q1',
      tags: 'nlp, training-data, 2024',
      description: '描述来源、采集方式，以及这批材料作为证据的价值。',
    },
    categories: ['数据集', 'Agent 运行', '文档', '清单'],
    sources: ['网页抓取', 'API 导出', 'Agent 输出', '手动上传'],
    drop: '拖拽文件到此处，或点击选择',
    maxFile: '每个文件最大',
    hashNote: '保存前会在浏览器内计算 SHA-256。',
    submit: {
      uploadingTestnet: '正在上传到测试网',
      savingLocal: '正在本地保存',
      uploadTestnet: '上传到 Shelby 测试网',
      configMissing: '缺少测试网 API key',
      wrongNetwork: '网络错误，请切换钱包',
      verifyWallet: '先完成签名验证',
      connectWallet: '连接钱包后上传',
      saveLocal: '保存到本地',
    },
    saveBody: '保存对象会获得确定性的 Mock Shelby 引用，并写入 SQLite 持久化。',
    testnetBody: '文件会通过已连接钱包注册到 Shelby 测试网，并保留为可检查记录。',
    connectHint: '连接 Aptos 钱包后可启用测试网上传。',
    configHint: '缺少 NEXT_PUBLIC_TESTNET_API_KEY，当前不能执行真实 Shelby 测试网上传。',
    verifyHint: '请先使用右上角钱包入口完成签名验证。',
    wrongHint: '切换钱包到 Aptos Testnet 后可继续上传。',
    mockHint: '设置 SHELBY_MODE=testnet 并连接钱包后可执行真实 Shelby 测试网上传。',
    walletConnected: '钱包已连接',
    disconnect: '断开连接',
    connectWalletTitle: '连接 Aptos 钱包',
    noWallet: '未检测到 Aptos 钱包。安装 Petra 或其他 Aptos 钱包扩展后刷新页面。',
    notInstalled: '未安装：',
    successLocal: '本地证据包已封装',
    successTestnet: 'Shelby 测试网证据包已封装',
    successLocalBody: '已保存为本地 Mock Shelby 引用。未进行钱包签名、网络上传或真实 Shelby 注册。',
    successTestnetBody: '已注册到 Shelby 测试网，并保存真实账号与 blob 元数据。',
    readReceipt: '读取回执',
    blobPages: 'Blob 详情页',
    sessionConsole: '返回测试会话',
    viewIndex: '查看证据索引',
    uploadAnother: '继续上传证据包',
    computingHash: '正在计算 SHA-256',
    hashError: '哈希计算失败',
    removeFile: '移除文件',
    errors: {
      oversized: (count: number, max: string) => `${count} 个文件已跳过：单个文件必须小于或等于 ${max}。`,
      titleRequired: '请填写证据包标题。',
      fileRequired: '请至少选择一个文件。',
      hashPending: '请等待 SHA-256 计算完成。',
      walletMissing: '钱包未连接。请先连接 Aptos 钱包，再上传到 Shelby 测试网。',
      configMissing:
        '缺少 NEXT_PUBLIC_TESTNET_API_KEY。请配置 Shelby/Geomi frontend client API key 并重启站点。',
      walletUnverified: '钱包已连接，但还没有完成签名验证。请先在右上角钱包入口完成签名验证。',
      wrongNetwork: (network: string) => `网络错误：钱包当前位于 "${network}"。请切换到 Aptos Testnet 并重新连接。`,
      uploadFailed: '上传失败。',
    },
  },
  en: {
    intake: 'Evidence intake',
    title: 'Package files into a verifiable AI evidence pack.',
    mockSubtitle:
      'Metadata, file hashes, and mock Shelby references are created locally. Set SHELBY_MODE=testnet with a connected wallet for real testnet upload.',
    testnetSubtitle:
      'Connect your Aptos wallet to register files on Shelby testnet. Real account/blobName identity and explorer links are stored in each BlobRecord.',
    storage: 'Storage boundary',
    mockStorage: 'Mock mode + SQLite',
    testnetStorage: 'Shelby testnet + SQLite',
    localActive: 'Local demo upload active',
    localActiveBody: 'Files receive deterministic mock Shelby references and are persisted for inspection.',
    walletRequiredTitle: 'Wallet required for testnet upload',
    walletRequiredBody:
      'Connect your Aptos wallet and complete the top-right signature verification before uploading blobs to Shelby testnet. The upload transaction is still wallet-signed and requires testnet APT plus ShelbyUSD.',
    configMissingTitle: 'Testnet API key is not configured',
    configMissingBody:
      'Shelby testnet rejects anonymous RPC / Indexer requests. Set NEXT_PUBLIC_TESTNET_API_KEY in .env.local and restart the app before enabling real uploads.',
    wrongNetworkTitle: 'Wrong network - switch to Aptos Testnet',
    wrongNetworkBody:
      'Shelby testnet upload requires your wallet to be on Aptos Testnet. Switch networks and reconnect to continue.',
    walletReadyTitle: 'Wallet connected - Shelby testnet upload ready',
    walletReadyBody: 'Each file will be registered on-chain and uploaded to Shelby testnet RPC.',
    protocolPreviewTitle: 'Local preview path',
    protocolPreviewBody:
      'Packages evidence, computes hashes, generates mock Shelby references, and creates read receipts without claiming real Shelby storage.',
    protocolTestnetTitle: 'Shelby proof path',
    protocolTestnetBody:
      'With testnet mode and a connected wallet, each BlobRecord captures accountAddress, blobName, network, status, and explorer link.',
    participationTitle: 'Public testnet participation path',
    participationBadgeMock: 'Waiting for testnet deploy',
    participationBadgeTestnet: 'Shelby testnet-ready',
    participationBody:
      'The real community path: the wallet signs on Aptos Testnet, files become Shelby Blobs, and receipts keep account, blobName, hash, retrieval, and explorer evidence visible.',
    participationSteps: [
      ['Connect wallet', 'Install Petra or a compatible Aptos wallet and switch to Aptos Testnet.', 'Petra', 'https://petra.app/'],
      ['Prepare assets', 'Testnet APT pays gas; ShelbyUSD pays Shelby file upload costs.', 'Aptos Faucet', 'https://aptoslabs.com/testnet-faucet'],
      ['Upload evidence', 'After wallet signing, the app stores a real shelby://testnet reference.', 'Shelby React SDK', 'https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs'],
      ['Verify receipt', 'Open Blob details and receipts to inspect account, hash, status, and retrieval links.', 'Download guide', 'https://docs.shelby.xyz/sdks/typescript/browser/guides/download'],
    ],
    stepMeta: 'Pack metadata',
    stepFiles: 'Files and hashes',
    stepSave: 'Local save',
    stepTestnet: 'Testnet upload',
    labels: {
      title: 'Pack title',
      category: 'Category',
      sourceType: 'Source type',
      tags: 'Tags',
      tagsHelp: 'comma-separated',
      description: 'Description',
    },
    placeholders: {
      title: 'Common Crawl Sample - Web Text 2024-Q1',
      tags: 'nlp, training-data, 2024',
      description: 'Describe the source, capture method, and intended evidence value.',
    },
    categories: ['Dataset', 'Agent Run', 'Document', 'Manifest'],
    sources: ['Web Scrape', 'API Export', 'Agent Output', 'Manual Upload'],
    drop: 'Drop files here or browse',
    maxFile: 'Max',
    hashNote: 'SHA-256 is computed in-browser before save.',
    submit: {
      uploadingTestnet: 'Uploading to testnet',
      savingLocal: 'Saving locally',
      uploadTestnet: 'Upload to Shelby testnet',
      configMissing: 'Missing testnet API key',
      wrongNetwork: 'Wrong network - switch wallet',
      verifyWallet: 'Verify signature first',
      connectWallet: 'Connect wallet to upload',
      saveLocal: 'Save locally',
    },
    saveBody: 'The saved object receives a deterministic mock Shelby reference and SQLite persistence.',
    testnetBody: 'Files are registered on Shelby testnet via your connected wallet and persisted for inspection.',
    connectHint: 'Connect an Aptos wallet to enable testnet upload.',
    configHint: 'NEXT_PUBLIC_TESTNET_API_KEY is missing, so real Shelby testnet upload is disabled.',
    verifyHint: 'Use the top-right wallet control to complete signature verification first.',
    wrongHint: 'Switch your wallet to Aptos Testnet to enable upload.',
    mockHint: 'Set SHELBY_MODE=testnet and connect a wallet for real Shelby testnet upload.',
    walletConnected: 'Wallet connected',
    disconnect: 'Disconnect',
    connectWalletTitle: 'Connect Aptos wallet',
    noWallet: 'No Aptos wallets detected. Install Petra or another Aptos wallet extension and refresh the page.',
    notInstalled: 'Not installed:',
    successLocal: 'Local evidence pack sealed',
    successTestnet: 'Shelby testnet evidence pack sealed',
    successLocalBody:
      'Saved locally with mock Shelby references. No wallet signing, network upload, or real Shelby registration.',
    successTestnetBody:
      'Registered on Shelby testnet and saved locally with real account and blob metadata.',
    readReceipt: 'Read receipt',
    blobPages: 'Blob detail pages',
    sessionConsole: 'Back to test session',
    viewIndex: 'View evidence index',
    uploadAnother: 'Upload another pack',
    computingHash: 'Computing SHA-256',
    hashError: 'Hash error',
    removeFile: 'Remove file',
    errors: {
      oversized: (count: number, max: string) => `${count} file(s) skipped: files must be <= ${max}.`,
      titleRequired: 'Pack title is required.',
      fileRequired: 'Please select at least one file.',
      hashPending: 'Please wait for SHA-256 computation to complete.',
      walletMissing: 'Wallet not connected. Please connect your Aptos wallet to upload to Shelby testnet.',
      configMissing:
        'NEXT_PUBLIC_TESTNET_API_KEY is missing. Configure a Shelby/Geomi frontend client API key and restart the app.',
      walletUnverified: 'Wallet is connected but not signature-verified. Verify from the top-right wallet control first.',
      wrongNetwork: (network: string) => `Wrong network: wallet is on "${network}". Switch to Aptos Testnet and reconnect.`,
      uploadFailed: 'Upload failed.',
    },
  },
};

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ModeIndicator({
  mode,
  configReady,
  walletConnected,
  walletAddress,
  walletNetwork,
}: {
  mode: 'mock' | 'testnet' | null;
  configReady: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  walletNetwork: Network | null;
}) {
  const { language } = useLanguage();
  const t = uploadCopy[language];
  if (mode === null) return null;

  const isTestnet = mode === 'testnet';

  if (!isTestnet) {
    return (
      <div className="mb-8 flex gap-3 border border-[#de8aff]/35 bg-[#fff2fb]/85 px-4 py-3 text-sm text-[#5f256e]">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">{t.localActive}</p>
          <p className="mt-1 leading-6">
            {t.localActiveBody}
          </p>
        </div>
      </div>
    );
  }

  if (!configReady) {
    return (
      <div className="mb-8 flex gap-3 border border-[#fd8565]/45 bg-[#fff0ea]/90 px-4 py-3 text-sm text-[#7d2a15]">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">{t.configMissingTitle}</p>
          <p className="mt-1 leading-6">
            {t.configMissingBody}
          </p>
        </div>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="mb-8 flex gap-3 border border-[#fd8565]/45 bg-[#fff0ea]/90 px-4 py-3 text-sm text-[#7d2a15]">
        <Wallet className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">{t.walletRequiredTitle}</p>
          <p className="mt-1 leading-6">
            {t.walletRequiredBody}
          </p>
        </div>
      </div>
    );
  }

  // Wallet connected but on the wrong network
  if (walletNetwork !== null && walletNetwork !== Network.TESTNET) {
    return (
      <div className="mb-8 flex gap-3 border border-red-400/45 bg-red-50/90 px-4 py-3 text-sm text-red-800">
        <WifiOff className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <p className="font-semibold">{t.wrongNetworkTitle}</p>
          <p className="mt-1 leading-6">
            {t.wrongNetworkBody}{' '}
            <span className="font-mono font-semibold">{walletNetwork}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex gap-3 border border-[#9fe878]/45 bg-[#f1ffe9]/90 px-4 py-3 text-sm text-[#275a1c]">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <p className="font-semibold">{t.walletReadyTitle}</p>
        <p className="mt-1 leading-6">
          {t.walletReadyBody}{' '}
          <span className="font-mono text-xs">{walletAddress ?? 'unknown'}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal wallet connection panel shown in testnet mode.
 * Lists detected wallets, allows connect/disconnect.
 */
function WalletConnector({
  wallets,
  notDetectedWallets,
  walletConnected,
  walletAddress,
  walletName,
  connect,
  disconnect,
}: {
  wallets: ReadonlyArray<AdapterWallet>;
  notDetectedWallets: ReadonlyArray<AdapterNotDetectedWallet>;
  walletConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  connect: (name: string) => void;
  disconnect: () => void;
}) {
  const { language } = useLanguage();
  const t = uploadCopy[language];

  if (walletConnected) {
    return (
      <div className="shelby-surface mb-6 shelby-cut p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-8 w-8 flex-none place-items-center border border-[#9fe878]/30 bg-[#9fe878]/10 text-[#9fe878]">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">
                {walletName ?? 'Wallet'} {t.walletConnected}
              </p>
              <p className="truncate font-mono text-xs text-[#f4f0e8]">
                {walletAddress ?? 'unknown'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="flex-none shelby-cut border border-white/12 px-3 py-1.5 text-xs font-semibold text-[#9d9a92] transition hover:border-red-400/60 hover:text-red-200"
          >
            {t.disconnect}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shelby-surface mb-6 shelby-cut p-4">
      <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#6f716d]">
        {t.connectWalletTitle}
      </p>
      {wallets.length === 0 && notDetectedWallets.length === 0 && (
        <p className="text-sm text-[#9d9a92]">
          {language === 'zh' ? '未检测到 Aptos 钱包。安装 ' : 'No Aptos wallets detected. Install '}
          <a
            href="https://petra.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#de8aff]"
          >
            Petra
          </a>{' '}
          {language === 'zh'
            ? '或其他 Aptos 钱包扩展后刷新页面。'
            : 'or another Aptos wallet extension and refresh the page.'}
        </p>
      )}
      {wallets.length > 0 && (
        <div className="grid gap-2">
          {wallets.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => connect(w.name)}
              className="flex items-center gap-3 shelby-cut border border-white/10 bg-white/[0.045] px-3 py-2.5 text-sm font-semibold text-[#f4f0e8] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
            >
              {w.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt={w.name} className="h-5 w-5 flex-none rounded" />
              )}
              {w.name}
            </button>
          ))}
        </div>
      )}
      {notDetectedWallets.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-[#9d9a92]">{t.notInstalled}</p>
          <div className="grid gap-1.5">
            {notDetectedWallets.map((w) => (
              <a
                key={w.name}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#9d9a92] underline hover:text-[#de8aff]"
              >
                {w.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepLabel({
  number,
  title,
  icon: Icon,
  inverse = false,
}: {
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  inverse?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold ${
          inverse ? 'bg-[#f4f0e8] text-[#111217]' : 'bg-[#9fe878]/10 text-[#9fe878] border border-[#9fe878]/30'
        }`}
      >
        {number}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#de8aff]" />
        <h2 className={`text-sm font-semibold uppercase ${inverse ? 'text-[#f4f0e8]' : 'text-[#f4f0e8]'}`}>
          {title}
        </h2>
      </div>
    </div>
  );
}

const participationIcons = [Wallet, HardDrive, UploadCloud, ShieldCheck];

function PublicTestnetGuide({ mode }: { mode: 'mock' | 'testnet' | null }) {
  const { language } = useLanguage();
  const t = uploadCopy[language];
  const isTestnet = mode === 'testnet';

  return (
    <section className="mb-8 shelby-surface shelby-cut p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-[#ff77c9]">
            {t.participationTitle}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#f4f0e8]">
            {t.participationBody}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 border px-3 py-1.5 font-mono text-xs font-semibold ${
            isTestnet
              ? 'border-[#9fe878]/35 bg-[#9fe878]/10 text-[#9fe878]'
              : 'border-[#de8aff]/35 bg-[#de8aff]/10 text-[#e7b6ff]'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isTestnet ? 'bg-[#9fe878]' : 'bg-[#de8aff]'}`} />
          {isTestnet ? t.participationBadgeTestnet : t.participationBadgeMock}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {t.participationSteps.map(([title, body, label, href], index) => {
          const Icon = participationIcons[index];
          return (
            <article key={title} className="border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center border border-[#9fe878]/25 bg-[#9fe878]/10 text-[#9fe878]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-xs font-bold text-[#6f716d]">0{index + 1}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#f4f0e8]">{title}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-[#9d9a92]">{body}</p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#de8aff] hover:text-[#ff77c9]"
              >
                {label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UploadPageContent() {
  const { language } = useLanguage();
  const t = uploadCopy[language];
  const [form, setForm] = useState<FormState>({
    title: '',
    category: 'dataset',
    sourceType: 'manual-upload',
    tags: '',
    description: '',
  });
  const [files, setFiles] = useState<UploadFileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadedResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'mock' | 'testnet' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shelbyUpload = useShelbyUpload();
  const walletSession = useWalletSessionVerification(shelbyUpload.walletAddress);

  useEffect(() => {
    getShelbyModeAction().then(setMode).catch(() => setMode('mock'));
  }, []);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setUploadError(t.errors.oversized(oversized.length, formatBytes(MAX_FILE_SIZE)));
    }

    const entries: UploadFileEntry[] = valid.map((f) => ({
      file: f,
      hash: null,
      hashStatus: 'pending',
    }));
    setFiles((prev) => [...prev, ...entries]);

    entries.forEach((entry) => {
      setFiles((prev) => {
        const next = [...prev];
        const pos = next.findIndex((e) => e.file === entry.file);
        if (pos !== -1) next[pos] = { ...next[pos], hashStatus: 'computing' };
        return next;
      });
      computeSHA256(entry.file)
        .then((hash) => {
          setFiles((prev) => {
            const next = [...prev];
            const pos = next.findIndex((e) => e.file === entry.file);
            if (pos !== -1) next[pos] = { ...next[pos], hash, hashStatus: 'done' };
            return next;
          });
        })
        .catch(() => {
          setFiles((prev) => {
            const next = [...prev];
            const pos = next.findIndex((e) => e.file === entry.file);
            if (pos !== -1) next[pos] = { ...next[pos], hashStatus: 'error' };
            return next;
          });
        });
    });
  }, [t.errors]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length) addFiles(chosen);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);

    if (!form.title.trim()) {
      setUploadError(t.errors.titleRequired);
      return;
    }
    if (files.length === 0) {
      setUploadError(t.errors.fileRequired);
      return;
    }
    const notReady = files.some((f) => f.hashStatus !== 'done');
    if (notReady) {
      setUploadError(t.errors.hashPending);
      return;
    }

    if (mode === 'testnet' && !shelbyUpload.configReady) {
      setUploadError(t.errors.configMissing);
      return;
    }

    if (mode === 'testnet' && !shelbyUpload.walletConnected) {
      setUploadError(t.errors.walletMissing);
      return;
    }

    if (
      mode === 'testnet' &&
      shelbyUpload.walletNetwork !== null &&
      shelbyUpload.walletNetwork !== Network.TESTNET
    ) {
      setUploadError(t.errors.wrongNetwork(String(shelbyUpload.walletNetwork)));
      return;
    }

    if (mode === 'testnet' && !walletSession.verified) {
      setUploadError(t.errors.walletUnverified);
      return;
    }

    setUploading(true);

    try {
      const tags = parseTags(form.tags);
      const pack = buildEvidencePack({
        title: form.title,
        category: form.category,
        sourceType: form.sourceType,
        tags,
        description: form.description,
        blobCount: files.length,
        dataSource: mode === 'testnet' ? 'shelby-testnet' : 'local',
      });

      const blobIds: string[] = [];
      const builtBlobs: BlobRecord[] = [];

      for (const entry of files) {
        const hash = entry.hash!;
        const mimeType = entry.file.type || 'application/octet-stream';

        if (mode === 'testnet') {
          // ── Testnet path: browser wallet upload via @shelby-protocol/react ──
          const buffer = await entry.file.arrayBuffer();
          const blobData = new Uint8Array(buffer);

          const testnetResult = await shelbyUpload.uploadBlob({
            packId: pack.id,
            fileName: entry.file.name,
            blobData,
            hash,
          });

          const blob = buildBlobRecord({
            evidencePackId: pack.id,
            hash,
            shelbyRef: testnetResult.shelbyRef,
            fileName: entry.file.name,
            size: entry.file.size,
            mimeType,
            tags,
            uploadMode: 'testnet',
            network: 'testnet',
            dataSource: 'shelby-testnet',
            accountAddress: testnetResult.accountAddress,
            blobName: testnetResult.blobName,
            expirationMicros: testnetResult.expirationMicros,
            storageStatus: testnetResult.storageStatus,
            explorerUrl: testnetResult.explorerUrl,
            retrievalUrl: testnetResult.retrievalUrl,
          });

          addLocalBlob(blob);
          builtBlobs.push(blob);
          blobIds.push(blob.id);
        } else {
          // ── Mock path: server action with deterministic local reference ──
          let content: string | undefined;
          try {
            const buffer = await entry.file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const chunkSize = 0x8000;
            let binary = '';
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
            }
            content = btoa(binary);
          } catch {
            content = undefined;
          }

          const actionResult = await shelbyUploadAction(
            hash,
            entry.file.size,
            {
              packId: pack.id,
              fileName: entry.file.name,
              mimeType,
            },
            content
          );

          if (!actionResult.success) {
            throw new Error(actionResult.error);
          }

          const blob = buildBlobRecord({
            evidencePackId: pack.id,
            hash,
            shelbyRef: actionResult.result.shelbyRef,
            mockRef: actionResult.result.mockRef,
            fileName: entry.file.name,
            size: entry.file.size,
            mimeType,
            tags,
            uploadMode: actionResult.mode,
            network: actionResult.result.network,
          });

          addLocalBlob(blob);
          builtBlobs.push(blob);
          blobIds.push(blob.id);
        }
      }

      addLocalPack(pack);

      const receipt: ReadReceipt = {
        id: `local-rr-${crypto.randomUUID()}`,
        runId: `upload-${pack.id}`,
        query: `Evidence pack "${pack.title}" uploaded via ${mode === 'testnet' ? 'Shelby testnet' : 'local mock'} upload.`,
        answerSummary: `${blobIds.length} blob${blobIds.length !== 1 ? 's' : ''} sealed into evidence pack "${pack.title}". Each blob hash was computed in-browser before storage. Pack ID: ${pack.id}.`,
        referencedBlobIds: blobIds,
        evidencePackIds: [pack.id],
        timestamp: new Date().toISOString(),
        agentVersion: 'shelby-vault/upload',
        receiptMode: mode === 'testnet' ? 'shelby-testnet' : 'local',
      };
      addLocalReadReceipt(receipt);

      // Persist to SQLite (server-side) so uploads survive localStorage resets
      // and are visible across browser sessions.  Errors are non-fatal.
      try {
        await persistUploadAction(pack, builtBlobs, receipt);
      } catch {
        // SQLite persistence failure is non-fatal — localStorage already holds
        // the records and the upload itself succeeded.
      }

      setUploadResult({ packId: pack.id, packTitle: pack.title, blobIds, mode: mode ?? 'mock', receiptId: receipt.id });
      setFiles([]);
      setForm({
        title: '',
        category: 'dataset',
        sourceType: 'manual-upload',
        tags: '',
        description: '',
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  if (uploadResult) {
    const isTestnet = uploadResult.mode === 'testnet';
    const blobCountText =
      language === 'zh'
        ? `${uploadResult.blobIds.length} 个 Blob`
        : `${uploadResult.blobIds.length} blob${uploadResult.blobIds.length !== 1 ? 's' : ''}`;
    return (
      <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="shelby-surface shelby-cut p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center border border-[#9fe878]/35 bg-[#9fe878]/10 text-[#9fe878]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-mono text-xs font-semibold uppercase text-[#ff77c9]">
              {isTestnet ? t.successTestnet : t.successLocal}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#f4f0e8]">
              {uploadResult.packTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9d9a92]">
              {blobCountText} {isTestnet ? t.successTestnetBody : t.successLocalBody}
            </p>

            <div className="mt-8 shelby-cut border border-white/10 bg-white/[0.045] p-4">
              <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#6f716d]">
                {t.readReceipt}
              </p>
              <Link
                href={`/read-receipt/${uploadResult.receiptId}`}
                className="group flex items-center justify-between border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f4f0e8] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
              >
                <span className="truncate font-mono">/read-receipt/{uploadResult.receiptId}</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-4 shelby-cut border border-white/10 bg-white/[0.045] p-4">
              <p className="mb-3 font-mono text-xs font-semibold uppercase text-[#6f716d]">
                {t.blobPages}
              </p>
              <div className="grid gap-2">
                {uploadResult.blobIds.map((blobId) => (
                  <Link
                    key={blobId}
                    href={`/blob/${blobId}`}
                    className="group flex items-center justify-between border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f4f0e8] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
                  >
                    <span className="truncate font-mono">/blob/{blobId}</span>
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="ui-button shelby-cut-sm"
              >
                {t.viewIndex}
                <ChevronRight className="h-4 w-4" />
              </Link>
              {isTestnet && (
                <Link
                  href="/testnet"
                  className="ui-button ui-button-secondary shelby-cut-sm"
                >
                  {t.sessionConsole}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={() => setUploadResult(null)}
                className="ui-button ui-button-secondary shelby-cut-sm"
              >
                {t.uploadAnother}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTestnet = mode === 'testnet';
  const testnetMissingConfig = isTestnet && !shelbyUpload.configReady;
  const wrongNetwork =
    isTestnet &&
    shelbyUpload.walletConnected &&
    shelbyUpload.walletNetwork !== null &&
    shelbyUpload.walletNetwork !== Network.TESTNET;
  const testnetRequiresWallet = isTestnet && (!shelbyUpload.walletConnected || wrongNetwork);
  const testnetRequiresSignature =
    isTestnet && !testnetMissingConfig && shelbyUpload.walletConnected && !wrongNetwork && !walletSession.verified;
  const submitLabel = uploading
    ? isTestnet
      ? t.submit.uploadingTestnet
      : t.submit.savingLocal
    : isTestnet
      ? testnetMissingConfig
        ? t.submit.configMissing
        : shelbyUpload.walletConnected && !wrongNetwork && walletSession.verified
        ? t.submit.uploadTestnet
        : wrongNetwork
          ? t.submit.wrongNetwork
          : shelbyUpload.walletConnected
            ? t.submit.verifyWallet
          : t.submit.connectWallet
      : t.submit.saveLocal;

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="ui-chip mb-4">
              <FileUp className="h-3.5 w-3.5 text-[#de8aff]" />
              {t.intake}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold text-[#f4f0e8]">
              {t.title}
            </h1>
            <span className="sr-only">Package files into a verifiable</span>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#9d9a92]">
              {isTestnet ? t.testnetSubtitle : t.mockSubtitle}
            </p>
          </div>
          <div className="shelby-surface shelby-cut p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-[#9fe878]/30 bg-[#9fe878]/10 text-[#9fe878]">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#6f716d]">
                  {t.storage}
                </p>
                <p className="text-sm font-semibold text-[#f4f0e8]">
                  {isTestnet ? t.testnetStorage : t.mockStorage}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ModeIndicator
          mode={mode}
          configReady={shelbyUpload.configReady}
          walletConnected={shelbyUpload.walletConnected}
          walletAddress={shelbyUpload.walletAddress}
          walletNetwork={shelbyUpload.walletNetwork}
        />

        <PublicTestnetGuide mode={mode} />

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="shelby-surface shelby-cut p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-[#9d9a92]">
              <HardDrive className="h-3.5 w-3.5 text-[#9fe878]" />
              {t.protocolPreviewTitle}
            </div>
            <p className="text-sm leading-6 text-[#f4f0e8]">{t.protocolPreviewBody}</p>
          </div>
          <div className="shelby-surface shelby-cut p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-[#9d9a92]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#de8aff]" />
              {t.protocolTestnetTitle}
            </div>
            <p className="text-sm leading-6 text-[#f4f0e8]">{t.protocolTestnetBody}</p>
          </div>
        </section>

        {isTestnet && (
          <WalletConnector
            wallets={shelbyUpload.wallets}
            notDetectedWallets={shelbyUpload.notDetectedWallets}
            walletConnected={shelbyUpload.walletConnected}
            walletAddress={shelbyUpload.walletAddress}
            walletName={shelbyUpload.walletName}
            connect={shelbyUpload.connect}
            disconnect={shelbyUpload.disconnect}
          />
        )}

        {uploadError && (
          <div className="mb-6 flex items-start gap-3 border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{uploadError}</span>
          </div>
        )}

        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]" onSubmit={handleSubmit}>
          <section className="shelby-surface shelby-cut p-5">
            <StepLabel number="01" title={t.stepMeta} icon={FileText} />

            <div className="grid gap-5">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-[#f4f0e8]">
                  {t.labels.title} <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder={t.placeholders.title}
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category"
                    className="mb-1.5 block text-sm font-semibold text-[#f4f0e8]"
                  >
                    {t.labels.category}
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className={fieldClass}
                  >
                    <option value="dataset">{t.categories[0]}</option>
                    <option value="agent-run">{t.categories[1]}</option>
                    <option value="document">{t.categories[2]}</option>
                    <option value="manifest">{t.categories[3]}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sourceType"
                    className="mb-1.5 block text-sm font-semibold text-[#f4f0e8]"
                  >
                    {t.labels.sourceType}
                  </label>
                  <select
                    id="sourceType"
                    name="sourceType"
                    value={form.sourceType}
                    onChange={handleFormChange}
                    className={fieldClass}
                  >
                    <option value="web-scrape">{t.sources[0]}</option>
                    <option value="api-export">{t.sources[1]}</option>
                    <option value="agent-output">{t.sources[2]}</option>
                    <option value="manual-upload">{t.sources[3]}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold text-[#f4f0e8]">
                  {t.labels.tags}{' '}
                  <span className="font-normal text-[#9d9a92]">({t.labels.tagsHelp})</span>
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={form.tags}
                  onChange={handleFormChange}
                  placeholder={t.placeholders.tags}
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-semibold text-[#f4f0e8]"
                >
                  {t.labels.description}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={7}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder={t.placeholders.description}
                  className={`${fieldClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="shelby-surface shelby-cut p-5">
              <StepLabel number="02" title={t.stepFiles} icon={Hash} />
              <div
                className={`cursor-pointer shelby-cut border border-dashed px-5 py-8 text-center transition ${
                  dragging
                    ? 'border-[#de8aff] bg-[#eee2ff]'
                    : 'border-white/14 bg-white/[0.045] hover:border-[#de8aff]/50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-[#9fe878]/30 bg-[#9fe878]/10 text-[#9fe878]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[#f4f0e8]">{t.drop}</p>
                <p className="mt-1 text-xs leading-5 text-[#9d9a92]">
                  {t.maxFile} {formatBytes(MAX_FILE_SIZE)}. {t.hashNote}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.json,.csv,.txt,.md,application/pdf,application/json,text/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((entry, idx) => (
                    <li
                      key={`${entry.file.name}-${idx}`}
                      className="flex items-start gap-3 shelby-cut border border-white/10 bg-white/[0.045] px-3 py-3 text-sm"
                    >
                      <FileText className="mt-0.5 h-4 w-4 flex-none text-[#de8aff]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[#f4f0e8]">
                          {entry.file.name}
                        </span>
                        <span className="text-xs text-[#9d9a92]">{formatBytes(entry.file.size)}</span>
                        {entry.hashStatus === 'computing' && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-[#de8aff]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t.computingHash}
                          </span>
                        )}
                        {entry.hashStatus === 'done' && entry.hash && (
                          <span className="mt-1 block truncate font-mono text-xs text-[#9d9a92]">
                            {entry.hash}
                          </span>
                        )}
                        {entry.hashStatus === 'error' && (
                          <span className="mt-1 block text-xs text-red-600">{t.hashError}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="grid h-8 w-8 flex-none place-items-center text-[#9d9a92] transition hover:bg-red-500/10 hover:text-red-200"
                        aria-label={t.removeFile}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="shelby-cut border border-[#9fe878]/25 bg-[#101813] p-5 text-[#f4f0e8] shadow-sm">
              <StepLabel
                number="03"
                title={isTestnet ? t.stepTestnet : t.stepSave}
                icon={isTestnet ? Wallet : ShieldCheck}
                inverse
              />
              <p className="text-sm leading-6 text-[#9d9a92]">
                {isTestnet
                  ? t.testnetBody
                  : t.saveBody}
              </p>
              <button
                type="submit"
                disabled={
                  uploading ||
                  files.length === 0 ||
                  testnetMissingConfig ||
                  testnetRequiresWallet ||
                  testnetRequiresSignature
                }
                className="ui-button shelby-cut-sm mt-5 w-full disabled:cursor-not-allowed disabled:opacity-55"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitLabel}
              </button>
              {testnetMissingConfig && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  {t.configHint}
                </p>
              )}
              {!testnetMissingConfig && testnetRequiresWallet && !wrongNetwork && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  {t.connectHint}
                </p>
              )}
              {testnetRequiresSignature && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  {t.verifyHint}
                </p>
              )}
              {wrongNetwork && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  {t.wrongHint}
                </p>
              )}
              {!isTestnet && (
                <p className="mt-3 text-xs leading-5 text-[#8793AA]">
                  {t.mockHint}
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return <UploadPageContent />;
}
