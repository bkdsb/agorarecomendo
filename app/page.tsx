// 1. Importamos o prisma (nosso cliente)
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// Importamos nossos componentes de cliente
import Header from '../components/Header';
import ContentFilters from '../components/ContentFilters';
import ProductCard from '../components/ProductCard';
import HomeHero from '../components/HomeHero';
import HomeFooter from '../components/HomeFooter';

// Importamos helpers de localização
import { getLocalizedAffiliateLink } from '@/lib/localeLinks';

// Importamos o ícone para o Banner
import { ArrowRight } from 'lucide-react';

// Garantimos que a página seja revalidada a cada 0 segundos (atualização imediata)
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 2. Transformamos a Home em uma função "async"
export default async function Home() {
  // Get user locale from cookie to filter links
  const cookieStore = cookies();
  const userLocale = (cookieStore.get('locale')?.value as 'en-US' | 'pt-BR') || 'en-US';

  // 3. BUSCA DE DADOS REAIS (COM O NOME CORRIGIDO)
  const products = await prisma.product.findMany({
    take: 12,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
      // CORRIGIDO: O nome da relação é 'links', como no schema.prisma
      links: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* --- HEADER --- */}
      <Header />

      <main className="flex-1">
        {/* --- HERO SECTION (COM ANIMAÇÃO DE VOLTA) --- */}
        <HomeHero />

        {/* --- BANNER DE DIVULGAÇÃO (TOPO) --- */}
        <section className="container mx-auto max-w-7xl px-4 md:px-6">
          {(() => {
            const bannerTitle = userLocale === 'pt-BR' ? 'Oferta Especial' : 'Special Offer';
            const bannerSubtitle = userLocale === 'pt-BR'
              ? 'Os melhores mouses ergonômicos com 20% OFF.'
              : 'Top ergonomic mice with 20% OFF.';
            const bannerCta = userLocale === 'pt-BR' ? 'Conferir Agora' : 'Check it out';
            return (
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur p-8 md:p-12 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <div className="z-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-foreground">
                {bannerTitle}
              </h2>
              <p className="mt-2 text-lg text-foreground/70">
                {bannerSubtitle}
              </p>
            </div>
            <a
              href="#"
              className="z-10 inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              {bannerCta}
              <ArrowRight className="w-4 h-4" />
            </a>
            {/* layers decorativos */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-400/10 blur-2xl" />
            </div>
          </div>
            );
          })()}
        </section>

        {/* --- SEÇÃO DE FILTROS --- */}
        <ContentFilters />

        {/* --- GRADE DE PRODUTOS --- */}
        <section id="recentes" className="container mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* --- LOOP DE DADOS REAIS (COM O NOME CORRIGIDO) --- */}
            {products.map((product) => {
              // Get localized affiliate link based on user's locale
              const affiliateUrl = getLocalizedAffiliateLink(
                product.links || [],
                userLocale
              );
              
              // Get localized title and summary (using type assertion for newly added fields)
              const productAny = product as any;
              const title = userLocale === 'pt-BR' && productAny.titlePtBr
                ? productAny.titlePtBr
                : product.title;
              const summary = userLocale === 'pt-BR' && productAny.summaryPtBr
                ? productAny.summaryPtBr
                : (product.summary || 'No summary available.');
              const categoryName = userLocale === 'pt-BR' && productAny.category?.namePtBr
                ? productAny.category.namePtBr
                : (product.category?.name || 'Uncategorized');
              
              return (
                <ProductCard
                  key={product.id}
                  title={title}
                  description={summary}
                  category={categoryName}
                  imageUrl={product.imageUrl || 'https://placehold.co/600x400/1C1C1E/F2F2F2?text=Product'}
                  articleLink={`/produto/${product.slug}`}
                  affiliateLink={affiliateUrl}
                />
              );
            })}

            {/* Message if no products */}
            {products.length === 0 && (
              <p className="col-span-full text-center text-foreground/70">
                {userLocale === 'pt-BR'
                  ? 'Nenhum produto encontrado. Comece a adicionar produtos no seu painel de admin!'
                  : 'No products found. Start adding products in your admin panel!'}
              </p>
            )}

          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <HomeFooter />
    </div>
  );
}
