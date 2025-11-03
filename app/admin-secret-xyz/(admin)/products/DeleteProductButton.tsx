'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Function to delete product
  async function handleDelete(e?: React.MouseEvent) {
    const clickPos = e ? { x: e.clientX, y: e.clientY } : undefined;
    const confirmed = await toast.confirm({
      title: 'Delete product?',
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      placement: 'center',
    });
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete product');

  router.refresh();
  // stay on list and show toast anchored near button
  toast.success('Product deleted', undefined, { anchor: clickPos });
    } catch (err) {
      toast.error('Error deleting product', undefined, { anchor: clickPos });
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={(e)=>handleDelete(e)}
      disabled={isDeleting}
      className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}