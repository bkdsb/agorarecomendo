"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantStyles = {
      primary: "bg-gradient-to-b from-[#007AFF] to-[#0051D5] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,122,255,0.24)] hover:shadow-[0_4px_20px_rgba(0,122,255,0.4)] hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl",
      secondary: "bg-white/60 dark:bg-white/10 text-gray-900 dark:text-gray-100 border border-black/10 dark:border-white/20 shadow-sm hover:bg-white/80 dark:hover:bg-white/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl",
      ghost: "bg-transparent text-foreground hover:bg-foreground/5 active:bg-foreground/10",
      danger: "bg-gradient-to-b from-red-500/90 to-red-600/90 text-white border border-red-400/20 shadow-sm hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
    };
    
    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

AppleButton.displayName = "AppleButton";

export { AppleButton };
