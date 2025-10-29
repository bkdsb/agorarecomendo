"use client";

// Este componente é o "wrapper" que fornece
// os dados de sessão (quem está logado) para
// todos os componentes de cliente (como o Header).
import { SessionProvider } from 'next-auth/react';

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
