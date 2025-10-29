"use client";
import { useMemo } from 'react';

export interface ReviewItem {
  id: string;
  author?: string | null;
  rating?: number | null;
  content: string;
  avatarUrl?: string | null;
}

export default function ReviewsMarquee({ reviews, showStars = false, speed = 30 }: { reviews: ReviewItem[]; showStars?: boolean; speed?: number; }) {
  const list = useMemo(()=> (reviews || []).filter(r=> (r?.content||'').trim().length > 0), [reviews]);
  if(list.length === 0) return null;

  // Duplicar para loop contínuo
  const doubled = [...list, ...list];

  return (
    <div className="relative overflow-hidden">
      <div className="flex gap-4 will-change-transform animate-marquee" style={{ animationDuration: `${speed}s` }}>
        {doubled.map((r, i) => (
          <div key={r.id + ':' + i} className="shrink-0 w-72 rounded-2xl border border-border bg-card/60 backdrop-blur p-4">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              {r.avatarUrl ? (
                <img src={r.avatarUrl} alt={r.author || 'avatar'} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-foreground/10" />
              )}
              <span className="truncate">{r.author || 'Usuário'}</span>
            </div>
            <div className="mt-1 text-xs text-foreground/70">{(Number(r.rating)||0).toFixed(1)} / 5.0 {showStars ? '⭐'.repeat(Math.round(Number(r.rating)||0)) : ''}</div>
            <p className="mt-2 text-sm text-foreground/80 line-clamp-3">“{r.content}”</p>
          </div>
        ))}
      </div>
    </div>
  );
}
