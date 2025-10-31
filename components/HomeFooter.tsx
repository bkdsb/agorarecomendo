'use client';

import { useLanguage } from './LanguageProvider';

export default function HomeFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-border mt-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-foreground/70">
            © {new Date().getFullYear()} AgoraRecomendo. {t('footer.copyright')}
          </span>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground">
              {t('footer.privacy')}
            </a>
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground">
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
