'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'confirm' | 'loading';

type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms
  confirmText?: string;
  cancelText?: string;
  placement?: 'top-right' | 'center' | 'bottom-center';
  anchor?: { x: number; y: number }; // viewport coords
};

type Toast = Required<Pick<ToastOptions, 'id'>> & Omit<ToastOptions, 'id'> & {
  createdAt: number;
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
};

type ToastContextValue = {
  push: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  error: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  info: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  loading: (title: string, description?: string, options?: Partial<ToastOptions>) => string;
  confirm: (opts: Omit<ToastOptions, 'type'>) => Promise<boolean>;
  next: (opts: ToastOptions) => void; // queue toast for next route
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((opts: ToastOptions) => {
    const id = opts.id ?? Math.random().toString(36).slice(2);
    const t: Toast = {
      id,
      title: opts.title,
      description: opts.description,
      type: opts.type ?? 'info',
      duration: opts.duration ?? (opts.type === 'loading' || opts.type === 'confirm' ? undefined : 3000),
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      placement: opts.placement,
      anchor: opts.anchor,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, t]);
    if (t.duration) {
      setTimeout(() => dismiss(id), t.duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => push({ title, description, type: 'success', duration: 2500, ...options }), [push]);
  const error = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => push({ title, description, type: 'error', duration: 3500, ...options }), [push]);
  const info = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => push({ title, description, type: 'info', duration: 3000, ...options }), [push]);
  const loading = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => push({ title, description, type: 'loading', ...options }), [push]);

  const confirm = useCallback((opts: Omit<ToastOptions, 'type'>) => {
    return new Promise<boolean>((resolve) => {
      const id = Math.random().toString(36).slice(2);
      const t: Toast = {
        id,
        title: opts.title,
        description: opts.description,
        type: 'confirm',
        confirmText: opts.confirmText ?? 'Confirm',
        cancelText: opts.cancelText ?? 'Cancel',
        placement: opts.placement ?? 'center',
        anchor: opts.anchor,
        createdAt: Date.now(),
        resolve,
      };
      setToasts((prev) => [...prev, t]);
    });
  }, []);

  // Queue toast across route transitions
  const next = useCallback((opts: ToastOptions) => {
    try {
      const payload = JSON.stringify({
        title: opts.title,
        description: opts.description,
        type: opts.type ?? 'info',
        duration: opts.duration,
        placement: opts.placement,
      });
      sessionStorage.setItem('__pending_toast', payload);
    } catch {}
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ push, dismiss, success, error, info, loading, confirm, next }), [push, dismiss, success, error, info, loading, confirm, next]);

  // Listen for cross-route queued toast
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: any) => {
      const d = e?.detail;
      if (!d) return;
      push({ title: d.title, description: d.description, type: d.type, duration: d.duration, placement: d.placement });
    };
    window.addEventListener('toast:next', handler, { once: true });
    return () => window.removeEventListener('toast:next', handler as any);
  }, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Containers de Toasts por posição */}
      {/* Top-right default stack */}
      <div className="pointer-events-none fixed inset-0 z-[60] p-4 sm:p-6">
        <div className="ml-auto flex w-full max-w-sm flex-col gap-3">
          {toasts.filter(t => (!t.placement || t.placement === 'top-right') && !t.anchor).map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </div>

      {/* Centered stack */}
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.filter(t => t.placement === 'center' && !t.anchor).map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </div>

      {/* Bottom-center stack */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mb-4 flex justify-center">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.filter(t => t.placement === 'bottom-center' && !t.anchor).map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </div>

      {/* Anchored toasts (positioned by viewport coords) */}
      {toasts.filter(t => !!t.anchor).map((t) => (
        <div key={t.id} className="pointer-events-none fixed z-[61]" style={{ left: (t.anchor!.x ?? 0) + 'px', top: (t.anchor!.y ?? 0) + 'px', transform: 'translate(-50%, -120%)' }}>
          <ToastCard toast={t} onClose={() => dismiss(t.id)} />
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { id, title, description, type, confirmText, cancelText, resolve } = toast;
  const icon = type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    : type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-500" />
    : type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" />
    : type === 'loading' ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    : <Info className="h-4 w-4 text-blue-500" />;

  const bg = type === 'error' ? 'border-red-500/30' : type === 'success' ? 'border-emerald-500/30' : 'border-white/20';

  return (
    <div className={`pointer-events-auto relative overflow-hidden rounded-xl border ${bg} bg-white/10 backdrop-blur-md shadow-lg shadow-black/10 dark:bg-white/10`}> 
      <div className="flex items-start gap-3 p-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          {title && <div className="text-sm font-semibold text-foreground">{title}</div>}
          {description && <div className="mt-0.5 text-xs text-foreground/80">{description}</div>}
          {type === 'confirm' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                onClick={() => { resolve?.(true); onClose(); }}
              >{confirmText}</button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/20"
                onClick={() => { resolve?.(false); onClose(); }}
              >{cancelText}</button>
            </div>
          )}
        </div>
        <button
          className="rounded-md p-1 text-foreground/70 hover:bg-white/10 hover:text-foreground"
          onClick={() => { resolve?.(false); onClose(); }}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Show any pending toast queued for next route
if (typeof window !== 'undefined') {
  // Run once on hydration
  setTimeout(() => {
    try {
      const raw = sessionStorage.getItem('__pending_toast');
      if (!raw) return;
      const data = JSON.parse(raw);
      // Dispatch a custom event picked up by any mounted provider
      const evt = new CustomEvent('toast:next', { detail: data });
      window.dispatchEvent(evt);
      sessionStorage.removeItem('__pending_toast');
    } catch {}
  }, 0);
}

// Hook provider to pending toast event
// Note: adding listener inside component to capture event emitted post-navigation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function usePendingToast(push: (opts: ToastOptions) => string) {
  if (typeof window === 'undefined') return;
  window.addEventListener('toast:next', (e: any) => {
    const d = e?.detail;
    if (!d) return;
    push({ title: d.title, description: d.description, type: d.type, duration: d.duration, placement: d.placement });
  }, { once: true });
}
