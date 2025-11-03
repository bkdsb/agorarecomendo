import Link from 'next/link';
import { Package, MousePointerClick, Image as ImageIcon, Plus, ExternalLink, ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
export const revalidate = 0;
import prisma from '../../../../lib/prisma';
import { cookies, headers } from 'next/headers';
import enUS from '../../../../lib/locales/en-US.json';
import ptBR from '../../../../lib/locales/pt-BR.json';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const productsCount = await prisma.product.count();
  const bannersCount = await prisma.banner.count();
  const categoriesCount = await prisma.category.count();
  
  // Buscar produtos recentes para exibir
  const recentProducts = await prisma.product.findMany({
    take: 3,
    orderBy: { updatedAt: 'desc' },
    include: {
      category: true,
      links: true,
    },
  });

  // Buscar categorias para exibir
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' },
    take: 6,
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

  return (
    <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-3">
            {t('dashboard.welcome') || 'Welcome back'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('dashboard.overview') || "Here's what's happening with your products"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
          <div className="text-sm text-muted-foreground">Dashboard content continues here...</div>
        </div>
    </div>
  );
}
