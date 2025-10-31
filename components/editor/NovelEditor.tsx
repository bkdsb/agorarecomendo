"use client";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/ColorSelector";
import { LinkSelector } from "./selectors/LinkSelector";
import { MathSelector } from "./selectors/MathSelector";
import { NodeSelector } from "./selectors/NodeSelector";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/LanguageProvider";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/TextButtons";
import { slashCommand, suggestionItems } from "./slash-command";

const hljs = require("highlight.js");

// Merge extensions with slashCommand
const extensions = [...defaultExtensions, slashCommand];

interface NovelEditorProps {
  initialContent?: JSONContent | null;
  onChange: (html: string) => void;
  placeholder?: string;
  saveStatus?: "Saved" | "Unsaved" | "Saving" | "Error";
  actionArea?: React.ReactNode;
  /** Conteúdo para o topo esquerdo do editor (ex.: badge de idioma) */
  leftOverlay?: React.ReactNode;
}

export default function NovelEditor({
  initialContent,
  onChange,
  placeholder = "Press '/' for commands",
  saveStatus: controlledSaveStatus,
  actionArea,
  leftOverlay,
}: NovelEditorProps) {
  const { t, locale } = useLanguage() as { t: (k: string) => string; locale: string };
  const [internalSaveStatus, setInternalSaveStatus] = useState<
    "Saved" | "Unsaved" | "Saving" | "Error"
  >("Saved");
  const saveStatus = controlledSaveStatus ?? internalSaveStatus;
  const [charsCount, setCharsCount] = useState<number>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    const html = highlightCodeblocks(editor.getHTML());
    onChange(html);
  }, 500);

  const formatWords = (n?: number) => {
    if (!n && n !== 0) return "";
    const num = new Intl.NumberFormat().format(n);
    const label = locale === 'pt-BR' ? 'palavras' : 'words';
    return `${num} ${label}`;
  };

  // Keep global drag handle aligned with editor gutter via CSS var
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 36px: approximate gutter offset from content to handle
      const left = Math.max(12, rect.left - 36);
      document.documentElement.style.setProperty('--drag-handle-left', `${Math.round(left)}px`);
    };
    update();
    window.addEventListener('resize', update);
    // Some layouts reflow on sidebar toggle/route changes
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-screen-lg">
      {/* Topo esquerdo (ex.: bandeira/idioma) */}
      {leftOverlay && (
        <div className="absolute left-5 top-5 z-10 flex items-center gap-2.5">
          {leftOverlay}
        </div>
      )}
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2.5">
        {/* Words badge */}
        {typeof charsCount === "number" && (
          <div className="rounded-full bg-background/80 px-3 py-1.5 text-xs text-foreground/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-xl border border-black/5 dark:border-white/10 supports-[backdrop-filter]:bg-background/60 font-medium">
            {formatWords(charsCount)}
          </div>
        )}
        {actionArea}
        {/* Save badge - agora na última posição */}
        <div
          className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-xl border border-black/5 dark:border-white/10 supports-[backdrop-filter]:bg-background/60"
          role="status"
          aria-live="polite"
        >
          <span
            className={
              saveStatus === "Saved"
                ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                : saveStatus === "Saving"
                ? "h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                : saveStatus === "Error"
                ? "h-1.5 w-1.5 rounded-full bg-rose-500"
                : "h-1.5 w-1.5 rounded-full bg-amber-500"
            }
          />
          <span className="tracking-wide select-none font-medium">
            {saveStatus === 'Saved'
              ? (t('common.saved') || 'Saved')
              : saveStatus === 'Saving'
              ? (t('common.saving') || 'Saving…')
              : saveStatus === 'Error'
              ? (t('common.saveFailed') || 'Save failed')
              : (t('common.unsaved') || 'Unsaved')}
          </span>
        </div>
      </div>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent ?? undefined}
          extensions={extensions as any}
          className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_30px_rgba(0,0,0,0.06)]"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                // Tipografia mais compacta e consistente no editor
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full prose-p:my-3 prose-p:leading-relaxed prose-headings:leading-tight prose-headings:mt-8 prose-headings:mb-3",
              // Garantimos que o texto do placeholder esteja disponível via atributo
              // para seletores CSS que usam attr(data-placeholder).
              'data-placeholder': placeholder,
            },
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
            if (!controlledSaveStatus) {
              setInternalSaveStatus("Unsaved");
            }
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">{t('editor.noResults') || 'No results'}</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command!(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
