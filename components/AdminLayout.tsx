"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, Package, LineChart, Settings, Home, LogOut, Megaphone, Tags, ChevronsLeft, ChevronsRight } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import SoftBubbles from "./SoftBubbles";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "./LanguageProvider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleLogout = () => signOut({ callbackUrl: "/" });

  // Auto-expand on hover in edit pages; keep open by default on dashboard
  const isEditPage = pathname?.includes('/products/') && pathname?.includes('/edit');
  const isDashboard = pathname === '/admin-secret-xyz/dashboard';

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href || (pathname?.startsWith(`${href}/`) && href !== '/admin-secret-xyz');
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-300 ease-out active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          isActive
            ? "bg-blue-500/12 text-blue-600"
            : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.06]"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full transition-all duration-300 ease-out ${isActive ? "opacity-100 bg-blue-600" : "opacity-0"}`} />
        <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ease-out ${isActive ? "text-blue-600" : "text-foreground/70 group-hover:text-foreground"}`} />
        <motion.span 
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.1 }}
          className="text-[15px] font-medium tracking-tight whitespace-nowrap overflow-hidden"
        >
          {!isCollapsed && label}
        </motion.span>
      </Link>
    );
  };

  useEffect(() => {
    const onCollapse = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "boolean") setIsCollapsed(!!detail);
      else if (detail && typeof detail.open === "boolean") setIsCollapsed(!!detail.open);
    };
    window.addEventListener("agora:sidebar:collapse" as any, onCollapse as any);
    window.addEventListener("article:mode" as any, onCollapse as any);
    return () => {
      window.removeEventListener("agora:sidebar:collapse" as any, onCollapse as any);
      window.removeEventListener("article:mode" as any, onCollapse as any);
    };
  }, []);

  // Auto-collapse on edit page mount; stay open on dashboard
  useEffect(() => {
    if (isEditPage) setIsCollapsed(true);
    else if (isDashboard) setIsCollapsed(false);
  }, [isEditPage, isDashboard]);

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent dark:from-white/5" />
      </div>

      {/* Sidebar (desktop) - sticky with glass effect */}
      <motion.aside
        className="hidden md:flex flex-col sticky top-0 self-start h-screen border-r border-border/30 bg-card/70 backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.03)] z-30"
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ 
          width: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
          default: { duration: 0.3 }
        }}
        style={{ willChange: "width" }}
        onMouseEnter={() => { if (isEditPage && isCollapsed) setIsCollapsed(false); }}
        onMouseLeave={() => { if (isEditPage && !isCollapsed) setIsCollapsed(true); }}
      >

        <div className={`h-full flex flex-col transition-all duration-400 ease-out ${isCollapsed ? "px-3 py-5" : "px-5 py-6"}`}>
          <Link href="/" className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} px-2 py-2 mb-8 text-foreground/90 hover:text-foreground transition-all duration-300 ease-out rounded-lg hover:bg-foreground/[0.04] active:scale-[.98]`}>
            <Home className="w-5 h-5 text-blue-600 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105" />
            <motion.span 
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="text-[15px] font-semibold tracking-tight whitespace-nowrap overflow-hidden"
            >
              {!isCollapsed && t("header.backToSite")}
            </motion.span>
          </Link>

          <nav className={`flex-1 space-y-1.5 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
            <NavItem href="/admin-secret-xyz/dashboard" icon={LineChart} label={t("header.dashboard") as any} />
            <NavItem href="/admin-secret-xyz/products" icon={Package} label={t("admin.products") as any} />
            <NavItem href="/admin-secret-xyz/categories" icon={Tags} label={t("admin.categories") as any} />
            <NavItem href="/admin-secret-xyz/banners" icon={Megaphone} label={t("admin.banners") as any} />
            <NavItem href="/admin-secret-xyz/settings" icon={Settings} label={t("admin.settings") as any} />
          </nav>

          <div className={`mt-auto pt-5 border-t border-border/40 transition-all duration-300 ${isCollapsed ? "flex justify-center" : "space-y-3"}`}>
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-2"}`}>
              <Image src={session?.user?.image || "/globe.svg"} alt={session?.user?.name || "Admin"} width={36} height={36} className="rounded-full ring-2 ring-border/30" unoptimized />
              <motion.span
                initial={false}
                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                transition={{ duration: 0.2 }}
                className="text-[14px] font-medium text-foreground/90 truncate overflow-hidden whitespace-nowrap"
              >
                {!isCollapsed && session?.user?.name}
              </motion.span>
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1, height: isCollapsed ? 0 : "auto" }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {!isCollapsed && (
                <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-red-500/90 hover:text-red-600 hover:bg-red-500/5 rounded-lg transition-all">
                  <LogOut className="w-4 h-4" />
                  {t("header.logout")}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="relative flex-1 flex flex-col">
        <SoftBubbles strength={0.06} />
        {/* Top bar (desktop) - sticky header with glass effect */}
        <header className="hidden md:flex sticky top-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-b border-border/40 h-16 items-center justify-end px-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-base font-semibold text-foreground/90 tracking-tight">AgoraRecomendo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[220px]">{session?.user?.name}</span>
            <LanguageToggle />
            <ThemeToggleButton />
          </div>
        </header>

        {/* Top bar (mobile) */}
        <header className="md:hidden sticky top-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-b border-border/40 h-16 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarOpen(true)} className="active:scale-95 transition-transform">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-lg font-semibold text-foreground/90">AgoraRecomendo</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
 