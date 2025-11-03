"use client";

import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/components/LanguageProvider';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  
  const handleLogout = () => signOut({ callbackUrl: "/" });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">{t('settings.title') || 'Settings'}</h1>
      
      <div className="max-w-2xl space-y-8">
        {/* User information */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t('settings.userInfo') || 'User Information'}</h2>
          <div className="space-y-2">
            <p><strong>{t('settings.name') || 'Name'}:</strong> {session?.user?.name}</p>
            <p><strong>{t('settings.email') || 'Email'}:</strong> {session?.user?.email}</p>
          </div>
        </section>

        {/* Useful links */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t('settings.usefulLinks') || 'Useful Links'}</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="https://github.com/bkdsb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {t('settings.github') || 'GitHub'}
              </a>
            </li>
            <li>
              <a 
                href="https://docs.github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {t('settings.documentation') || 'Documentation'}
              </a>
            </li>
          </ul>
        </section>

        {/* Logout section */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">{t('settings.dangerZone') || 'Danger Zone'}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('settings.logoutDescription') || 'Sign out from your account and return to the home page.'}</p>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium transition-all border border-red-500/20 hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            {t('header.logout') || 'Logout'}
          </button>
        </section>
      </div>
    </div>
  );
}