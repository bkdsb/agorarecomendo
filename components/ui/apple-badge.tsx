"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SaveStatus = "saved" | "editing" | "saving" | "failed";

export interface AppleBadgeProps {
  status?: SaveStatus;
  children?: React.ReactNode;
  variant?: "status" | "default" | "purple" | "blue" | "success" | "warning";
  className?: string;
}

// Premium space-themed colors - subtle and sophisticated
const statusConfig: Record<SaveStatus, { bg: string; text: string; dot: string; label: string }> = {
  saved: {
    bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06]",
    text: "text-emerald-600/80 dark:text-emerald-400/80",
    dot: "bg-emerald-500/70",
    label: "Saved",
  },
  editing: {
    bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06]",
    text: "text-blue-600/80 dark:text-blue-400/80",
    dot: "bg-blue-500/70",
    label: "Editing",
  },
  saving: {
    bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06]",
    text: "text-blue-600/80 dark:text-blue-400/80",
    dot: "bg-blue-500/70 animate-pulse",
    label: "Saving",
  },
  failed: {
    bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06]",
    text: "text-red-600/80 dark:text-red-400/80",
    dot: "bg-red-500/70",
    label: "Failed",
  },
};

const variantConfig: Record<string, string> = {
  default: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06] text-foreground/60",
  purple: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06] text-purple-600/80 dark:text-purple-400/80",
  blue: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06] text-blue-600/80 dark:text-blue-400/80",
  success: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06] text-emerald-600/80 dark:text-emerald-400/80",
  warning: "bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.06] text-amber-600/80 dark:text-amber-400/80",
};

export function AppleBadge({ status, children, variant = "default", className }: AppleBadgeProps) {
  const config = status ? statusConfig[status] : null;
  const finalVariant = status ? "" : (variantConfig[variant] || variantConfig.default);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide border shadow-sm backdrop-blur-xl",
        config ? `${config.bg} ${config.text}` : finalVariant,
        className
      )}
    >
      {config && <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />}
      {status && config ? config.label : children}
    </span>
  );
}
