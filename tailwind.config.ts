import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Habilitamos o modo dark para 'class' (como definimos no layout.tsx)
  darkMode: "class",
  theme: {
    extend: {
      // Adicionando nossas cores customizadas
      colors: {
        'preto-espacial': '#0C0C0D',
        'cinza-espacial': '#1C1C1E',
        'branco-gelo': '#F2F2F2',
        // Cores base que pegam as variáveis do globals.css
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // Adicionando a animação de brilho (sheen)
      animation: {
        sheen: 'sheen 1.5s infinite',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        sheen: {
          '0%': { transform: 'skewX(-20deg) translateX(-150%)' },
          '100%': { transform: 'skewX(-20deg) translateX(150%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [typography],
};
export default config;
