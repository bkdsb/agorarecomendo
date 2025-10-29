"use client";
import { useEffect, useMemo, useState } from 'react';

export interface ReviewItem {
  id: string;
  author?: string | null;
  rating?: number | null;
  content: string;
  avatarUrl?: string | null;
}

export default function ReviewsCarousel({ reviews, showStars = false, variant = 'slide', intervalMs = 4000 }: { reviews: ReviewItem[]; showStars?: boolean; variant?: 'slide' | 'fade'; intervalMs?: number; }) {
  const list = useMemo(()=> (reviews || []).filter(r=> (r?.content||'').trim().length > 0), [reviews]);
  const [index, setIndex] = useState(0);
  useEffect(()=>{
    if(list.length <= 1) return;
    const i = setInterval(()=> setIndex((prev)=> (prev + 1) % list.length), intervalMs);
    return ()=> clearInterval(i);
  }, [list.length, intervalMs]);

  if (list.length === 0) return null;
  const r = list[index];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur shadow-xl">
        <div
          className={
            variant === 'fade'
              ? 'p-6 transition-opacity duration-700 ease-out opacity-100'
              : 'p-6 transition-transform duration-500 ease-out'
          }
          key={r.id + ':' + index}
          style={variant === 'slide' ? { transform: 'translateX(0)' } : undefined}
        >
          <div className="flex items-center justify-center gap-3 text-sm font-medium text-foreground">
            {r.avatarUrl ? (
              <img src={r.avatarUrl} alt={r.author || 'avatar'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-foreground/10" />
            )}
            <span>{r.author || 'Usuário'}</span>
          </div>
          <div className="mt-1 text-center text-xs text-foreground/70">
            {(Number(r.rating) || 0).toFixed(1)} / 5.0 {showStars ? '⭐'.repeat(Math.round(Number(r.rating)||0)) : ''}
          </div>
          <p className="mt-3 text-center text-foreground/80">“{r.content}”</p>
        </div>
      </div>
    </div>
  );
}
