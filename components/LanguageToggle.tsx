"use client";

import { useLanguage } from './LanguageProvider';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const isBR = locale === 'pt-BR';

  const toggleLanguage = () => {
    const newLocale = isBR ? 'en-US' : 'pt-BR';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative group"
      aria-label="Toggle language"
    >
      {/* Premium glass container with subtle country colors */}
      <div className={`
        relative px-3 py-2 rounded-xl backdrop-blur-xl 
        bg-white/50 dark:bg-white/[0.06] 
        border border-black/[0.06] dark:border-white/[0.06] 
        shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] 
        dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)]
        ${isBR 
          ? 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.12),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(16,185,129,0.2),inset_0_1px_2px_rgba(255,255,255,0.06)]' 
          : 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.12),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(59,130,246,0.2),inset_0_1px_2px_rgba(255,255,255,0.06)]'
        }
        transition-all duration-500 ease-out
      `}>
        {/* Subtle country color glow - Brazil: green/yellow, USA: blue/red */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
          ${isBR 
            ? 'bg-gradient-to-br from-emerald-500/[0.06] via-yellow-500/[0.03] to-emerald-500/[0.04] dark:from-emerald-400/[0.05] dark:via-yellow-400/[0.025] dark:to-emerald-400/[0.03]' 
            : 'bg-gradient-to-br from-blue-500/[0.06] via-red-500/[0.02] to-blue-500/[0.04] dark:from-blue-400/[0.05] dark:via-red-400/[0.015] dark:to-blue-400/[0.03]'
          }
        `} />
        
        {/* Light reflection on top */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative flex items-center gap-2">
          <Languages className={`
            w-4 h-4 transition-colors duration-500
            ${isBR 
              ? 'text-foreground/60 group-hover:text-emerald-600/80 dark:group-hover:text-emerald-400/80' 
              : 'text-foreground/60 group-hover:text-blue-600/80 dark:group-hover:text-blue-400/80'
            }
          `} />
          <span className={`
            text-[11px] font-semibold tracking-wide transition-colors duration-500
            ${isBR 
              ? 'text-foreground/70 group-hover:text-emerald-700/90 dark:group-hover:text-emerald-300/90' 
              : 'text-foreground/70 group-hover:text-blue-700/90 dark:group-hover:text-blue-300/90'
            }
          `}>
            {isBR ? 'PT' : 'EN'}
          </span>
        </div>
      </div>
      
      {/* Premium tooltip with country color accent */}
      <span className={`
        absolute -bottom-9 left-1/2 -translate-x-1/2 
        px-2.5 py-1.5 text-[10px] font-semibold rounded-lg
        opacity-0 group-hover:opacity-100 
        transition-all duration-300 pointer-events-none whitespace-nowrap 
        backdrop-blur-xl border shadow-lg
        ${isBR 
          ? 'bg-blue-500/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-400/30' 
          : 'bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-400/30'
        }
      `}>
        {isBR ? 'English' : 'Português'}
      </span>
    </button>
  );
}
