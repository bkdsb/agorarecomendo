import Link from 'next/link';
import Image from 'next/image';
import { Package, MousePointerClick, Image as ImageIcon, Plus, MoreVertical, ExternalLink, Home, Settings as SettingsIcon, Globe } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
export const revalidate = 0;
import prisma from '../../../lib/prisma';
import { cookies, headers } from 'next/headers';
import enUS from '../../../lib/locales/en-US.json';
import ptBR from '../../../lib/locales/pt-BR.json';

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
              {t('dashboard.welcome') || 'Welcome'}, {userName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Image 
              src={session?.user?.image || "/globe.svg"} 
              alt={session?.user?.name || "Admin"} 
              width={32} 
              height={32} 
              className="rounded-full ring-2 ring-border/30" 
              unoptimized 
            />
            <span className="text-2xl">🇧🇷</span>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label="Language">
              <Globe className="w-5 h-5" />
            </button>
            <Link href="/admin-secret-xyz/settings" className="p-2 hover:bg-accent rounded-lg transition-colors" aria-label="Settings">
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Products Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">📦 {t('dashboard.publishedProducts') || 'Products'}</span>
              </div>
              <p className="text-4xl font-bold tracking-tight">{productsCount}</p>
            </div>
          </div>

          {/* Clicks Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(34,197,94,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <MousePointerClick className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">🎯 {t('dashboard.affiliateClicks30d') || 'Clicks'}</span>
                </div>
                <select className="text-xs bg-accent/50 rounded-lg px-2 py-1 border border-border/50 outline-none">
                  <option>Últimos 30d</option>
                  <option>Últimos 7d</option>
                  <option>Hoje</option>
                </select>
              </div>
              <p className="text-4xl font-bold tracking-tight">0</p>
            </div>
          </div>

          {/* Banners Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/5 via-background to-background border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(168,85,247,0.4)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">🎨 {t('dashboard.activeBanners') || 'Banners'}</span>
              </div>
              <p className="text-4xl font-bold tracking-tight">{bannersCount}</p>
            </div>
          </div>
        </div>

        {/* Active Products Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              📦 {t('products.active') || 'Active Products'}
            </h2>
            <Link
              href="/admin-secret-xyz/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('products.addNew') || 'Add'}
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/30 via-background to-background border border-dashed border-border backdrop-blur-xl p-16 text-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-accent/50 mb-4">
                  <Package className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('products.noProducts') || 'Adicione seu primeiro produto'}</h3>
                <p className="text-muted-foreground mb-6">{t('products.noProductsDescription') || 'Comece criando seu primeiro produto'}</p>
                <Link
                  href="/admin-secret-xyz/products/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  {t('products.addNew') || 'Adicionar Produto'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-primary/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    {/* Product Image */}
                    <div className="aspect-square bg-accent/20 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={locale === 'pt-BR' ? product.titlePtBr || product.title : product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base line-clamp-2 flex-1">
                          {locale === 'pt-BR' ? product.titlePtBr || product.title : product.title}
                        </h3>
                        <button className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                          Ativo
                        </span>
                        {product.category && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent/50 text-xs font-medium">
                            {product.category.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>0 cliques</span>
                        {product.links?.[0] && (
                          <a
                            href={product.links[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <span className="truncate max-w-[100px]">{new URL(product.links[0].url).hostname}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Banners Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              🎨 {t('dashboard.bannersPromo') || 'Banners Promocionais'}
            </h2>
            <Link
              href="/admin-secret-xyz/banners"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('banners.addNew') || 'Add'}
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/30 via-background to-background border border-dashed border-border backdrop-blur-xl p-16 text-center shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
            <div className="relative">
              <div className="inline-flex p-4 rounded-2xl bg-accent/50 mb-4">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('banners.noBanners') || 'Nenhum banner ativo'}</h3>
              <p className="text-muted-foreground mb-6">{t('banners.noBannersDescription') || 'Crie banners promocionais para destacar produtos'}</p>
              <Link
                href="/admin-secret-xyz/banners"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                {t('banners.addNew') || 'Adicionar Banner'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


