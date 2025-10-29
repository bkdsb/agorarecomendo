// 1. Importamos o prisma (nosso cliente)
import prisma from '@/lib/prisma';

// Importamos nossos componentes de cliente
import Header from '../components/Header';
import ContentFilters from '../components/ContentFilters';
import ProductCard from '../components/ProductCard';

// Importamos o ícone para o Banner
import { ArrowRight } from 'lucide-react';

// Garantimos que a página seja revalidada a cada 0 segundos (atualização imediata)
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 2. Transformamos a Home em uma função "async"
export default async function Home() {

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
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
          {/* Fundo com gradiente e blur mais sutil + parallax */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-[15%] left-[8%] w-[45vw] h-[45vw] rounded-full bg-blue-500/12 blur-3xl" />
            <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/12 blur-3xl" />
          </div>
          
          <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground">
              As melhores recomendações.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-foreground/70">
              Selecionadas com cuidado — só o que vale seu tempo.
            </p>
            <a
              href="#recentes"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90 shadow-sm"
            >
              Ver recomendações recentes
            </a>
          </div>
        </section>

        {/* --- BANNER DE DIVULGAÇÃO (TOPO) --- */}
        <section className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur p-8 md:p-12 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <div className="z-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-foreground">
                Oferta Especial
              </h2>
              <p className="mt-2 text-lg text-foreground/70">
                Os melhores mouses ergonômicos com 20% OFF.
              </p>
            </div>
            <a
              href="#"
              className="z-10 inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              Conferir Agora
              <ArrowRight className="w-4 h-4" />
            </a>
            {/* layers decorativos */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-400/10 blur-2xl" />
            </div>
          </div>
        </section>

        {/* --- SEÇÃO DE FILTROS --- */}
        <ContentFilters />

        {/* --- GRADE DE PRODUTOS --- */}
        <section id="recentes" className="container mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* --- LOOP DE DADOS REAIS (COM O NOME CORRIGIDO) --- */}
            {products.map((product) => {
              // Preferimos link BR, depois qualquer outro
              const preferred = product.links?.find((l: any) => l.locale === 'pt-br') || product.links?.[0];
              const affiliateUrl = (preferred?.url && preferred.url.trim().length > 0) ? preferred.url : '#';
              return (
                <ProductCard
                  key={product.id}
                  title={product.title}
                  description={product.summary || 'Sem resumo rápido.'}
                  category={product.category?.name || 'Sem Categoria'}
                  imageUrl={product.imageUrl || 'https://placehold.co/600x400/1C1C1E/F2F2F2?text=Produto'}
                  articleLink={`/produto/${product.slug}`}
                  affiliateLink={affiliateUrl}
                />
              );
            })}

            {/* Mensagem se não houver produtos */}
            {products.length === 0 && (
              <p className="col-span-full text-center text-foreground/70">
                Nenhum produto encontrado. Comece a adicionar produtos no seu painel de admin!
              </p>
            )}

          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
  <footer className="w-full border-t border-border mt-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-foreground/70">
              © {new Date().getFullYear()} AgoraRecomendo. Todos os direitos reservados.
            </span>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground">
                Política de Privacidade
              </a>
              <a href="#" className="text-sm text-foreground/70 hover:text-foreground">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
