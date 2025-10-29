"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Image as ImageIcon, Settings, Sun, Moon, Home, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const adminLinks = [
  { href: "/admin-secret-xyz", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-secret-xyz/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin-secret-xyz/produtos", label: "Produtos", icon: Package },
  { href: "/admin-secret-xyz/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    const shouldDark = stored ? stored === 'dark' : prefersDark;
    const root = window.document.documentElement;
    if (shouldDark) {
      root.classList.add('dark');
      setDark(true);
    } else {
      root.classList.remove('dark');
      setDark(false);
    }

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMouse({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function handleToggle() {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const willDark = !root.classList.contains('dark');
    root.classList.toggle('dark', willDark);
    setDark(willDark);
    window.localStorage.setItem('theme', willDark ? 'dark' : 'light');
  }

  return (
    <div className="relative flex min-h-screen transition-colors duration-500 bg-[radial-gradient(70%_70%_at_50%_0%,#eef2ff_0%,#ffffff_35%,#e5e7eb_100%)] dark:bg-[radial-gradient(70%_70%_at_50%_0%,#0b1220_0%,#0a0f1a_40%,#0a0a0a_100%)]">
      {/* Glow/parallax sutil */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(420px circle at ${mouse.x}% ${mouse.y}%, ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} 0%, transparent 60%)`,
          transition: 'background 120ms linear',
        }}
      />

      {/* Sidebar */}
      <aside className="w-72 border-r bg-white dark:bg-[#0b1220] border-black/10 dark:border-white/10 flex flex-col justify-between py-8 px-6">
        <div>
          {/* Título superior */}
          <div className="flex items-center gap-3 mb-12">
            <Home className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Home Site</h1>
          </div>
          {/* Navegação principal - estilo simples, espaçamento grande */}
          <nav className="flex flex-col space-y-8">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-4 text-xl font-medium text-gray-700 dark:text-gray-200 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da sidebar: avatar, nome e logout */}
        <div className="mt-8 flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={session.user.name ?? 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">🙂</div>
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {session?.user?.name ?? 'Usuário'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-lg"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-black/10 dark:border-white/10 bg-white/55 dark:bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex-1 flex justify-center">
            <span className="font-extrabold text-2xl tracking-tight text-gray-800 dark:text-gray-100 drop-shadow-lg bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent animate-[logoParallax_2s_ease-in-out_infinite]">AgoraRecomendo</span>
          </div>
          <button
            aria-label="Alternar tema"
            title={dark ? 'Tema claro' : 'Tema escuro'}
            onClick={handleToggle}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {dark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          </button>
        </header>

        <div className="flex-1 px-8 py-8">{children}</div>
      </main>

      <style jsx global>{`
        @keyframes logoParallax {
          0%, 100% { filter: drop-shadow(0 2px 8px rgba(80,80,180,0.12)); }
          50% { filter: drop-shadow(0 8px 24px rgba(80,80,180,0.18)); }
        }
      `}</style>
    </div>
  );
}
