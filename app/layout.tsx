import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/prosemirror.css";
import "katex/dist/katex.min.css";

// 1. Importamos nossos novos provedores
import ThemeProvider from "../components/ThemeProvider";
import SessionProviderWrapper from "../components/SessionProviderWrapper";
import ToastProvider from "../components/ToastProvider";
import LanguageProvider from "../components/LanguageProvider";
import enUS from "../lib/locales/en-US.json";
import ptBR from "../lib/locales/pt-BR.json";
import { cookies, headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgoraRecomendo",
  description: "As melhores recomendações, selecionadas com cuidado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect locale from cookie or Accept-Language (server-side)
  // Priority: cookie > geolocation (via CF-IPCountry header) > Accept-Language
  const cookieStore = cookies();
  const hdrs = headers();
  const cookieLocale = cookieStore.get('locale')?.value as 'en-US' | 'pt-BR' | undefined;
  let detected: 'en-US' | 'pt-BR' = 'en-US';
  
  if (cookieLocale) {
    detected = cookieLocale;
  } else {
    // Check Cloudflare country header (if deployed on Cloudflare/Vercel)
    const cfCountry = hdrs.get('cf-ipcountry') || hdrs.get('x-vercel-ip-country') || '';
    // Check Accept-Language header
    const al = hdrs.get('accept-language') || '';
    
    // If country is Brazil, default to pt-BR
    if (cfCountry === 'BR' || /pt-BR|pt\b/i.test(al)) {
      detected = 'pt-BR';
    }
  }
  
  const messages = { 'en-US': enUS, 'pt-BR': ptBR } as const;
  return (
    <html lang={detected} suppressHydrationWarning>
      <body className={inter.className}>
        {/* 2. Embrulhamos TUDO com os dois provedores */}
        <SessionProviderWrapper>
          <ThemeProvider>
            <LanguageProvider initialLocale={detected} initialMessages={messages as any}>
              <ToastProvider>
                {children}
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

