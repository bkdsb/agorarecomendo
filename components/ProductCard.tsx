"use client";

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// 1. Importamos o ícone de seta
import { ArrowUpRight } from 'lucide-react';

// 2. Adicionamos os links nas Props
interface ProductCardProps {
  imageUrl: string;
  title: string;
  category: string;
  description: string;
  articleLink: string; // Link para nosso artigo
  affiliateLink: string; // Link direto para o afiliado
  imageFit?: 'cover' | 'contain';
  imagePosition?: string; // ex.: 'center', '50% 30%'
  imageScale?: number; // zoom do preview
}

export default function ProductCard({
  imageUrl,
  title,
  category,
  description,
  articleLink,
  affiliateLink,
  imageFit = 'contain',
  imagePosition = 'center',
  imageScale = 1,
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = (y / (height / 2)) * -5; // Rotação sutil
    const rotateY = (x / (width / 2)) * 5; // Rotação sutil

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.transition = 'transform 0.1s ease-out';
  };

  const onMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    card.style.transition = 'transform 0.3s ease-in-out';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s ease-in-out' }}
      className="group relative w-full overflow-hidden rounded-2xl 
                 border border-black/10 dark:border-white/10 
                 bg-card shadow-lg"
    >
      {/* Imagem quadrada para padronizar (equivalente a 300x300 responsivo) */}
      <div className="relative w-full pt-[100%] overflow-hidden bg-foreground/5">
        <Image
          src={imageUrl}
          alt={`Imagem do ${title}`}
          fill
          style={{ objectFit: imageFit, objectPosition: imagePosition, transform: `scale(${imageScale})`, transformOrigin: imagePosition }}
          className="transition-transform duration-300 group-hover:scale-105 will-change-transform"
        />
      </div>
      <div className="p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {category}
        </span>
        <h3 className="mt-2 text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-foreground/80">{description}</p>
        
        {/* --- 3. NOVOS BOTÕES --- */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Botão 1: Mais Informações (linka para o artigo) */}
          <Link
            href={articleLink}
            className="flex-1 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium 
                       border border-preto-espacial/20 text-preto-espacial 
                       transition-colors hover:bg-preto-espacial/5
                       dark:border-branco-gelo/20 dark:text-branco-gelo dark:hover:bg-branco-gelo/10"
          >
            Mais Informações
          </Link>
          {/* Botão 2: Ver Produto (linka para afiliado) */}
          <a
            href={affiliateLink}
            target="_blank" // Abre em nova aba
            rel="noopener noreferrer" // Segurança
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium 
                       bg-preto-espacial text-branco-gelo 
                       transition-colors hover:bg-preto-espacial/90
                       dark:bg-branco-gelo dark:text-preto-espacial dark:hover:bg-branco-gelo/90"
          >
            Ver Produto
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
