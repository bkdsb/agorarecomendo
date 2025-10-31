"use client";

import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function BannersPage() {
  const { t } = useLanguage();
  // TODO: Implement banners listing and management
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{t('banners.title') || 'Banners'}</h1>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <PlusCircle className="w-4 h-4" />
          {t('banners.new') || 'New Banner'}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Placeholder - add banners listing here */}
        <div className="text-center py-8 text-muted-foreground">
          {t('banners.placeholder') || 'In development...'}
        </div>
      </div>
    </div>
  );
}