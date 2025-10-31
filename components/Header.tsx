"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Package, Settings } from 'lucide-react';
import ThemeToggleButton from './ThemeToggleButton';
import LanguageToggle from './LanguageToggle';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

type HeaderProps = {
  /**
   * Quando fornecido (e usuário autenticado), mostra um atalho "Editar artigo"
   * no header (desktop e mobile). Útil para páginas de artigo público.
   */
  editHref?: string;
};

export default function Header({ editHref }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();
  
  const isAdmin = pathname?.startsWith('/admin-secret-xyz');
  
  const adminMenuItems = [
    {
      href: '/admin-secret-xyz/products',
      label: t('admin.products'),
      icon: Package,
    },
    {
      href: '/admin-secret-xyz/settings',
      label: t('admin.settings'),
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-md">
      <nav className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-foreground">
            AgoraRecomendo
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {!isAdmin && (
              <>
                <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-foreground">
                  {t('header.home')}
                </Link>
                <Link href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground">
                  {t('header.categories')}
                </Link>
                {status === 'authenticated' && editHref && (
                  <Link
                    href={editHref}
                    className="inline-flex items-center rounded-full bg-blue-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-blue-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  >
                    {t('header.editArticle')}
                  </Link>
                )}
              </>
            )}
            
            {isAdmin && status === 'authenticated' && (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground"
                >
                  {t('header.backToSite')}
                </Link>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  // Verifica se o pathname começa com o href do item
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 text-sm font-medium ${
                        isActive 
                          ? 'text-blue-500' 
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
            
            {/* 3. Lógica de Login/Logout (Desktop) */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggleButton />
            </div>
            {status === 'loading' && (
              <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
            )}
            {status === 'authenticated' && session.user && (
              <div className="flex items-center gap-4">
                {!isAdmin && (
                  <Link
                    href="/admin-secret-xyz"
                    className="text-sm font-medium text-foreground/70 hover:text-foreground"
                  >
                    {t('header.dashboard')}
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground"
                >
                  {t('header.logout')}
                </button>
                <Image
                  src={session.user.image || '/globe.svg'}
                  alt={session.user.name || 'Avatar'}
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggleButton />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-foreground/70 hover:text-foreground"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay Menu Mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 h-[calc(100vh-4rem)] 
                      md:hidden 
                      bg-background/70 backdrop-blur-sm
                      flex flex-col items-center justify-center gap-8
                      animate-in fade-in-20 slide-in-from-top-4">
          
          {!isAdmin && (
            <>
              <Link href="/" className="text-2xl font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>
                {t('header.home')}
              </Link>
              <Link href="#" className="text-2xl font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>
                {t('header.categories')}
              </Link>
              {status === 'authenticated' && editHref && (
                <Link
                  href={editHref}
                  className="inline-flex items-center rounded-full bg-blue-600 text-white text-base font-medium px-4 py-2 hover:bg-blue-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('header.editArticle')}
                </Link>
              )}
            </>
          )}
          
          {isAdmin && status === 'authenticated' && (
            <>
              <Link
                href="/"
                className="text-2xl font-medium text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.backToSite')}
              </Link>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-2xl font-medium ${
                      isActive 
                        ? 'text-blue-500' 
                        : 'text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-6 h-6" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
          
          {/* 4. Lógica de Login/Logout (Mobile) */}
          {status === 'authenticated' && session.user && (
            <>
              <Image
                src={session.user.image || '/globe.svg'}
                alt={session.user.name || 'Avatar'}
                width={64}
                height={64}
                className="rounded-full"
                unoptimized
              />
              {!isAdmin && (
                <Link
                  href="/admin-secret-xyz"
                  className="text-2xl font-medium text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('header.dashboard')}
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-2xl font-medium text-foreground"
              >
                {t('header.logout')}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
