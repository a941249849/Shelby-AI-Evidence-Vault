'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'shelby_vault_wallet_session';
const EVENT_NAME = 'shelby-wallet-session-change';

interface WalletSessionRecord {
  accountAddress: string;
  verifiedAt: string;
}

function readSession(): WalletSessionRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WalletSessionRecord>;
    if (!parsed.accountAddress || !parsed.verifiedAt) return null;
    return {
      accountAddress: parsed.accountAddress,
      verifiedAt: parsed.verifiedAt,
    };
  } catch {
    return null;
  }
}

function writeSession(record: WalletSessionRecord | null) {
  if (typeof window === 'undefined') return;
  if (record) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useWalletSessionVerification(accountAddress?: string | null) {
  const [session, setSession] = useState<WalletSessionRecord | null>(null);

  useEffect(() => {
    const sync = () => setSession(readSession());

    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const markVerified = useCallback((nextAccountAddress: string) => {
    writeSession({
      accountAddress: nextAccountAddress,
      verifiedAt: new Date().toISOString(),
    });
  }, []);

  const clearVerification = useCallback(() => {
    writeSession(null);
  }, []);

  const verified =
    Boolean(accountAddress) &&
    Boolean(session) &&
    session?.accountAddress.toLowerCase() === accountAddress?.toLowerCase();

  return {
    verified,
    verifiedAt: verified ? session?.verifiedAt ?? null : null,
    markVerified,
    clearVerification,
  };
}
