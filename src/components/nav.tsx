'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Database, ExternalLink, FileUp, Languages, Loader2, ReceiptText, ShieldCheck, Wallet, WifiOff } from 'lucide-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useLanguage } from '@/components/language-state';
import { useWalletSessionVerification } from '@/components/wallet-session-state';

const copy = {
  zh: {
    subtitle: 'AI 证据回执层',
    product: '首页',
    testnet: '测试网',
    registry: '证据库',
    create: '创建证据',
    receipt: '验证回执',
    language: '中文 / EN',
    wallet: {
      connect: '连接钱包',
      connected: '已连接',
      verified: '已签名验证',
      verify: '签名验证',
      wrongNetwork: '切换 Testnet',
      disconnect: '断开',
      noWallet: '未检测到 Aptos 钱包',
      install: '安装钱包',
      github: 'GitHub',
      challenge: '验证 Shelby Evidence Vault 会话',
    },
  },
  en: {
    subtitle: 'AI evidence receipt layer',
    product: 'Home',
    testnet: 'Testnet',
    registry: 'Registry',
    create: 'Create evidence',
    receipt: 'Verify receipt',
    language: 'EN / 中文',
    wallet: {
      connect: 'Connect wallet',
      connected: 'Connected',
      verified: 'Signed',
      verify: 'Verify signature',
      wrongNetwork: 'Switch Testnet',
      disconnect: 'Disconnect',
      noWallet: 'No Aptos wallet detected',
      install: 'Install wallet',
      github: 'GitHub',
      challenge: 'Verify Shelby Evidence Vault session',
    },
  },
};

function WalletControl() {
  const { language } = useLanguage();
  const t = copy[language].wallet;
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountAddress = wallet.account?.address?.toString() ?? null;
  const walletNetwork = wallet.network?.name ? String(wallet.network.name) : null;
  const walletReady = wallet.connected && walletNetwork === Network.TESTNET;
  const shortAddress = accountAddress ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}` : '';
  const { verified, markVerified, clearVerification } = useWalletSessionVerification(accountAddress);

  function connect(name: string) {
    setError(null);
    clearVerification();
    wallet.connect(name);
    setOpen(false);
  }

  async function disconnect() {
    setError(null);
    clearVerification();
    wallet.disconnect();
  }

  async function verifySignature() {
    if (!wallet.connected) return;
    setError(null);
    setVerifying(true);
    try {
      const ok = await wallet.signMessageAndVerify({
        address: true,
        application: true,
        chainId: true,
        message: t.challenge,
        nonce: crypto.randomUUID(),
      });
      if (ok && accountAddress) markVerified(accountAddress);
      if (!ok) setError(language === 'zh' ? '签名验证未通过' : 'Signature verification failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
          verified
            ? 'border-[#8fdc7d]/50 bg-[#ecffe8] text-[#245f1b]'
            : wallet.connected
              ? 'border-[#ff9aca]/55 bg-[#fff2f9] text-[#2f1f12]'
              : 'border-[#d8c8be] bg-[#2f1f12] text-white hover:bg-[#ff5fb8]'
        }`}
      >
        {verified ? <CheckCircle2 size={15} /> : walletReady ? <Wallet size={15} /> : wallet.connected ? <WifiOff size={15} /> : <Wallet size={15} />}
        <span className="hidden sm:inline">
          {verified ? t.verified : wallet.connected ? shortAddress || t.connected : t.connect}
        </span>
        <span className="sm:hidden">{verified ? t.verified : wallet.connected ? t.connected : t.connect}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] border border-[#eadfd6] bg-[#fffdf9] p-3 shadow-[0_24px_70px_rgba(47,31,18,0.18)]">
          {wallet.connected ? (
            <div className="space-y-3">
              <div className="border border-[#eadfd6] bg-[#fffaf4] p-3">
                <p className="font-mono text-[0.68rem] font-bold uppercase text-[#7b695d]">{wallet.wallet?.name ?? 'Wallet'}</p>
                <p className="mt-1 truncate font-mono text-xs text-[#2f1f12]">{accountAddress}</p>
                <p className={`mt-2 text-xs font-bold ${walletReady ? 'text-[#317c24]' : 'text-[#9a361f]'}`}>
                  {walletReady ? 'Aptos Testnet' : `${t.wrongNetwork}: ${walletNetwork ?? 'unknown'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={verifySignature}
                disabled={verifying}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2f1f12] px-4 text-sm font-bold text-white transition hover:bg-[#ff5fb8] disabled:opacity-60"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck size={15} />}
                {verified ? t.verified : t.verify}
              </button>
              {error && <p className="text-xs leading-5 text-[#9a361f]">{error}</p>}
              <button
                type="button"
                onClick={disconnect}
                className="h-9 w-full border border-[#d8c8be] text-sm font-bold text-[#6d5f55] transition hover:border-[#fd8565]/60 hover:text-[#9a361f]"
              >
                {t.disconnect}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.wallets.length > 0 ? (
                wallet.wallets.map((candidate) => (
                  <button
                    key={candidate.name}
                    type="button"
                    onClick={() => connect(candidate.name)}
                    className="flex w-full items-center justify-between gap-3 border border-[#eadfd6] bg-[#fffaf4] px-3 py-2.5 text-left text-sm font-bold text-[#2f1f12] transition hover:border-[#ff9aca] hover:text-[#ff4faf]"
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
                ))
              ) : (
                <p className="text-sm text-[#6d5f55]">{t.noWallet}</p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-[#eadfd6] pt-3">
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff4faf] underline"
                >
                  {t.install}
                  <ExternalLink size={13} />
                </a>
                <a
                  href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6d5f55] underline"
                >
                  {t.github}
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const { language, toggleLanguage } = useLanguage();
  const t = copy[language];
  const links = [
    { href: '/', label: t.product, icon: ShieldCheck },
    { href: '/testnet', label: t.testnet, icon: Wallet },
    { href: '/dashboard', label: t.registry, icon: Database },
    { href: '/upload', label: t.create, icon: FileUp },
    { href: '/read-receipt/rr-001', label: t.receipt, icon: ReceiptText },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#eadfd6] bg-[#fffaf4]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.45rem] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="shelby-symbol flex-none" aria-hidden="true">
            <span />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-lg font-black text-[#2f1f12] transition group-hover:text-[#ff4faf]">
              Shelby AI Evidence Vault
            </span>
            <span className="block font-mono text-[0.68rem] font-semibold uppercase text-[#7b695d]">
              {t.subtitle}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex h-10 items-center gap-1.5 border border-transparent px-3 text-sm font-bold text-[#433328] transition hover:border-[#e5d7cf] hover:bg-[#fff2f9] hover:text-[#ff4faf]"
            >
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLanguage}
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dfd2c9] bg-[#fffdf9] px-3 text-sm font-bold text-[#433328] transition hover:border-[#ff9aca] hover:text-[#ff4faf]"
            aria-label="Toggle language"
          >
            <Languages size={15} />
            <span>{t.language}</span>
          </button>
          <WalletControl />
        </div>
      </div>
    </nav>
  );
}
