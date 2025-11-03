"use client";

import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";

export default function DashboardMenuButton() {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to products which has the full AdminLayout with sidebar
    router.push('/admin-secret-xyz/products');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative group"
      aria-label="Open navigation menu"
    >
      <div className="relative px-3 py-2 rounded-xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all duration-500">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors duration-500" />
          <span className="text-[11px] font-semibold tracking-wide text-foreground/70 group-hover:text-foreground transition-colors duration-500">
            Dashboard
          </span>
        </div>
      </div>
    </button>
  );
}
