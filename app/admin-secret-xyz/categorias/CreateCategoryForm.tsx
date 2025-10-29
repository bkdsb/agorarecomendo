'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function CreateCategoryForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleCreate(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const anchor = { x: e.clientX, y: e.clientY };
    if (!name.trim()) {
      toast.error('Informe o nome da categoria', undefined, { anchor });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Falha ao criar');
      setName('');
      router.refresh();
      toast.success('Categoria criada', undefined, { anchor });
    } catch (err) {
      toast.error('Erro ao criar categoria', undefined, { anchor });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-foreground/70">Nome da categoria</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Tecnologia"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-foreground/50 focus:border-blue-500/30"
          />
        </div>
        <div className="sm:pt-6">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Criar categoria
          </button>
        </div>
      </form>
    </div>
  );
}
