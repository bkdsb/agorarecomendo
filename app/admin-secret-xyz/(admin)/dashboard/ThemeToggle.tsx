'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative group"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative px-3 py-2 rounded-xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all duration-500">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors duration-500" />
        ) : (
          <Moon className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors duration-500" />
        )}
      </div>
    </button>
  );
}
