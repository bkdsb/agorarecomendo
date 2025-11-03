import Link from 'next/link';
import Image from 'next/image';
import { Package, MousePointerClick, Image as ImageIcon, Plus, ExternalLink, Home, Settings as SettingsIcon, Globe, Moon, Sun, ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
export const revalidate = 0;
import prisma from '../../../lib/prisma';
import { cookies, headers } from 'next/headers';
import enUS from '../../../lib/locales/en-US.json';
import ptBR from '../../../lib/locales/pt-BR.json';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const productsCount = await prisma.product.count();
  const bannersCount = await prisma.banner.count();
  
  // Buscar produtos recentes para exibir
  const recentProducts = await prisma.product.findMany({
    take: 3,
    orderBy: { updatedAt: 'desc' },
    include: {
      category: true,
      links: true,
    },
  });

  // Server-side locale detection and simple translator
  const cookieStore = await cookies();
  const hdrs = await headers();
  const cookieLocale = cookieStore.get('locale')?.value as 'en-US' | 'pt-BR' | undefined;
  let locale: 'en-US' | 'pt-BR' = 'en-US';
  if (cookieLocale) {
    locale = cookieLocale;
  } else {
    const cfCountry = hdrs.get('cf-ipcountry') || hdrs.get('x-vercel-ip-country') || '';
    const al = hdrs.get('accept-language') || '';
    if (cfCountry === 'BR' || /pt-BR|pt\b/i.test(al)) {
      locale = 'pt-BR';
    }
  }
  const messages: Record<string, Record<string, string>> = { 'en-US': enUS as any, 'pt-BR': ptBR as any };
  const t = (key: string) => messages[locale]?.[key] ?? key;

  if (!session?.user?.email) {
    return <div>Unauthorized</div>;
  }

  const userName = session.user.name?.split(' ')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">{t('header.backToSite') || 'Back to Site'}</span>
            </Link>
            <div className="h-6 w-px bg-border/50" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {userName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Image 
              src={session?.user?.image || "/globe.svg"} 
              alt={session?.user?.name || "Admin"} 
              width={36} 
              height={36} 
              className="rounded-full ring-2 ring-border/30" 
              unoptimized 
            />
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/admin-secret-xyz/settings" className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label="Settings">
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-3">
            {t('dashboard.welcome') || 'Welcome back'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('dashboard.overview') || 'Here\'s what\'s happening with your products'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Products Card */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 mb-4">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-5xl font-bold tracking-tight mb-2">{productsCount}</p>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.publishedProducts') || 'Products'}</span>
            </div>
          </div>

          {/* Clicks Card */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(34,197,94,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-green-500/10 mb-4">
                <MousePointerClick className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-5xl font-bold tracking-tight mb-2">0</p>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.affiliateClicks30d') || 'Clicks (30d)'}</span>
            </div>
          </div>

          {/* Banners Card */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(168,85,247,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 mb-4">
                <ImageIcon className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-5xl font-bold tracking-tight mb-2">{bannersCount}</p>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.activeBanners') || 'Banners'}</span>
            </div>
          </div>
        </div>

        {/* Active Products Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {t('products.active') || 'Active Products'}
              </h2>
              <p className="text-muted-foreground">
                {t('products.recentlyUpdated') || 'Your most recently updated products'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin-secret-xyz/products"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 transition-all duration-300 font-medium text-sm"
              >
                {t('products.viewAll') || 'All Products'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin-secret-xyz/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('products.addNew') || 'New Product'}
              </Link>
            </div>
          </div>

          {recentProducts.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/30 via-background to-background border border-dashed border-border/50 backdrop-blur-xl p-16 text-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
              <div className="relative max-w-md mx-auto">
                <div className="inline-flex p-5 rounded-3xl bg-accent/50 mb-6">
                  <Package className="w-16 h-16 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('products.noProducts') || 'No products yet'}</h3>
                <p className="text-muted-foreground text-lg mb-8">{t('products.noProductsDescription') || 'Start by creating your first product recommendation'}</p>
                <Link
                  href="/admin-secret-xyz/products/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  {t('products.createFirst') || 'Create Your First Product'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProducts.map((product) => {
                const hasArticle = (locale === 'pt-BR' ? product.articlePtBr : product.article) || product.article;
                const isActive = !!hasArticle;
                
                return (
                  <Link
                    key={product.id}
                    href={`/admin-secret-xyz/products/${product.id}/edit`}
                    className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-primary/50 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      {/* Product Image */}
                      <div className="aspect-square bg-accent/20 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={locale === 'pt-BR' ? product.titlePtBr || product.title : product.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl ${
                            isActive 
                              ? 'bg-green-500/90 text-white' 
                              : 'bg-orange-500/90 text-white'
                          }`}>
                            {isActive ? 'Active' : 'Draft'}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-5 space-y-3">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {locale === 'pt-BR' ? product.titlePtBr || product.title : product.title}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          {product.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-accent text-xs font-medium">
                              {product.category.name}
                            </span>
                          )}
                          {product.price && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                              {product.price}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1.5">
                            <MousePointerClick className="w-4 h-4" />
                            0 clicks
                          </span>
                          {product.links?.[0] && (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <ExternalLink className="w-3 h-3" />
                              {new URL(product.links[0].url).hostname}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Banners Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {t('dashboard.bannersPromo') || 'Promotional Banners'}
              </h2>
              <p className="text-muted-foreground">
                {t('banners.manageBanners') || 'Manage your promotional banners'}
              </p>
            </div>
            <Link
              href="/admin-secret-xyz/banners"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('banners.addNew') || 'New Banner'}
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/30 via-background to-background border border-dashed border-border/50 backdrop-blur-xl p-16 text-center shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
            <div className="relative max-w-md mx-auto">
              <div className="inline-flex p-5 rounded-3xl bg-accent/50 mb-6">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('banners.noBanners') || 'No banners yet'}</h3>
              <p className="text-muted-foreground text-lg mb-8">{t('banners.noBannersDescription') || 'Create promotional banners to highlight your products'}</p>
              <Link
                href="/admin-secret-xyz/banners"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-semibold"
              >
                <Plus className="w-5 h-5" />
                {t('banners.createFirst') || 'Create Your First Banner'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


