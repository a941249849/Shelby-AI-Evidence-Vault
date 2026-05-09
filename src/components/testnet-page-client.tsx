'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useLanguage, type Language } from '@/components/language-state';

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
    enabled: string;
    enabledBody: string;
    mock: string;
    mockBody: string;
    steps: Array<[string, string, string]>;
    acceptanceTitle: string;
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

  const launchChecks: Array<{ label: string; value: string; ok: boolean }> = [
    { label: 'SHELBY_MODE', value: enabled ? 'testnet' : 'mock', ok: enabled },
    { label: 'NEXT_PUBLIC_SHELBY_NETWORK', value: 'testnet', ok: true },
    { label: 'Wallet custody', value: 'browser wallet only', ok: true },
    { label: 'Mainnet claim', value: 'none', ok: true },
  ];

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

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <InfoPanel icon={FileCheck2} title={t.acceptanceTitle} items={t.acceptance} />
          <InfoPanel icon={ShieldCheck} title={t.boundaryTitle} items={t.boundaries} green />
        </section>
      </div>
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
