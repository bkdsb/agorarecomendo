"use client";

import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  strength?: number; // 0.0 - 1.0
  className?: string;
};

// Subtle blurred gradient bubbles with a tiny parallax on scroll.
// Respects reduced motion and dark mode automatically via Tailwind classes.
export default function SoftBubbles({ strength = 0.06, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  , []);

  useEffect(() => {
    if (prefersReduced) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const t1 = (y * strength);
        const t2 = (y * strength * 0.7);
        const t3 = (y * strength * 1.2);
        const nodes = el.querySelectorAll('[data-bubble]');
        nodes.forEach((n, i) => {
          const ty = i === 0 ? t1 : i === 1 ? -t2 : t3;
          (n as HTMLElement).style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, prefersReduced]);

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Light mode bubbles */}
      <div data-bubble className="absolute -top-24 -left-24 w-[38vw] h-[38vw] rounded-full blur-3xl bg-blue-500/10 dark:hidden" />
      <div data-bubble className="absolute top-1/2 -translate-y-1/2 -right-24 w-[30vw] h-[30vw] rounded-full blur-3xl bg-purple-500/10 dark:hidden" />
      <div data-bubble className="absolute bottom-0 left-1/3 w-[28vw] h-[28vw] rounded-full blur-[72px] bg-cyan-400/10 dark:hidden" />

      {/* Dark mode bubbles (cooler, more cosmic) */}
      <div data-bubble className="hidden dark:block absolute -top-28 -left-16 w-[40vw] h-[40vw] rounded-full blur-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.10),transparent_60%)]" />
      <div data-bubble className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[42vw] h-[42vw] rounded-full blur-3xl bg-[radial-gradient(circle_at_70%_40%,rgba(168,85,247,0.10),transparent_60%)]" />
      <div data-bubble className="hidden dark:block absolute top-1/3 left-1/2 -translate-x-1/2 w-[28vw] h-[28vw] rounded-full blur-[80px] bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08),transparent_60%)]" />
    </div>
  );
}
