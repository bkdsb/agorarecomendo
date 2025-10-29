
import Link from 'next/link';
import { Package, Megaphone, Settings, ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
export const revalidate = 0;
import prisma from '../../lib/prisma';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const productsCount = await prisma.product.count();
  const bannersCount = await prisma.banner.count();

  const statCards = [
    { title: "Produtos Publicados", value: productsCount.toString(), icon: Package, color: "text-blue-500" },
    { title: "Cliques em Afiliado (30 dias)", value: "0", icon: ArrowRight, color: "text-green-500" },
    { title: "Banners Ativos", value: bannersCount.toString(), icon: Megaphone, color: "text-yellow-500" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Bem-vindo, {session?.user?.name}!</h1>
      <p className="text-foreground/70 mb-8">Gerencie seus produtos e configurações aqui.</p>

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

      {/* Ações Rápidas */}
      <h3 className="text-2xl font-bold text-foreground mb-5 mt-10">
        Ações Rápidas
      </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Link href="/admin-secret-xyz/products/new" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Package className="w-8 h-8 text-blue-500 mb-3" />
            <h4 className="text-xl font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Novo Produto
            </h4>
            <p className="text-sm text-foreground/70 mt-1">
                Cadastre um novo item via link de afiliado.
            </p>
        </Link>
    <Link href="/admin-secret-xyz/banners" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Megaphone className="w-8 h-8 text-yellow-500 mb-3" />
            <h4 className="text-xl font-semibold text-foreground group-hover:text-yellow-500 transition-colors">
                Gerenciar Banners
            </h4>
            <p className="text-sm text-foreground/70 mt-1">
                Altere textos e links promocionais do Header/Footer.
            </p>
        </Link>
  <Link href="/admin-secret-xyz/produtos" className="group block p-6 rounded-2xl border border-border bg-card/70 backdrop-blur hover:bg-card/80 transition-all shadow-[0_10px_40px_-20px_rgba(0,0,0,0.3)]">
            <Settings className="w-8 h-8 text-foreground/50 mb-3" />
            <h4 className="text-xl font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                Ver Catálogo
            </h4>
            <p className="text-sm text-foreground/70 mt-1">
                Edite, exclua ou atualize produtos existentes.
            </p>
        </Link>
      </div>
    </div>
  );
}


