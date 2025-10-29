"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  strength?: number; // pixels per 1000px scroll
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function ParallaxLayer({ strength = 0.08, className, style, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return; // respeita usuários que preferem menos movimento

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY * strength;
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform", ...style }}>
      {children}
    </div>
  );
}
