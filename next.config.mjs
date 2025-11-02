/**
 * Configuração do Next.js. Este arquivo está em formato .mjs (JavaScript Module)
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  // Garantir que a renderização seja estrita
  reactStrictMode: true,
  
  // Silenciar logs verbosos do CLI
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Definir explicitamente a raiz para o Turbopack quando houver múltiplos lockfiles no workspace
  turbopack: {
    // Caminho absoluto da raiz do app Next.js
    root: __dirname,
  },

  // Configuração para permitir o carregamento de imagens de domínios externos
  images: {
    remotePatterns: [
      // Domínio para Placeholders
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Domínio do Google para carregar a foto do avatar (lh3)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // ADICIONADO: Domínios da Amazon para imagens de produtos
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default config;
