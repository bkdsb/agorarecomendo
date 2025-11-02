import Link from 'next/link';
import { Package, Megaphone, Settings, ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
export const revalidate = 0;
import prisma from '../../lib/prisma';
import { cookies, headers } from 'next/headers';
import enUS from '../../lib/locales/en-US.json';
import ptBR from '../../lib/locales/pt-BR.json';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const productsCount = await prisma.product.count();
  const bannersCount = await prisma.banner.count();

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

  const statCards = [
    { title: t('dashboard.publishedProducts') || 'Published Products', value: productsCount.toString(), icon: Package, color: "text-blue-500" },
    { title: t('dashboard.affiliateClicks30d') || 'Affiliate Clicks (30 days)', value: "0", icon: ArrowRight, color: "text-green-500" },
    { title: t('dashboard.activeBanners') || 'Active Banners', value: bannersCount.toString(), icon: Megaphone, color: "text-yellow-500" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">{t('dashboard.welcome') || 'Welcome'}, {session?.user?.name}!</h1>
      <p className="text-foreground/70 mb-8">{t('dashboard.manageHere') || 'Manage your products and settings here.'}</p>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat, index) => (
          <div key={index} className="p-6 rounded-2xl border border-border bg-card/70 backdrop-blur flex items-center gap-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <div className={`p-3 rounded-full bg-background/40 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/70">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-2xl font-bold text-foreground mb-5 mt-10">
        {t('dashboard.quickActions') || 'Quick Actions'}
      </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Link href="/admin-secret-xyz/products/new" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Package className="w-8 h-8 text-blue-500 mb-3" />
      <h4 className="text-xl font-semibold text-foreground group-hover:text-blue-500 transition-colors">
        {t('dashboard.newProduct') || 'New Product'}
      </h4>
      <p className="text-sm text-foreground/70 mt-1">
        {t('dashboard.newProductDesc') || 'Add a new item via affiliate link.'}
      </p>
        </Link>
    <Link href="/admin-secret-xyz/banners" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Megaphone className="w-8 h-8 text-yellow-500 mb-3" />
      <h4 className="text-xl font-semibold text-foreground group-hover:text-yellow-500 transition-colors">
        {t('dashboard.manageBanners') || 'Manage Banners'}
      </h4>
      <p className="text-sm text-foreground/70 mt-1">
        {t('dashboard.manageBannersDesc') || 'Edit promotional texts and links in Header/Footer.'}
      </p>
        </Link>
  <Link href="/admin-secret-xyz/products" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Settings className="w-8 h-8 text-foreground/50 mb-3" />
      <h4 className="text-xl font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
        {t('dashboard.viewCatalog') || 'View Catalog'}
      </h4>
      <p className="text-sm text-foreground/70 mt-1">
        {t('dashboard.viewCatalogDesc') || 'Edit, delete or update existing products.'}
      </p>
        </Link>
      </div>
    </div>
  );
}


