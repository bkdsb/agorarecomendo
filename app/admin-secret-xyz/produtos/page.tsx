import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit } from 'lucide-react';
import prisma from '@/lib/prisma';
import DeleteProductButton from './DeleteProductButton';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      links: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link
          href="/admin-secret-xyz/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-foreground/70">
          Nenhum produto cadastrado.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition"
            >
              <Image
                src={product.imageUrl || 'https://placehold.co/100x100'}
                alt={product.title}
                width={100}
                height={100}
                className="rounded-md object-cover"
              />

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{product.title}</h2>
                <p className="text-sm text-foreground/70">{product.summary}</p>
                <p className="text-sm text-foreground/60">
                  Categoria: {product.category?.name || 'Sem categoria'}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin-secret-xyz/produtos/${product.id}/editar`}
                  className="p-2 rounded-md border border-border text-foreground/80 hover:text-foreground hover:bg-card/60"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}