"use client";

import React from "react";
import InlineProductArticleEditor from "./InlineProductArticleEditor";

export default function InlineEditorSection({
  isAdmin,
  initialOpen,
  productId,
  initialTitle,
  initialSlug,
  initialArticleEn,
  initialArticlePtBr,
}: {
  isAdmin: boolean;
  initialOpen: boolean;
  productId: string;
  initialTitle: string;
  initialSlug: string;
  initialArticleEn?: string | null;
  initialArticlePtBr?: string | null;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  const [editorHidden, setEditorHidden] = React.useState(false);
  const editorRef = React.useRef<{ showEditor: () => void }>(null);

  const handleOpenEditor = () => {
    setEditorHidden(false);
    // Force editor to show by calling its method
    if (editorRef.current) {
      editorRef.current.showEditor();
    }
    // Scroll to editor
    setTimeout(() => {
      document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (!isAdmin) return null;

  return (
    <>
      <div id="editor" className="mt-8">
        {!open ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
            <div className="text-sm text-foreground/70 mb-2">No full article yet</div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-95"
            >
              Create full product article
            </button>
          </div>
        ) : (
          <InlineProductArticleEditor
            productId={productId}
            initialTitle={initialTitle}
            initialSlug={initialSlug}
            initialArticleEn={initialArticleEn}
            initialArticlePtBr={initialArticlePtBr}
            onHiddenChange={setEditorHidden}
            externalHidden={editorHidden}
          />
        )}
      </div>

      {/* Floating Editor Button - Apple Style */}
      {open && editorHidden && (
        <button
          onClick={handleOpenEditor}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open article editor"
        >
          {/* Bubble container with backdrop blur */}
          <div className="relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Main bubble */}
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/5 dark:shadow-black/20 group-hover:scale-110 group-active:scale-95 transition-all duration-200">
              {/* Icon */}
              <svg 
                className="w-6 h-6 text-foreground/70 group-hover:text-foreground transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                />
              </svg>
              
              {/* Active indicator dot */}
              <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-background animate-pulse" />
            </div>
          </div>
        </button>
      )}
    </>
  );
}
