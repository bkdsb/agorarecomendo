'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Função para deletar produto
  async function handleDelete(e?: React.MouseEvent) {
    const clickPos = e ? { x: e.clientX, y: e.clientY } : undefined;
    const confirmed = await toast.confirm({
      title: 'Excluir produto?',
      description: 'Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      placement: 'center',
    });
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao deletar produto');

  router.refresh();
  // permanecer na lista e exibir toast ancorado próximo ao botão
  toast.success('Produto excluído', undefined, { anchor: clickPos });
    } catch (err) {
      toast.error('Erro ao deletar produto', undefined, { anchor: clickPos });
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={(e)=>handleDelete(e)}
      disabled={isDeleting}
      className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
      title="Deletar"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}