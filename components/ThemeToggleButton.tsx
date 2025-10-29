"use client";

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Garante que o botão só renderize no navegador
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder para evitar "layout shift"
    return <div className="w-10 h-10 p-2" />;
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors 
                 text-preto-espacial/60 hover:text-preto-espacial hover:bg-black/10
                 dark:text-branco-gelo/80 dark:hover:text-branco-gelo dark:hover:bg-white/10"
      aria-label="Mudar tema"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
