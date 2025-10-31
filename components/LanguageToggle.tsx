"use client";

import { useLanguage } from './LanguageProvider';
import { useRouter } from 'next/navigation';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const router = useRouter();
  const isEN = locale === 'en-US';

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={async () => { await setLocale('en-US'); router.refresh(); }}
        className={`w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-90 transition ${isEN ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border'}`}
        aria-label="Switch to English"
        title="English"
      >
        <span className="text-[13px]">🇺🇸</span>
      </button>
      <button
        type="button"
        onClick={async () => { await setLocale('pt-BR'); router.refresh(); }}
        className={`w-7 h-7 rounded-full border flex items-center justify-center hover:opacity-90 transition ${!isEN ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border'}`}
        aria-label="Mudar para Português"
        title="Português (Brasil)"
      >
        <span className="text-[13px]">🇧🇷</span>
      </button>
    </div>
  );
}
