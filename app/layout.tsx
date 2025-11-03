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

// Função para detectar locale (reutilizável)
async function detectLocale(): Promise<'en-US' | 'pt-BR'> {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const cookieLocale = cookieStore.get('locale')?.value as 'en-US' | 'pt-BR' | undefined;
  
  if (cookieLocale) {
    return cookieLocale;
  }
  
  const cfCountry = hdrs.get('cf-ipcountry') || hdrs.get('x-vercel-ip-country') || '';
  const al = hdrs.get('accept-language') || '';
  
  if (cfCountry === 'BR' || /pt-BR|pt\b/i.test(al)) {
    return 'pt-BR';
  }
  
  return 'en-US';
}

// Metadados dinâmicos baseados no locale
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  
  const metadata = {
    'en-US': {
      title: "AR Recommends",
      description: "The best recommendations, carefully selected.",
      applicationName: "AR Recommends",
      keywords: ["recommendations", "products", "reviews", "shopping", "amazon"],
    },
    'pt-BR': {
      title: "AgoraRecomendo",
      description: "As melhores recomendações, cuidadosamente selecionadas.",
      applicationName: "AgoraRecomendo",
      keywords: ["recomendações", "produtos", "avaliações", "compras", "amazon"],
    },
  };
  
  const content = metadata[locale];
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://agorarecomendo.com';
  
  return {
    title: {
      default: content.title,
      template: `%s | ${content.title}`,
    },
    description: content.description,
    applicationName: content.applicationName,
    keywords: content.keywords,
    authors: [{ name: content.applicationName }],
    creator: content.applicationName,
    publisher: content.applicationName,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'pt-BR': '/pt',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
        { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
      ],
    },
    manifest: locale === 'pt-BR' ? '/site-pt.webmanifest' : '/site-en.webmanifest',
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'website',
      locale: locale,
      siteName: content.applicationName,
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      creator: '@agorarecomendo',
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    category: locale === 'pt-BR' ? 'recomendações' : 'recommendations',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const detected = await detectLocale();
  const messages = { 'en-US': enUS, 'pt-BR': ptBR } as const;
  return (
    <html lang={detected} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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

