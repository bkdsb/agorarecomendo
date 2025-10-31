"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type Messages = Record<string, string>;

type LanguageContextType = {
  locale: string;
  t: (key: string) => string;
  setLocale: (locale: 'en-US' | 'pt-BR') => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default function LanguageProvider({
  children,
  initialLocale = 'en-US',
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale?: 'en-US' | 'pt-BR';
  initialMessages: { [locale: string]: Messages };
}) {
  const [locale, setLocaleState] = useState<'en-US' | 'pt-BR'>(initialLocale);

  const t = useMemo(() => {
    const msgs: Messages = initialMessages[locale] || {};
    return (key: string) => msgs[key] ?? key;
  }, [locale, initialMessages]);

  const setLocale: LanguageContextType['setLocale'] = async (loc) => {
    try {
      // Persist cookie via API for SSR-aware refresh and await completion
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: loc }),
      });
    } finally {
      // Update state so client components re-render immediately
      setLocaleState(loc);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}
