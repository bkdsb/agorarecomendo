'use client';

import { useLanguage } from './LanguageProvider';

export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Fundo com gradiente e blur mais sutil + parallax */}
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[15%] left-[8%] w-[45vw] h-[45vw] rounded-full bg-blue-500/12 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/12 blur-3xl" />
      </div>
      
      <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground">
          {t('home.hero.title')}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-foreground/70">
          {t('home.hero.subtitle')}
        </p>
        <a
          href="#recentes"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90 shadow-sm"
        >
          {t('home.hero.cta')}
        </a>
      </div>
    </section>
  );
}
