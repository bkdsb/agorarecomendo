/**
 * Configuração do Next.js. Este arquivo está em formato .mjs (JavaScript Module)
 */
const config = {
  // Garantir que a renderização seja estrita
  reactStrictMode: true,
  // Definir explicitamente a raiz para o Turbopack quando houver múltiplos lockfiles no workspace
  turbopack: {
    // Usar o diretório atual (raiz do app Next.js)
    root: '.',
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
