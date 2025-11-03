"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DeleteCategoryButton from '@/app/admin-secret-xyz/(admin)/categories/DeleteCategoryButton';
import CreateCategoryForm from '@/app/admin-secret-xyz/(admin)/categories/CreateCategoryForm';
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

  <CreateCategoryForm onCreated={(cat)=> setCategories((prev)=> [cat, ...prev])} />

      {loading ? (
        <div className="text-foreground/70">{t('common.loading') || 'Loading...'}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {categories.map((cat) => {
              const displayName = locale === 'pt-BR' && cat.namePtBr ? cat.namePtBr : cat.name;
              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 hover:bg-card/80 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium text-foreground">{displayName}</div>
                      <div className="mt-1 truncate text-xs text-foreground/70">/{cat.slug}</div>
                    </div>
                    <DeleteCategoryButton categoryId={cat.id} onDeleted={(id)=> setCategories((prev)=> prev.filter((c)=> c.id !== id))} />
                  </div>
                  <div className="mt-3 text-xs text-foreground/60">
                    {cat._count?.products ?? 0} {t('categories.products') || 'product(s)'}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <AnimatePresence>
            {categories.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="col-span-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 text-center text-sm text-foreground/70"
              >
                {t('categories.empty') || 'No categories yet. Create the first one above.'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
