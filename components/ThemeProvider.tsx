"use client";

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

// Este componente é necessário para "embrulhar" nosso site
// e dar a ele a capacidade de trocar de tema.
// Ele também previne "hydration mismatches" (bugs de tema)
export default function Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Se ainda não "montou" no navegador, renderiza sem tema
    // para evitar bugs visuais.
    return <>{children}</>;
  }

  // "attribute='class'" diz ao next-themes para trocar
  // a classe no <html> (ex: <html class="dark">)
  return <ThemeProvider attribute="class">{children}</ThemeProvider>;
}
