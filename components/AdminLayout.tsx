"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Package,
  LineChart,
  Settings,
  Home,
  LogOut,
  Megaphone,
  Tags,
} from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import SoftBubbles from "./SoftBubbles";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 border
                    ${isActive
                      ? "bg-gradient-to-r from-blue-500/10 to-blue-500/0 border-blue-500/20 text-foreground backdrop-blur-sm"
                      : "border-transparent text-foreground/75 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/5 hover:border-border"}
                   `}
        onClick={() => setIsSidebarOpen(false)}
      >
        {/* indicador lateral sutil */}
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full transition-all ${isActive ? "opacity-100 bg-gradient-to-b from-blue-400 to-blue-600 shadow-sm" : "opacity-0 group-hover:opacity-60 bg-foreground/30"}`}></span>
        <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "text-blue-600 scale-105" : "text-foreground/80 group-active:scale-95 group-hover:translate-x-0.5"}`} />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    );
  };

  return (
  <div className="relative min-h-screen flex bg-background overflow-hidden">
      {/* Soft decorative background */}
      <div className="absolute inset-0 -z-10">
        {/* subtle gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent dark:from-white/5" />
      </div>
      {/* --- Sidebar (Desktop) --- */}
      <aside
        className="hidden md:flex flex-col w-64 border-r border-border bg-card/70 backdrop-blur p-6"
      >
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground mb-10">
          <Home className="w-5 h-5 text-blue-500" />
          Home Site
        </Link>

        <nav className="flex-1 space-y-2">
          <NavItem href="/admin-secret-xyz" icon={LineChart} label="Dashboard" />
          <NavItem href="/admin-secret-xyz/produtos" icon={Package} label="Produtos" />
          <NavItem href="/admin-secret-xyz/categorias" icon={Tags} label="Categorias" />
          <NavItem href="/admin-secret-xyz/banners" icon={Megaphone} label="Banners" />
          <NavItem href="/admin-secret-xyz/configuracoes" icon={Settings} label="Configurações" />
        </nav>

        {/* User Info e Logout (sem toggle aqui) */}
  <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image
              src={session?.user?.image || '/globe.svg'}
              alt={session?.user?.name || 'Admin'}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
            <span className="text-sm font-semibold text-foreground truncate">{session?.user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors w-max"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- Overlay (Mobile) --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="w-64 bg-card/90 backdrop-blur h-full p-6 shadow-2xl border-r border-border"
            onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar na sidebar
          >
            <div className="flex justify-end mb-8">
                <button onClick={() => setIsSidebarOpen(false)}>
                    <X className="w-6 h-6 text-foreground" />
                </button>
            </div>
            <nav className="flex flex-col space-y-2">
                <NavItem href="/" icon={Home} label="Home Site" />
                <NavItem href="/admin-secret-xyz" icon={LineChart} label="Dashboard" />
                <NavItem href="/admin-secret-xyz/produtos" icon={Package} label="Produtos" />
                <NavItem href="/admin-secret-xyz/categorias" icon={Tags} label="Categorias" />
                <NavItem href="/admin-secret-xyz/banners" icon={Megaphone} label="Banners" />
                <NavItem href="/admin-secret-xyz/configuracoes" icon={Settings} label="Configurações" />
            </nav>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
  <div className="relative flex-1 flex flex-col">
        {/* soft bubbles backdrop behind content */}
        <SoftBubbles strength={0.06} />
        {/* Top Bar (Desktop) */}
  <header className="hidden md:flex sticky top-0 z-30 w-full bg-card/70 backdrop-blur-md border-b border-border h-16 items-center justify-end px-6">
          {/* título central */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-base font-semibold text-foreground/90">AgoraRecomendo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[220px]">
              {session?.user?.name}
            </span>
            <ThemeToggleButton />
          </div>
        </header>
        {/* Top Bar (Mobile/Header) */}
  <header className="md:hidden sticky top-0 z-40 w-full bg-card/70 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarOpen(true)} className="active:scale-95 transition-transform">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-lg font-semibold text-foreground/90">AgoraRecomendo</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}