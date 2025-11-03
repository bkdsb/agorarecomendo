'use client';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import DeleteProductButton from './DeleteProductButton';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-foreground/70">{t('common.loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{t('products.title') || 'Products'}</h1>
        <Link
          href="/admin-secret-xyz/products/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <PlusCircle className="w-4 h-4" />
          {t('products.newProduct') || 'New Product'}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-foreground/70">
          {t('products.noProducts') || 'No products registered yet.'}
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
                  {t('products.category') || 'Category'}: {product.category?.name || (t('products.noCategory') || 'No category')}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin-secret-xyz/products/${product.id}/edit`}
                  className="p-2 rounded-md border border-border text-foreground/80 hover:text-foreground hover:bg-card/60"
                  title={t('common.edit') || 'Edit'}
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