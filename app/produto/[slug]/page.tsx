import React from 'react';
import prisma from '../../../lib/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import ParallaxLayer from '../../../components/ParallaxLayer';
import Header from '../../../components/Header';
import ReviewsCarousel from '../../../components/ReviewsCarousel';
import ReviewsMarquee from '../../../components/ReviewsMarquee';
import LiveArticleRender from '../../../components/LiveArticleRender';
import { cookies } from 'next/headers';
import { getLocalizedAffiliateLink } from '@/lib/localeLinks';
import enUS from '../../../lib/locales/en-US.json';
import ptBR from '../../../lib/locales/pt-BR.json';

// Editor inline removido desta página — edição movida para o admin

// Revalidate every 10 seconds to show fresh article status
export const revalidate = 10;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductArticlePage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  
  // Await params in Next.js 16+
  const { slug } = await params;
  
  // Get user locale from cookie
  const cookieStore = await cookies();
  const userLocale = ((cookieStore.get('locale')?.value) as 'en-US' | 'pt-BR') || 'en-US';
  const messages: Record<'en-US'|'pt-BR', Record<string,string>> = { 'en-US': enUS as any, 'pt-BR': ptBR as any };
  const t = (key: string) => messages[userLocale]?.[key] ?? key;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, links: true, reviews: true },
  });

  if (!product) return notFound();

  // Use type assertion to access PT-BR fields
  const productAny = product as any;
  
  // Get localized content based on user's locale
  const title = userLocale === 'pt-BR' && productAny.titlePtBr
    ? productAny.titlePtBr
    : product.title;
  const summary = userLocale === 'pt-BR' && productAny.summaryPtBr
    ? productAny.summaryPtBr
    : product.summary;
  const article = userLocale === 'pt-BR' && productAny.articlePtBr
    ? productAny.articlePtBr
    : product.article;
  const categoryName = userLocale === 'pt-BR' && productAny.category?.namePtBr
    ? productAny.category.namePtBr
    : product.category?.name;

  // Check article status - only show if published
  const articleStatus = userLocale === 'pt-BR' 
    ? (productAny.articleStatusPtBr || 'draft')
    : (productAny.articleStatus || 'draft');
  const isArticlePublished = articleStatus === 'published';
  
  const hasArticle = isArticlePublished && !!article && article.trim().length > 0;
  const hasSummary = !!summary && summary.trim().length > 0;

  // Get localized affiliate link based on user's locale
  const primaryLink = getLocalizedAffiliateLink(product.links || [], userLocale);
  // Find similar products by internal TAGS (fallback to category)
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
        include: { links: true, category: true },
      })
    : (product.categoryId
        ? await prisma.product.findMany({
            where: { categoryId: product.categoryId, id: { not: product.id } },
            take: 6,
            include: { links: true, category: true },
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

  // Filter reviews by user's locale, then order and slice
  const reviewsFiltered = (product.reviews || []).filter((r: any) => {
    // If review has no locale field (old data), show it for all locales
    // Otherwise only show if it matches user's locale
    return !r.locale || r.locale === userLocale;
  });
  const reviewsOrdered = [...reviewsFiltered];
  if (reviewsDisplay.order === 'rating') reviewsOrdered.sort((a:any,b:any)=> (Number(b.rating)||0)-(Number(a.rating)||0));
  else reviewsOrdered.sort((a:any,b:any)=> new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  const reviewsToShow = reviewsOrdered.slice(0, reviewsDisplay.max);
  // Inline editor no artigo foi descontinuado

  return (
  <div className="relative overflow-x-hidden">
      {/* Header principal reutilizado da Home, com atalho de edição quando logado */}
  <Header />
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
                {categoryName || (t('product.categoryGeneric') || 'Product')}
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                {t('product.premiumReview') || 'Premium Review'}
              </span>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {/* Only show summary in hero if article is published */}
              {hasArticle && hasSummary && (
                <p className="mt-4 text-foreground/70 max-w-prose">
                  {summary}
                </p>
              )}
              {primaryLink && (
                <div className="mt-6 flex items-center gap-3">
                  <a
                    href={primaryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90"
                  >
                    {t('product.viewProduct') || 'View product'}
                  </a>
                  <a href="#detalhes" className="text-sm text-foreground/70 hover:text-foreground">{t('product.details') || 'Product details'}</a>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl" />
              <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur p-3 shadow-2xl">
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image src={product.imageUrl || '/window.svg'} alt={title} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* CONTENT: Adaptive layout based on article status */}
      <section id="detalhes" className="container mx-auto max-w-6xl px-4 md:px-6 pb-20">
        {hasArticle ? (
          // Scenario 1: Article is PUBLISHED
          // Show full article with rich content
          <div className="space-y-8">
            <LiveArticleRender initialHtml={article} />
          </div>
        ) : hasSummary ? (
          // Scenario 2: Article is DRAFT or missing
          // Move summary to main content area with enhanced presentation
          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-8 md:p-12 shadow-xl">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  {t('product.aboutProduct') || 'About this product'}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    {summary}
                  </p>
                </div>
                
                {/* Coming Soon Badge */}
                <div className="mt-8 pt-8 border-t border-border/50">
                  <div className="flex items-center gap-3 text-sm text-foreground/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="font-medium">
                        {t('product.detailedReviewComingSoon') || 'Detailed review coming soon'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-foreground/50 text-sm">
                    {t('product.weAreWriting') || "We're currently writing a comprehensive analysis of this product. Check back soon for the full review with detailed insights, comparisons, and recommendations."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Scenario 3: No content at all
          <div className="rounded-3xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/20 p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('product.contentInProgress') || 'Content in progress'}
              </h3>
              <p className="text-foreground/70">
                {t('product.noContentYet') || "We're working on the content for this product. Please check back soon for detailed information and analysis."}
              </p>
            </div>
          </div>
        )}

        {/* Edição inline removida — agora dentro do Admin */}

        {/* Reviews below article, centered and minimalist, per config */}
        {reviewsDisplay.mode !== 'hidden' && product.reviews && product.reviews.length > 0 && (
          <div className="mt-12">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl font-semibold text-foreground">{t('reviews.headingUsersSay') || 'What users say'}</h3>
              <p className="mt-1 text-sm text-foreground/60">{t('reviews.selection') || 'Selection of reviews'}</p>
            </div>
            {reviewsDisplay.mode === 'summary' ? (
              (()=>{
                const avg = reviewsToShow.length? (reviewsToShow.reduce((s:any,r:any)=> s + (Number(r.rating)||0), 0)/reviewsToShow.length).toFixed(1): '0.0';
                return (
                  <div className="mt-6 mx-auto max-w-3xl">
                    <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-8 text-center shadow-xl">
                      <div className="text-sm text-foreground/70">{t('editor.reviewsAverage') || 'Average rating'}</div>
                      <div className="text-4xl font-bold text-foreground mt-1">{avg} {reviewsDisplay.showStars ? '⭐' : ''}</div>
                      <div className="text-xs text-foreground/60 mt-1">{product.reviews.length} {t('editor.reviews') || 'reviews'}</div>
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
                      <img 
                        src={r.avatarUrl || '/avatar-reviews.jpeg'} 
                        alt={r.author||'avatar'} 
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/avatar-reviews.jpeg';
                        }}
                      />
                      <span>{r.author || (t('editor.user') || 'User')}</span>
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

      {/* FINAL CTA (Only at the end) */}
      {primaryLink && (
        <section className="container mx-auto max-w-6xl px-4 md:px-6 pb-24">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-8 text-center shadow-xl">
            <h3 className="text-2xl font-semibold mb-3">{t('product.readyToBuy') || 'Ready to buy?'}</h3>
            <p className="text-foreground/70 mb-6">{t('product.readySub') || 'Visit the store and see more details, offers and reviews.'}</p>
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-8 py-3 text-base font-medium hover:opacity-90"
            >
              {t('product.buyNow') || 'Buy now'}
            </a>
          </div>
        </section>
      )}

      {/* Similar products by tags/category */}
      {similares.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 md:px-6 pb-24">
          <h3 className="text-xl font-semibold mb-4">{t('product.similarProducts') || 'Similar products'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similares.map((p) => {
              // Get localized content for similar products
              const pAny = p as any;
              const pTitle = userLocale === 'pt-BR' && pAny.titlePtBr ? pAny.titlePtBr : p.title;
              const pSummary = userLocale === 'pt-BR' && pAny.summaryPtBr ? pAny.summaryPtBr : p.summary;
              const pCategoryName = userLocale === 'pt-BR' && pAny.category?.namePtBr 
                ? pAny.category.namePtBr 
                : (p.categoryId ? (categoryName || (t('product.categoryGeneric') || 'Product')) : (t('product.categoryGeneric') || 'Product'));
              
              return (
                <a
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  className="block rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:bg-card/80 transition"
                >
                  <div className="text-sm text-muted-foreground mb-1">{pCategoryName}</div>
                  <div className="font-medium text-foreground">{pTitle}</div>
                  <div className="mt-2 text-xs text-foreground/60">{pSummary || (t('product.seeDetails') || 'See details')}</div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
