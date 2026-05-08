'use client';

import { useI18n } from '@/components/language-provider';

export default function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-[#2d211c]/10 bg-[#f4efe2] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-[#6f6258]">{t('footer.summary')}</p>
        <p className="text-xs text-[#978978]">{t('footer.license')}</p>
      </div>
    </footer>
  );
}
