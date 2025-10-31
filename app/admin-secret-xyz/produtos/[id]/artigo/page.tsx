"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import type { JSONContent } from "novel";

type Product = {
  id: string;
  title: string;
  article: string | null;
  articlePtBr?: string | null;
};

export default function ArticleEditorPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"Saved" | "Saving" | "Unsaved" | "Error">("Saved");
  const autosaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentHtml, setCurrentHtml] = React.useState<string>("");
  const [currentLang, setCurrentLang] = React.useState<'en-US' | 'pt-BR'>('en-US');
  const [articleEn, setArticleEn] = React.useState<string>("");
  const [articlePtBr, setArticlePtBr] = React.useState<string>("");
  const [contentEn, setContentEn] = React.useState<JSONContent | null>(null);
  const [contentPtBr, setContentPtBr] = React.useState<JSONContent | null>(null);
  // Removido: preview ao vivo e editor de reviews

  // Ao digitar no NovelEditor, marcamos como sujo e agendamos autosave
  const onChange = (html: string) => {
    setCurrentHtml(html);
    if (currentLang === 'en-US') {
      setArticleEn(html);
    } else {
      setArticlePtBr(html);
    }
    setDirty(true);
    setSaveStatus("Unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      // Salva silenciosamente em background com 5s de delay, sem interromper a edição
      console.log('[Autosave] Triggering handleSave after 5s delay');
      handleSave(html, { silent: true });
    }, 5000);
  };

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar produto");
        const data: Product = await res.json();
        if (!mounted) return;
        setProduct(data);
        const enArticle = data.article || "<p>Start your article…</p>";
        const ptArticle = data.articlePtBr || "";
        setArticleEn(enArticle);
        setArticlePtBr(ptArticle);
        setCurrentHtml(enArticle);
        // Try to parse as JSON for novel editor, fallback to default
        try {
          if (enArticle) {
            const parsed = JSON.parse(enArticle);
            if (parsed.type === "doc") {
              setContentEn(parsed);
            }
          }
        } catch (e) {
          // Not JSON, keep as HTML in state
        }
        try {
          if (ptArticle) {
            const parsed = JSON.parse(ptArticle);
            if (parsed.type === "doc") {
              setContentPtBr(parsed);
            }
          }
        } catch (e) {
          // Not JSON, keep as HTML in state
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = React.useCallback(async (forcedHtml?: string, opts?: { silent?: boolean }) => {
    console.log('[handleSave] Called with forcedHtml:', !!forcedHtml, 'opts:', opts);
    try {
      setSaving(true);
      setSaveStatus("Saving");
      console.log('[handleSave] Status set to Saving');
      const html = forcedHtml ?? currentHtml;
      const payload: any = {};
      if (currentLang === 'en-US') {
        payload.article = html;
      } else {
        payload.articlePtBr = html;
      }
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha ao salvar artigo");
      setDirty(false);
      setLastSavedAt(new Date());
      setSaveStatus("Saved");
      console.log('[handleSave] Status set to Saved');
    } catch (e) {
      console.error(e);
      // Não interromper a edição: apenas marcar erro
      setSaveStatus("Error");
    } finally {
      setSaving(false);
    }
  }, [currentHtml, currentLang, params.id]);

  // Removido: CRUD de reviews

  // Atalho Ctrl/Cmd+S para salvar
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, saving, handleSave]);

  // Switch language tab
  const switchLanguage = (lang: 'en-US' | 'pt-BR') => {
    if (dirty) {
      handleSave(); // Save current before switching
    }
    setCurrentLang(lang);
    setCurrentHtml(lang === 'en-US' ? articleEn : articlePtBr);
  };

  // Get current JSONContent for novel editor
  const getCurrentContent = (): JSONContent | null => {
    return currentLang === 'en-US' ? contentEn : contentPtBr;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
        {/* Cabeçalho minimalista */}
        <div className="mb-8">
          <a
            href={`/admin-secret-xyz/produtos/${params.id}/editar`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </a>
          {product && (
            <h1 className="text-xl font-medium text-muted-foreground/80 tracking-tight">
              {product.title}
            </h1>
          )}
      </div>

      {/* Abas de Idioma (segmented control) */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl border border-border/60 bg-background/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <button
            type="button"
            onClick={() => switchLanguage('en-US')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              currentLang === 'en-US'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            🇺🇸 English
          </button>
          <button
            type="button"
            onClick={() => switchLanguage('pt-BR')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              currentLang === 'pt-BR'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            🇧🇷 Português
          </button>
        </div>
        {currentLang === 'pt-BR' && articleEn && (
          <button
            type="button"
            onClick={async () => {
              if (!articleEn) return;
              const ok = confirm('This will translate the English article to Portuguese. Continue?');
              if (!ok) return;
              const loading = setTimeout(() => alert('Translating... This may take a moment.'), 100);
              try {
                const res = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: articleEn, from: 'en-US', to: 'pt-BR' }),
                });
                const data = await res.json();
                clearTimeout(loading);
                if (data.translatedText) {
                  setArticlePtBr(data.translatedText);
                  setCurrentHtml(data.translatedText);
                  setDirty(true);
                  alert('Translation complete! Remember to review and save.');
                }
              } catch (e) {
                clearTimeout(loading);
                alert('Translation failed. Please try again.');
              }
            }}
            className="px-3 py-2 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            🤖 Auto-translate from English
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="flex min-h-screen flex-col items-center sm:px-5">
          {React.createElement(
            require('@/components/editor/NovelEditor').default,
            {
              initialContent: getCurrentContent(),
              onChange: onChange,
              saveStatus: saveStatus,
              placeholder: currentLang === 'pt-BR' 
                ? 'Comece a escrever seu artigo...' 
                : 'Start writing your article...'
            }
          )}
        </div>
      )}
    </div>
  );
}
