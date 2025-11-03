'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useLanguage } from '@/components/LanguageProvider';

export default function DeleteCategoryButton({ categoryId, onDeleted }: { categoryId: string; onDeleted?: (id: string) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  async function onDelete(e: React.MouseEvent<HTMLButtonElement>) {
    const anchor = { x: e.clientX, y: e.clientY };
    const confirmed = await toast.confirm({
      title: t('categories.deleteTitle') || 'Delete category?',
      description: t('categories.deleteDesc') || 'Products will be unassociated; this action is irreversible.',
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      placement: 'center',
    });
    if (!confirmed) return;
    try {
      setBusy(true);
  const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
  // Optimistic local update (if parent provided a callback)
  onDeleted?.(categoryId);
  // Also trigger a soft refresh as fallback in case other server data depends on it
  router.refresh();
      toast.success(t('categories.deleted') || 'Category deleted', undefined, { anchor });
    } catch (err) {
      toast.error(t('categories.deleteError') || 'Error deleting category', undefined, { anchor });
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="rounded-md p-2 border border-border text-red-500 hover:bg-card/60 disabled:opacity-50"
      title={t('common.delete') || 'Delete'}
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}
