"use client";

import React from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { JSONContent, EditorInstance } from "novel";
import { useLanguage } from "./LanguageProvider";
import { AppleButton } from "./ui/apple-button";
import { AppleBadge } from "./ui/apple-badge";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), { ssr: false });

export type SaveStatus = "Saved" | "Saving" | "Unsaved" | "Error";
export type PublishStatus = "draft" | "published";

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
    const [contentEn, setContentEn] = React.useState<JSONContent | null>(null);
    const [contentPtBr, setContentPtBr] = React.useState<JSONContent | null>(null);
  const [currentHtml, setCurrentHtml] = React.useState<string>(
    locale === "pt-BR" ? initialArticlePtBr || "" : initialArticleEn || ""
  );
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("Saved");
  const [publishStatus, setPublishStatus] = React.useState<PublishStatus>("draft");
  const [dirty, setDirty] = React.useState(false);
  const autosaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const lastUrlRef = React.useRef<string>("");
  const userHidRef = React.useRef<boolean>(false); // Track if user intentionally hid editor
  const editorRef = React.useRef<EditorInstance | null>(null);

  // Load initial publish status
  React.useEffect(() => {
    const loadPublishStatus = async () => {
      try {
        const resGet = await fetch(`/api/products/${productId}`);
        if (resGet.ok) {
          const prod = await resGet.json();
          let scraped: any = {};
          try {
            scraped = prod?.scrapedQnA ? JSON.parse(prod.scrapedQnA) : {};
          } catch {}
          const status = scraped.articleStatus?.[locale] || "draft";
          setPublishStatus(status);
        }
      } catch (e) {
        console.error("Failed to load publish status", e);
      }
    };
    loadPublishStatus();
  }, [productId, locale]);

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

    // Parse initial content for Novel editor
    React.useEffect(() => {
      try {
        if (initialArticleEn) {
          const parsed = JSON.parse(initialArticleEn);
          if (parsed.type === "doc") setContentEn(parsed);
        }
      } catch (e) {
        // Not JSON, keep as HTML
      }
      try {
        if (initialArticlePtBr) {
          const parsed = JSON.parse(initialArticlePtBr);
          if (parsed.type === "doc") setContentPtBr(parsed);
        }
      } catch (e) {
        // Not JSON, keep as HTML
      }
    }, [initialArticleEn, initialArticlePtBr]);

    // Get current content for editor
    const getCurrentContent = (): JSONContent | null => {
      return locale === "pt-BR" ? contentPtBr : contentEn;
    };

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
        setPublishStatus(opts?.publish ? "published" : "draft");
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

  // Cmd/Ctrl + S saves; Cmd+Shift+E toggles fullscreen; Esc exits
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isSave = (e.metaKey || e.ctrlKey) && (e.key?.toLowerCase?.() === "s" || (e as any).code === "KeyS");
      const isToggleFs = (e.metaKey || e.ctrlKey) && e.shiftKey && ((e.key?.toLowerCase?.() === "e") || (e as any).code === "KeyE");
      const isEsc = e.key === "Escape";
      const isSelectAll = (e.metaKey || e.ctrlKey) && (e.key?.toLowerCase?.() === "a" || (e as any).code === "KeyA");

      // Em fullscreen, Cmd+A seleciona apenas dentro do editor
      if (isFullscreen && isSelectAll) {
        e.preventDefault();
        e.stopPropagation();
        try {
          // Garante foco e seleção apenas no editor
          const editorEl = document.querySelector('.ProseMirror') as HTMLElement | null;
          editorEl?.focus();
          editorRef.current?.commands?.selectAll?.();
        } catch {}
        return;
      }

      if (isSave) {
        e.preventDefault();
        handleSave();
        return;
      }
      if (isToggleFs) {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
        return;
      }
      if (isEsc && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
        return;
      }
    };
    // Capture phase listeners to avoid editors intercepting first
    window.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      document.removeEventListener("keydown", onKeyDown, { capture: true } as any);
    };
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
      // Focar o editor para que Cmd+A selecione dentro do conteúdo
      setTimeout(() => {
        try {
          const editorEl = document.querySelector('.ProseMirror') as HTMLElement | null;
          editorEl?.focus();
        } catch {}
      }, 50);
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
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <AppleBadge 
        variant={publishStatus === "published" ? "success" : "warning"}
        className="text-xs"
      >
        {publishStatus === "published" ? tr("article.public", "Public") : tr("article.draft", "Draft")}
      </AppleBadge>
      
      {/* Action Buttons */}
      {publishStatus === "published" ? (
        <AppleButton
          size="sm"
          variant="secondary"
          onClick={() => handleSave(undefined, { publish: false })}
          disabled={saveStatus === "Saving"}
        >
          {tr("article.unpublish", "Unpublish")}
        </AppleButton>
      ) : (
        <AppleButton
          size="sm"
          variant="primary"
          onClick={() => handleSave(undefined, { publish: true })}
          disabled={saveStatus === "Saving"}
        >
          {tr("article.publish", "Publish")}
        </AppleButton>
      )}
      
      <AppleButton
        size="sm"
        variant="secondary"
        onClick={() => handleSave(undefined, { publish: publishStatus === "published" })}
        disabled={saveStatus === "Saving"}
      >
        {saveStatus === "Saving" ? tr("common.saving", "Saving...") : tr("common.save", "Save")}
      </AppleButton>
    </div>
  );

  const editorCommonProps = {
    initialContent: getCurrentContent(),
    onChange,
    onJSONChange: (json: JSONContent) => {
      if (locale === "pt-BR") setContentPtBr(json);
      else setContentEn(json);
    },
    onEditorReady: (editor: EditorInstance) => {
      editorRef.current = editor;
    },
    saveStatus,
    placeholder: locale === "pt-BR" ? "Comece a escrever seu artigo..." : "Start writing your article...",
    leftOverlay: LeftBadge,
    actionArea: ActionArea,
    // Handle apenas no fullscreen nesta etapa
    showDragHandle: isFullscreen,
  } as const;

  // Return null when hidden - floating button will be shown by parent
  if (isHidden) {
    return null;
  }

  return (
    <div className={`${isClosing ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}>
      {/* Editor */}
        {!isFullscreen && (
          <div className="flex flex-col items-center gap-4 py-4 sm:px-4">
            {/* Card Apple-like com mensagem PT/EN */}
            <div className="w-full max-w-screen-lg">
              <div className="mx-auto inline-flex max-w-full items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-b from-background/80 to-background/60 px-4 py-2.5 text-[13px] text-foreground/85 shadow-md backdrop-blur-md">
                <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-medium text-foreground/90">💡</div>
                <div className="truncate">
                  For a cleaner, Notion‑style drag handle experience, switch to distraction‑free fullscreen.
                </div>
              </div>
            </div>
            <NovelEditor key={`inline-${locale}`} {...editorCommonProps} />
          </div>
        )}

      {/* Fullscreen inline overlay */}
      {isFullscreen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm p-3 overflow-auto" role="dialog" aria-modal="true">
          {/* Barra de atalhos estilo Apple-like */}
          <div className="sticky top-2 z-[101] mb-2 flex w-full justify-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-1.5 text-[13px] text-foreground/80 shadow-sm">
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">⌘</span>
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">S</span>
                <span className="text-muted-foreground">save</span>
              </div>
              <div className="h-5 w-px bg-border/70" />
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">⌘</span>
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">⇧</span>
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">E</span>
                <span className="text-muted-foreground">fullscreen</span>
              </div>
              <div className="h-5 w-px bg-border/70" />
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-7 min-w-12 items-center justify-center rounded-xl border border-border/60 bg-background/70 px-2 font-semibold">Esc</span>
                <span className="text-muted-foreground">exit</span>
              </div>
            </div>
          </div>
          <div className="flex min-h-screen flex-col items-center gap-2 py-2 sm:px-4">
            <NovelEditor key={`fullscreen-${locale}`} {...editorCommonProps} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
