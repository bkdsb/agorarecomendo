import { withAuth } from "next-auth/middleware";

// Exportamos a função withAuth (não a chamamos) para que o Next.js invoque
// o proxy com os argumentos corretos (req, event). Chamar withAuth()
// no momento do import causa a execução imediata e resulta em req undefined.
export const proxy = withAuth;

export const config = {
  matcher: ['/admin-secret-xyz/:path*'],
};
