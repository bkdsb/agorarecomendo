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
import { useEffect, useState } from "react";
import { GlobalDragHandle, type JSONContent as JSONContentType } from "novel";
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

const extensions = [...defaultExtensions, slashCommand];

interface NovelEditorProps {
  initialContent?: JSONContent | null;
  onChange: (html: string) => void;
  onJSONChange?: (json: JSONContentType) => void;
  onEditorReady?: (editor: EditorInstance) => void;
  placeholder?: string;
  saveStatus?: "Saved" | "Unsaved" | "Saving" | "Error";
  actionArea?: React.ReactNode;
  /** Conteúdo para o topo esquerdo do editor (ex.: badge de idioma) */
  leftOverlay?: React.ReactNode;
  /** Mostrar o GlobalDragHandle (gutter). Desative para layouts estreitos/embutidos */
  showDragHandle?: boolean;
}

export default function NovelEditor({
  initialContent,
  onChange,
  onJSONChange,
  onEditorReady,
  placeholder = "Press '/' for commands",
  saveStatus: controlledSaveStatus,
  actionArea,
  leftOverlay,
  showDragHandle = true,
}: NovelEditorProps) {
  const { t, locale } = useLanguage() as { t: (k: string) => string; locale: string };
  const [internalSaveStatus, setInternalSaveStatus] = useState<
    "Saved" | "Unsaved" | "Saving" | "Error"
  >("Saved");
  const saveStatus = controlledSaveStatus ?? internalSaveStatus;
  const [charsCount, setCharsCount] = useState<number>();

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  // Garantir que não restem handles antigos ao alternar entre instâncias
  // (inline <-> fullscreen). Remove quaisquer .drag-handle existentes antes
  // de o plugin montar o novo.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showDragHandle) {
      try {
        document.querySelectorAll('.drag-handle')?.forEach((el) => el.remove());
      } catch {}
    }
  }, [showDragHandle]);

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
    try {
      onJSONChange?.(json as JSONContentType);
    } catch {}
  }, 500);

  const formatWords = (n?: number) => {
    if (!n && n !== 0) return "";
    const num = new Intl.NumberFormat().format(n);
    const label = locale === 'pt-BR' ? 'palavras' : 'words';
    return `${num} ${label}`;
  };

  // Badge styles for save status (Apple-like)
  const statusDotClass =
    saveStatus === "Saved"
      ? "bg-emerald-500"
      : saveStatus === "Saving" || saveStatus === "Unsaved"
        ? "bg-amber-500"
        : saveStatus === "Error"
          ? "bg-red-500"
          : "bg-muted-foreground";
  const statusLabel = (() => {
    if (locale === 'pt-BR') {
      switch (saveStatus) {
        case 'Saved':
          return 'Salvo';
        case 'Saving':
          return 'Salvando';
        case 'Unsaved':
          return 'Não salvo';
        case 'Error':
          return 'Erro';
        default:
          return saveStatus ?? '';
      }
    }
    return saveStatus;
  })();

  const StatusBadge = (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
      <span>{statusLabel}</span>
    </div>
  );
  const WordsBadge = typeof charsCount === "number" && (
    <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
      {formatWords(charsCount)}
    </div>
  );

  // Ajusta extensões com base na exibição do drag handle
  const computedExtensions = showDragHandle
    ? extensions
    : (extensions.filter((ext) => ext !== (GlobalDragHandle as any)) as any);

  return (
    <div className="relative w-full max-w-screen-lg">
      <div className="flex absolute right-4 top-4 z-10 gap-1.5">
        {StatusBadge}
        {WordsBadge}
        {actionArea}
      </div>
      {leftOverlay && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          {leftOverlay}
        </div>
      )}
      <EditorRoot>
        <EditorContent
          initialContent={initialContent ?? undefined}
          extensions={computedExtensions}
          className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background sm:mb-10 sm:rounded-lg sm:border sm:shadow-lg"
          onCreate={({ editor }) => {
            try { onEditorReady?.(editor); } catch {}
          }}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
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
