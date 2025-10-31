"use client";

import { useEffect, useState } from 'react';
import DeleteCategoryButton from '@/app/admin-secret-xyz/categories/DeleteCategoryButton';
import CreateCategoryForm from '@/app/admin-secret-xyz/categories/CreateCategoryForm';
import { useLanguage } from '@/components/LanguageProvider';

export default function CategoriesPage() {
  const { t, locale } = useLanguage() as { t: (k: string)=> string; locale: 'en-US' | 'pt-BR' };
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setCategories(data);
      } catch (e) {
        console.error('Failed to fetch categories', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{t('categories.title') || 'Categories'}</h1>
      </div>

      <CreateCategoryForm />

      {loading ? (
        <div className="text-foreground/70">{t('common.loading') || 'Loading...'}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const displayName = locale === 'pt-BR' && cat.namePtBr ? cat.namePtBr : cat.name;
            return (
            <div key={cat.id} className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 hover:bg-card/80 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-foreground">{displayName}</div>
                  <div className="mt-1 truncate text-xs text-foreground/70">/{cat.slug}</div>
                </div>
                <DeleteCategoryButton categoryId={cat.id} />
              </div>
              <div className="mt-3 text-xs text-foreground/60">
                {cat._count?.products ?? 0} {t('categories.products') || 'product(s)'}
              </div>
            </div>
          );})}
          {categories.length === 0 && (
            <div className="col-span-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 text-center text-sm text-foreground/70">
              {t('categories.empty') || 'No categories yet. Create the first one above.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
