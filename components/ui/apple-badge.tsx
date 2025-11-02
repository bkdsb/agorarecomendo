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

const statusConfig: Record<SaveStatus, { bg: string; text: string; dot: string; label: string }> = {
  saved: {
    bg: "bg-gradient-to-b from-emerald-500/10 to-emerald-600/10 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Saved",
  },
  editing: {
    bg: "bg-gradient-to-b from-yellow-500/10 to-yellow-600/10 border-yellow-500/30",
    text: "text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-500",
    label: "Editing",
  },
  saving: {
    bg: "bg-gradient-to-b from-orange-500/10 to-orange-600/10 border-orange-500/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500 animate-pulse",
    label: "Saving",
  },
  failed: {
    bg: "bg-gradient-to-b from-red-500/10 to-red-600/10 border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    label: "Failed",
  },
};

const variantConfig: Record<string, string> = {
  default: "bg-gradient-to-b from-foreground/12 to-foreground/8 border-foreground/20 text-foreground/90",
  purple: "bg-gradient-to-b from-purple-500/10 to-purple-600/10 border-purple-500/30 text-purple-700 dark:text-purple-300",
  blue: "bg-gradient-to-b from-blue-500/10 to-blue-600/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
  success: "bg-gradient-to-b from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  warning: "bg-gradient-to-b from-amber-500/10 to-amber-600/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
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
