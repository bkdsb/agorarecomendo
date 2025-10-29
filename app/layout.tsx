import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Importamos nossos novos provedores
import ThemeProvider from "../components/ThemeProvider";
import SessionProviderWrapper from "../components/SessionProviderWrapper";
import ToastProvider from "../components/ToastProvider";

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
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 2. Embrulhamos TUDO com os dois provedores */}
        <SessionProviderWrapper>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

