"use client";

import React from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { JSONContent } from "novel";
import { useLanguage } from "./LanguageProvider";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), { ssr: false });

export type SaveStatus = "Saved" | "Saving" | "Unsaved" | "Error";

// slug helpers removed: slug is managed in product edit page

export default function InlineProductArticleEditor({
  productId,
  initialTitle,
  initialSlug,
  initialArticleEn,
  initialArticlePtBr,
  onSaved,
  onHiddenChange,
  externalHidden = false,
}: {
  productId: string;
  initialTitle: string;
  initialSlug: string;
  initialArticleEn?: string | null;
  initialArticlePtBr?: string | null;
  onSaved?: () => void;
  onHiddenChange?: (hidden: boolean) => void;
  externalHidden?: boolean;
}) {
  const { locale, t } = useLanguage() as { locale: "en-US" | "pt-BR"; t: (k: string) => string };
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  // Title/slug editing moved to product edit page
  const [title] = React.useState<string>(initialTitle || "");
  const [slug] = React.useState<string>(initialSlug || "");
  const [htmlEn, setHtmlEn] = React.useState<string>(initialArticleEn || "");
  const [htmlPt, setHtmlPt] = React.useState<string>(initialArticlePtBr || "");
  const [currentHtml, setCurrentHtml] = React.useState<string>(
    locale === "pt-BR" ? initialArticlePtBr || "" : initialArticleEn || ""
  );
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("Saved");
  const [dirty, setDirty] = React.useState(false);
  const autosaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const lastUrlRef = React.useRef<string>("");
  const userHidRef = React.useRef<boolean>(false); // Track if user intentionally hid editor

  // Sync with external hidden state
  React.useEffect(() => {
    if (!externalHidden && isHidden) {
      setIsHidden(false);
      setIsClosing(false);
      userHidRef.current = false;
    }
  }, [externalHidden, isHidden]);

  // Listen for URL changes to reopen editor when ?editor=article is present
  React.useEffect(() => {
    const currentUrl = window.location.href;
    
    // Only process if URL actually changed
    if (currentUrl !== lastUrlRef.current) {
      lastUrlRef.current = currentUrl;
      
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      // Only reopen if user intentionally hid it AND URL changed to editor params
      if ((params.get('editor') === 'article' || hash === '#editor') && isHidden && userHidRef.current) {
        setIsHidden(false);
        setIsClosing(false);
        userHidRef.current = false; // Reset flag
        onHiddenChange?.(false); // Notify parent
        // Scroll to editor after showing
        setTimeout(() => {
          document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  });

  // Sync currentHtml when locale changes and initialize URL tracking
  React.useEffect(() => {
    setCurrentHtml(locale === "pt-BR" ? htmlPt : htmlEn);
    if (!lastUrlRef.current) {
      lastUrlRef.current = window.location.href; // Initialize on mount
    }
  }, [locale, htmlPt, htmlEn]);

  // Title/slug no longer auto-generated here

  const handleSave = React.useCallback(
    async (forcedHtml?: string, opts?: { publish?: boolean; silent?: boolean }) => {
      try {
        setSaveStatus("Saving");
        const html = forcedHtml ?? currentHtml;
        const payload: any = { scrapedQnA: undefined as any };
        if (locale === "en-US") {
          payload.article = html;
        } else {
          payload.articlePtBr = html;
        }
        // Keep localized status inside scrapedQnA (slug is managed elsewhere now)
        const resGet = await fetch(`/api/products/${productId}`);
        const prod = resGet.ok ? await resGet.json() : null;
        let scraped: any = {};
        try {
          scraped = prod?.scrapedQnA ? JSON.parse(prod.scrapedQnA) : {};
        } catch {}
        scraped.articleStatus = scraped.articleStatus || { "en-US": "draft", "pt-BR": "draft" };
        scraped.articleStatus[locale] = opts?.publish ? "published" : "draft";
        payload.scrapedQnA = scraped;

        const res = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Save failed", res.status, txt);
          throw new Error("Failed to save");
        }
        setDirty(false);
        setSaveStatus("Saved");
        onSaved?.();
      } catch (e) {
        console.error(e);
        setSaveStatus("Error");
      }
    },
    [productId, currentHtml, title, slug, locale]
  );

  const onChange = (html: string) => {
    setCurrentHtml(html);
    if (locale === "pt-BR") setHtmlPt(html);
    else setHtmlEn(html);
    setDirty(true);
    setSaveStatus("Unsaved");
    // Atualiza visual do artigo em tempo real (área superior da página)
    try {
      window.dispatchEvent(new CustomEvent("article:preview:update", { detail: html }));
    } catch {}
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      handleSave(html, { silent: true });
    }, 5000);
  };

  // Cmd/Ctrl + S saves; Cmd+Shift+E or Esc toggles fullscreen
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      // Cmd+Shift+E toggles fullscreen
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
      // Esc exits fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, isFullscreen]);

  // Listen for external fullscreen toggle events
  React.useEffect(() => {
    const onToggle = () => setIsFullscreen((prev) => !prev);
    window.addEventListener('editor:toggle-fullscreen', onToggle);
    return () => window.removeEventListener('editor:toggle-fullscreen', onToggle);
  }, []);

  // Lock scroll when fullscreen
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    if (isFullscreen) {
      const prev = html.style.overflow;
      html.style.overflow = 'hidden';
      return () => {
        html.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  const localeBadge = locale === "pt-BR" ? "🇧🇷 Português (Brasil)" : "🇺🇸 English (US)";

  // Auto-resize removed (no textareas here now)

  if (isHidden) return null;

  // Badge de idioma para o topo esquerdo
  const LeftBadge = (
    <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-foreground/70 shadow-sm border border-black/5 dark:border-white/10">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      <span className="font-medium select-none">{localeBadge}</span>
    </div>
  );

  const ActionArea = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSave(undefined, { publish: false })}
        className="btn-secondary btn-sm"
        disabled={saveStatus === "Saving"}
      >
        {saveStatus === "Saving" ? tr("common.saving", "Saving...") : tr("common.save", "Save")}
      </button>
      <button
        onClick={() => handleSave(undefined, { publish: true })}
        className="btn-primary btn-sm"
        disabled={saveStatus === "Saving"}
      >
        {tr("article.publish", "Publish")}
      </button>
      <button
        onClick={() => setIsFullscreen(true)}
        className="btn-ghost btn-sm"
      >
        {tr("article.fullscreen", "Open fullscreen")}
      </button>
    </div>
  );

  const editorCommonProps = {
    initialContent: undefined as unknown as JSONContent,
    onChange,
    saveStatus,
    placeholder: locale === "pt-BR" ? "Comece a escrever seu artigo..." : "Start writing your article...",
    leftOverlay: LeftBadge,
    actionArea: ActionArea,
  } as const;

  // Return null when hidden - floating button will be shown by parent
  if (isHidden) {
    return null;
  }

  return (
    <div className={`${isClosing ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}>
      {/* Editor */}
      {!isFullscreen && <NovelEditor {...editorCommonProps} />}

      {/* Fullscreen inline overlay */}
      {isFullscreen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm p-4 overflow-auto" role="dialog" aria-modal="true">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-secondary btn-sm"
              autoFocus
            >
              {tr("article.exit_fullscreen", "Exit fullscreen")}
            </button>
          </div>
          <div className="max-w-5xl mx-auto">
            <NovelEditor {...editorCommonProps} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
