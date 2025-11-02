"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "premium";
}

export function AppleCard({ children, className, variant = "default" }: AppleCardProps) {
  const variantStyles = {
    default: "bg-card/70 border-border",
    glass: "bg-white/60 dark:bg-white/5 border-black/10 dark:border-white/10",
    premium: "bg-gradient-to-b from-card/80 to-card/60 border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl transition-all",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
