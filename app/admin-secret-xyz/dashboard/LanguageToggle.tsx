'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    const newLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 hover:bg-accent rounded-lg transition-colors group relative"
      aria-label="Toggle language"
    >
      <Globe className="w-5 h-5" />
      {/* Tooltip */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border">
        {locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
      </span>
    </button>
  );
}
