import { withAuth } from "next-auth/middleware";

// Exportamos a função withAuth (não a chamamos) para que o Next.js invoque
// o middleware com os argumentos corretos (req, event). Chamar withAuth()
// no momento do import causa a execução imediata e resulta em req undefined.
export const middleware = withAuth;

export const config = {
  matcher: ['/admin-secret-xyz/:path*'],
};