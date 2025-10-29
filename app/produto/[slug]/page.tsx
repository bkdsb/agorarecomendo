import prisma from '../../../lib/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import ParallaxLayer from '../../../components/ParallaxLayer';
import Header from '../../../components/Header';
import dynamic from 'next/dynamic';

const ReviewsCarousel = dynamic(() => import('../../../components/ReviewsCarousel'), { ssr: false });
const ReviewsMarquee = dynamic(() => import('../../../components/ReviewsMarquee'), { ssr: false });

interface Props {
  params: { slug: string };
}

export default async function ProductArticlePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true, links: true, reviews: true },
  });

  if (!product) return notFound();

  const hasArticle = !!product.article && product.article.trim().length > 0;
  const hasSummary = !!product.summary && product.summary.trim().length > 0;

  const preferredLinkObj = product.links.find((l: any) => l.locale === 'pt-br') || product.links[0];
  const primaryLink = preferredLinkObj?.url || undefined;
  // Buscar semelhantes por TAGS internas (fallback para categoria)
  const tagList = (product.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const similares = tagList.length > 0
    ? await prisma.product.findMany({
        where: {
          id: { not: product.id },
          AND: [
            { tags: { not: null } },
            { OR: tagList.map((t) => ({ tags: { contains: t, mode: 'insensitive' as const } })) },
          ],
        },
        take: 6,
        include: { links: true },
      })
    : (product.categoryId
        ? await prisma.product.findMany({
            where: { categoryId: product.categoryId, id: { not: product.id } },
            take: 6,
            include: { links: true },
          })
        : []);

  // Config de exibição de reviews (armazenada no scrapedQnA como JSON)
  let reviewsDisplay: { mode: 'minimal' | 'grid' | 'summary' | 'hidden' | 'single-slide' | 'single-fade' | 'marquee'; max: number; order: 'recent' | 'rating'; showStars: boolean } = { mode: 'minimal', max: 6, order: 'recent', showStars: false };
  try {
    const cfg = product.scrapedQnA ? JSON.parse(product.scrapedQnA as any) : {};
    const rd = cfg?.reviewsDisplay || {};
    reviewsDisplay = {
      mode: (rd.mode as any) || 'minimal',
      max: typeof rd.max === 'number' ? rd.max : 6,
      order: rd.order === 'rating' ? 'rating' : 'recent',
      showStars: !!rd.showStars,
    };
  } catch {}

  // Ordenação e corte das reviews
  const reviewsOrdered = [...(product.reviews || [])];
  if (reviewsDisplay.order === 'rating') reviewsOrdered.sort((a:any,b:any)=> (Number(b.rating)||0)-(Number(a.rating)||0));
  else reviewsOrdered.sort((a:any,b:any)=> new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  const reviewsToShow = reviewsOrdered.slice(0, reviewsDisplay.max);

  return (
    <div className="relative">
      {/* Header principal reutilizado da Home, com atalho de edição quando logado */}
      <Header editHref={session ? `/admin-secret-xyz/produtos/${product.id}/editar` : undefined} />
      {/* Fundo premium com gradientes e blur (parcialmente parallax via fixed bg) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent dark:from-preto-espacial" />
        <ParallaxLayer strength={0.05} className="absolute top-[10%] left-[10%]">
          <div className="w-[40vw] h-[40vw] rounded-full bg-blue-500/12 blur-3xl" />
        </ParallaxLayer>
        <ParallaxLayer strength={0.08} className="absolute bottom-[5%] right-[8%]">
          <div className="w-[35vw] h-[35vw] rounded-full bg-purple-500/12 blur-3xl" />
        </ParallaxLayer>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground">
                {product.category?.name || 'Produto'}
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                Premium Review
              </span>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {product.title}
              </h1>
              <p className="mt-4 text-foreground/70 max-w-prose">
                {product.summary || 'Analisamos minuciosamente para recomendar apenas o que vale seu tempo.'}
              </p>
              {primaryLink && (
                <div className="mt-6 flex items-center gap-3">
                  <a
                    href={primaryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90"
                  >
                    Ver na Loja
                  </a>
                  <a href="#detalhes" className="text-sm text-foreground/70 hover:text-foreground">Detalhes do produto</a>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl" />
              <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur p-3 shadow-2xl">
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image src={product.imageUrl || '/window.svg'} alt={product.title} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO: Artigo completo otimizado */}
      <section id="detalhes" className="container mx-auto max-w-6xl px-4 md:px-6 pb-20">
        {/* O logo e o atalho de edição agora ficam no Header */}
        {hasArticle ? (
          <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: product.article! }} />
          </article>
        ) : hasSummary ? (
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <h2 className="text-xl font-semibold mb-2">Resumo</h2>
            <p className="text-foreground/80">{product.summary}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-yellow-300/40 bg-yellow-50/80 dark:bg-yellow-900/40 p-4 text-sm">
            <p className="text-yellow-800 dark:text-yellow-100">
              Este produto ainda não tem artigo — em breve publicaremos um conteúdo completo.
            </p>
          </div>
        )}

        {/* Reviews abaixo do artigo, centralizadas e minimalistas, conforme config */}
        {reviewsDisplay.mode !== 'hidden' && product.reviews && product.reviews.length > 0 && (
          <div className="mt-12">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl font-semibold text-foreground">O que dizem os usuários</h3>
              <p className="mt-1 text-sm text-foreground/60">Seleção de avaliações</p>
            </div>
            {reviewsDisplay.mode === 'summary' ? (
              (()=>{
                const avg = reviewsToShow.length? (reviewsToShow.reduce((s:any,r:any)=> s + (Number(r.rating)||0), 0)/reviewsToShow.length).toFixed(1): '0.0';
                return (
                  <div className="mt-6 mx-auto max-w-3xl">
                    <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-8 text-center shadow-xl">
                      <div className="text-sm text-foreground/70">Média das avaliações</div>
                      <div className="text-4xl font-bold text-foreground mt-1">{avg} {reviewsDisplay.showStars ? '⭐' : ''}</div>
                      <div className="text-xs text-foreground/60 mt-1">{product.reviews.length} avaliações</div>
                    </div>
                  </div>
                );
              })()
            ) : reviewsDisplay.mode === 'single-slide' || reviewsDisplay.mode === 'single-fade' ? (
              <div className="mt-6">
                <ReviewsCarousel reviews={reviewsToShow as any} showStars={reviewsDisplay.showStars} variant={reviewsDisplay.mode === 'single-fade' ? 'fade' : 'slide'} />
              </div>
            ) : reviewsDisplay.mode === 'marquee' ? (
              <div className="mt-6">
                <ReviewsMarquee reviews={reviewsToShow as any} showStars={reviewsDisplay.showStars} />
              </div>
            ) : (
              <div className={reviewsDisplay.mode === 'grid' ? 'mt-6 mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4' : 'mt-6 mx-auto max-w-3xl space-y-4'}>
                {reviewsToShow.map((r:any) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 text-center">
                    <div className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                      {r.avatarUrl ? <img src={r.avatarUrl} alt={r.author||'avatar'} className="w-6 h-6 rounded-full object-cover"/> : <span className="w-6 h-6 rounded-full bg-foreground/10 inline-block"/>}
                      <span>{r.author || 'Usuário'}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground/70">{(Number(r.rating) || 0).toFixed(1)} / 5.0 {reviewsDisplay.showStars ? '⭐'.repeat(Math.round(Number(r.rating)||0)) : ''}</div>
                    <p className="mt-3 text-foreground/80">“{r.content}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* CTA FINAL (Somente no final) */}
      {primaryLink && (
        <section className="container mx-auto max-w-6xl px-4 md:px-6 pb-24">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-8 text-center shadow-xl">
            <h3 className="text-2xl font-semibold mb-3">Pronto para comprar?</h3>
            <p className="text-foreground/70 mb-6">Acesse a loja e veja mais detalhes, ofertas e avaliações.</p>
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-8 py-3 text-base font-medium hover:opacity-90"
            >
              Comprar agora
            </a>
          </div>
        </section>
      )}

      {/* Semelhantes por tags/categoria */}
      {similares.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 md:px-6 pb-24">
          <h3 className="text-xl font-semibold mb-4">Produtos semelhantes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similares.map((p) => {
              const similarPreferred = p.links?.find((l: any) => l.locale === 'pt-br') || p.links?.[0];
              const similarAffiliate = similarPreferred?.url || '#';
              return (
                <a
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  className="block rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:bg-card/80 transition"
                >
                  <div className="text-sm text-muted-foreground mb-1">{p.categoryId ? product.category?.name || 'Produto' : 'Produto'}</div>
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="mt-2 text-xs text-foreground/60">{p.summary || 'Veja detalhes'}</div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
