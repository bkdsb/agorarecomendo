'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.MouseEvent<HTMLButtonElement>) {
    const anchor = { x: e.clientX, y: e.clientY };
    const confirmed = await toast.confirm({
      title: 'Excluir categoria?',
      description: 'Produtos serão desassociados; ação irreversível.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      placement: 'center',
    });
    if (!confirmed) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      router.refresh();
      toast.success('Categoria excluída', undefined, { anchor });
    } catch (err) {
      toast.error('Erro ao excluir categoria', undefined, { anchor });
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="rounded-md p-2 border border-border text-red-500 hover:bg-card/60 disabled:opacity-50"
      title="Excluir"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}
