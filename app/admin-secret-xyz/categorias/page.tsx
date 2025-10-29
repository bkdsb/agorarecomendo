import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DeleteCategoryButton from '@/app/admin-secret-xyz/categorias/DeleteCategoryButton';
import CreateCategoryForm from '@/app/admin-secret-xyz/categorias/CreateCategoryForm';

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Categorias</h1>
      </div>

      <CreateCategoryForm />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 hover:bg-card/80 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-base font-medium text-foreground">{cat.name}</div>
                <div className="mt-1 truncate text-xs text-foreground/70">/{cat.slug}</div>
              </div>
              <DeleteCategoryButton categoryId={cat.id} />
            </div>
            <div className="mt-3 text-xs text-foreground/60">
              {cat._count?.products ?? 0} produto(s)
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 text-center text-sm text-foreground/70">
            Nenhuma categoria ainda. Crie a primeira acima.
          </div>
        )}
      </div>
    </div>
  );
}
