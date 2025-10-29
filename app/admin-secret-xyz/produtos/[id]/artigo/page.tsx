"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";

type Product = {
  id: string;
  title: string;
  article: string | null;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const Btn = (
    props: React.PropsWithChildren<{ onClick: () => void; active?: boolean; title?: string }>
  ) => (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      className={
        `px-2.5 py-1.5 text-sm rounded border mr-1 mb-1 ` +
        (props.active ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50")
      }
    >
      {props.children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-y-1 mb-3">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
        B
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
        I
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Riscado">
        S
      </Btn>
      <span className="mx-1 text-gray-300">|</span>
      <Btn
        onClick={() => {
          const prev = editor.getAttributes('link').href as string | undefined;
          const url = window.prompt('URL do link', prev || 'https://');
          if (url === null) return;
          if (url.trim() === '') {
            editor.chain().focus().unsetLink().run();
          } else {
            editor.chain().focus().setLink({ href: url.trim() }).run();
          }
        }}
        active={editor.isActive('link')}
        title="Definir/Remover Link"
      >
        Link
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título H1">
        H1
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título H2">
        H2
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título H3">
        H3
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Título H4">
        H4
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} active={editor.isActive("heading", { level: 5 })} title="Título H5">
        H5
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} active={editor.isActive("heading", { level: 6 })} title="Título H6">
        H6
      </Btn>
      <span className="mx-1 text-gray-300">|</span>
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
        • List
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
        1. List
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">
        ❝
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha">
        ―
      </Btn>
      <Btn
        onClick={async () => {
          // Preferimos upload; se falhar, pedir URL manualmente
          try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              const data = new FormData();
              data.append('file', file);
              const res = await fetch('/api/upload', { method: 'POST', body: data });
              if (res.ok) {
                const json = await res.json();
                editor.chain().focus().setImage({ src: json.url }).run();
              } else {
                const url = window.prompt('URL da imagem', 'https://');
                if (url && url.trim().length > 0) {
                  editor.chain().focus().setImage({ src: url.trim() }).run();
                }
              }
            };
            input.click();
          } catch {
            const url = window.prompt('URL da imagem', 'https://');
            if (url && url.trim().length > 0) {
              editor.chain().focus().setImage({ src: url.trim() }).run();
            }
          }
        }}
        title="Inserir imagem"
      >
        Img
      </Btn>
      <span className="mx-1 text-gray-300">|</span>
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Desfazer">↶</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Refazer">↷</Btn>
    </div>
  );
}

export default function ArticleEditorPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const autosaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Removido: preview ao vivo e editor de reviews

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1,2,3,4,5,6] }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      ImageExt.configure({
        HTMLAttributes: {
          class: 'rounded-md',
          loading: 'lazy',
        },
      }),
      Placeholder.configure({
        placeholder: 'Escreva seu artigo aqui…',
      }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      setDirty(true);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        // autosave apenas se ainda estiver sujo
        if (editor && editor.isEditable) {
          handleSave();
        }
      }, 1500);
    },
  });

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
        editor?.commands.setContent(data.article || "<p>Comece seu artigo…</p>");
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

  const handleSave = React.useCallback(async () => {
    if (!editor) return;
    try {
      setSaving(true);
      const html = editor.getHTML();
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: html }),
      });
      if (!res.ok) throw new Error("Falha ao salvar artigo");
      setDirty(false);
      setLastSavedAt(new Date());
    } catch (e) {
      console.error(e);
      alert("Não foi possível salvar o artigo agora.");
    } finally {
      setSaving(false);
    }
  }, [editor, params.id]);

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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Edição Completa do Artigo</h1>
          {product && (
            <p className="text-sm text-muted-foreground">{product.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/admin-secret-xyz/produtos/${params.id}/editar`}
            className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            Voltar ao editor simples
          </a>
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              Auto-salvo às {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !editor}
            className="text-sm px-3 py-1.5 rounded-md bg-black text-white disabled:opacity-50"
          >
            {saving ? "Salvando…" : dirty ? "Salvar alterações" : "Salvar"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className={`grid gap-4 grid-cols-1`}>
          <div className="border rounded-md p-3 bg-card text-foreground">
            {editor && <Toolbar editor={editor} />}            
            <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground">
              <EditorContent
                editor={editor}
                className="focus:outline-none min-h-[480px] mt-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
