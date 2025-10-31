"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from '@/components/LanguageProvider';

type Product = {
  id: string;
  title: string;
  slug: string;
  scrapedQnA?: string;
};

export default function ArticleEditorPageRedirect() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { t } = useLanguage() as unknown as { t: (k:string)=>string };
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [countdown, setCountdown] = React.useState(3);

  // Carregar produto e redirecionar
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error('Failed to load product');
        const data: Product = await res.json();
        if (!mounted) return;
        setProduct(data);
        
        // Extrair slug correto do scrapedQnA
        let targetSlug = data.slug;
        if (data.scrapedQnA) {
          try {
            const scraped = JSON.parse(data.scrapedQnA);
            if (scraped.slugs && scraped.slugs['en-US']) {
              targetSlug = scraped.slugs['en-US'];
            }
          } catch {}
        }
        
        // Iniciar countdown para redirecionamento
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push(`/produto/${targetSlug}?editor=article#editor`);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      } catch (e) {
        console.error(e);
        // Em caso de erro, redireciona para admin
        setTimeout(() => router.push('/admin-secret-xyz/products'), 2000);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md text-center space-y-6 p-8">
        {/* Ícone informativo */}
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        {/* Mensagem */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">
            {t('article.editor_moved') || 'Editor Moved'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('article.redirect_message') || 
              'The article editor is now integrated directly into the product page. Redirecting you to the new inline editor...'}
          </p>
        </div>
        
        {/* Countdown */}
        <div className="space-y-3">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {countdown}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('article.redirect_countdown') || 'Redirecting in'} {countdown}s
          </p>
        </div>
        
        {/* Botão manual */}
        {product && (
          <button
            onClick={() => {
              let targetSlug = product.slug;
              if (product.scrapedQnA) {
                try {
                  const scraped = JSON.parse(product.scrapedQnA);
                  if (scraped.slugs && scraped.slugs['en-US']) {
                    targetSlug = scraped.slugs['en-US'];
                  }
                } catch {}
              }
              router.push(`/produto/${targetSlug}?editor=article#editor`);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            {t('article.go_now') || 'Go now'} →
          </button>
        )}
      </div>
    </div>
  );
}
