'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, ImagePlus, ChevronDown } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ProductCard from '../../../../../components/ProductCard';
import ReviewsManager from '../../../../../components/ReviewsManager';
import ReviewsCarousel from '../../../../../components/ReviewsCarousel';
import ReviewsMarquee from '../../../../../components/ReviewsMarquee';
// TipTap (Editor Completo integrado na página de edição)
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import ImageExt from '@tiptap/extension-image';
import type { Editor } from '@tiptap/core';
import { useToast } from '@/components/ToastProvider';

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const lastClickPos = useRef<{x:number;y:number}|null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    article: '',
    imageUrl: '',
    categoryId: '',
    tags: '',
    links: [{ url: '', title: '' }],
  });
  const [savingArticle, setSavingArticle] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Modos de edição: visual (TipTap), markdown e html
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown' | 'html'>('visual');
  const [markdownText, setMarkdownText] = useState('');
  const [htmlText, setHtmlText] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const isInitialLoad = useRef(true);
  const [reviews, setReviews] = useState<any[]>([]);
  // Configuração de exibição de reviews (salva em scrapedQnA)
  const [reviewsDisplay, setReviewsDisplay] = useState<{ mode: 'minimal' | 'grid' | 'summary' | 'hidden' | 'single-slide' | 'single-fade' | 'marquee'; max: number; order: 'recent' | 'rating'; showStars: boolean }>({ mode: 'minimal', max: 6, order: 'recent', showStars: false });
  const reviewsCfgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Estado de edição de links (acordeão + autosave)
  const [expandedLink, setExpandedLink] = useState<number | null>(null);
  const [savingLinks, setSavingLinks] = useState(false);
  const [lastSavedLinksAt, setLastSavedLinksAt] = useState<Date | null>(null);
  // Tags (chips) + input atual
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const suggestions = Array.from(new Set((formData.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4)
  )).slice(0, 3);

  // Controle de preview/recorte
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('contain');
  const [posX, setPosX] = useState(50); // 0-100
  const [posY, setPosY] = useState(50);
  const [imageScale, setImageScale] = useState(1);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<{x:number; y:number}>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const onCropComplete = (_: any, cropped: any) => {
    setCroppedAreaPixels(cropped);
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const openCropWithUrl = (url: string) => {
    if (!url) return;
    setCropImageSrc(url);
    setIsCropOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const openCropWithFile = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setCropImageSrc(dataUrl);
    setIsCropOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  // Gera imagem recortada a partir de croppedAreaPixels
  const getCroppedBlob = async (imageSrc: string, cropPixels: {x:number;y:number;width:number;height:number}) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    await new Promise((res, rej) => { img.onload = () => res(null as any); img.onerror = rej; });
    const canvas = document.createElement('canvas');
    // Exportar quadrado
    const outSize = 800;
    canvas.width = outSize; canvas.height = outSize;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, outSize, outSize);
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b)=>resolve(b as Blob), 'image/jpeg', 0.9)!);
    return blob;
  };

  const confirmCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      const data = new FormData();
      data.append('file', new File([blob], 'crop.jpg', { type: 'image/jpeg' }));
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      if (res.ok) {
        const json = await res.json();
        setFormData({ ...formData, imageUrl: json.url });
        setIsCropOpen(false);
      }
    } catch (e) {
      console.error('Falha ao recortar:', e);
    }
  };

  // Função para aplicar recorte simples (gera uma imagem quadrada via canvas)
  const applyCrop = async () => {
    if (!formData.imageUrl) return;
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = formData.imageUrl;
      await new Promise((res, rej) => {
        img.onload = () => res(null);
        img.onerror = rej;
      });
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const centerX = (posX / 100) * iw;
      const centerY = (posY / 100) * ih;
      const cropSide = Math.floor(Math.min(iw, ih) / Math.max(1, imageScale));
      const sx = Math.max(0, Math.min(iw - cropSide, Math.floor(centerX - cropSide / 2)));
      const sy = Math.max(0, Math.min(ih - cropSide, Math.floor(centerY - cropSide / 2)));
      const out = document.createElement('canvas');
      const outSize = 800; // tamanho padrão
      out.width = outSize; out.height = outSize;
      const ctx = out.getContext('2d')!;
      ctx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, outSize, outSize);
      const blob: Blob = await new Promise((resolve) => out.toBlob((b)=>resolve(b as Blob), 'image/jpeg', 0.9)!);
      const data = new FormData();
      data.append('file', new File([blob], 'crop.jpg', { type: 'image/jpeg' }));
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      if (res.ok) {
        const json = await res.json();
        setFormData({ ...formData, imageUrl: json.url });
      }
    } catch (e) {
      console.error('Falha ao recortar:', e);
    }
  };

  // Carregar categorias
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setError('Erro ao carregar categorias'));
  }, []);

  // Carregar dados do produto
  useEffect(() => {
    if (params.id !== 'novo') {
      fetch(`/api/products/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setFormData({
            ...data,
            slug: data.slug || '',
            categoryId: data.categoryId || '',
            tags: data.tags || '',
            links: (data.links && data.links.length > 0)
              ? data.links.map((l: any) => {
                  let storeLabel = l.store || '';
                  let productTitle = '';
                  try {
                    const j = JSON.parse(l.store || '{}');
                    if (j && typeof j === 'object') {
                      storeLabel = j.store || storeLabel;
                      productTitle = j.title || '';
                    }
                  } catch {}
                  return { url: l.url, title: storeLabel, locale: l.locale || 'pt-br', productTitle } as any;
                })
              : [{ url: '', title: '' }],
            article: data.article || '',
          });
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
          // Carrega configuração de exibição de reviews a partir de scrapedQnA
          try {
            const cfg = data.scrapedQnA ? JSON.parse(data.scrapedQnA) : {};
            const rd = cfg?.reviewsDisplay || {};
            setReviewsDisplay({
              mode: (rd.mode as any) || 'minimal',
              max: typeof rd.max === 'number' ? rd.max : 6,
              order: rd.order === 'rating' ? 'rating' : 'recent',
              showStars: !!rd.showStars,
            });
          } catch {}
          // Inicializa lista de tags
          const initialTags = (data.tags || '')
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);
          setTagsList(initialTags);
          setIsLoading(false);
        })
        .catch(() => {
          setError('Erro ao carregar produto');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [params.id]);

  // Editor TipTap (conteúdo rico integrado)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1,2,3,4,5,6] }),
      Link.configure({ openOnClick: true, autolink: true, protocols: ['http', 'https', 'mailto'] }),
      ImageExt.configure({ allowBase64: true, inline: false }),
      Placeholder.configure({ placeholder: 'Escreva seu artigo aqui…' }),
    ],
    content: '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      // Atualiza estado local (para refletir no submit completo) e autosave
      const html = editor.getHTML();
      setFormData((fd) => ({ ...fd, article: html }));
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        try {
          setSavingArticle(true);
          await fetch(`/api/products/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article: html }),
          });
          setLastSavedAt(new Date());
        } catch (e) {
          console.error('Autosave (artigo) falhou', e);
        } finally {
          setSavingArticle(false);
        }
      }, 1000);
    },
  });

  // Carrega conteúdo no editor quando o produto chega
  useEffect(() => {
    if (editor && formData.article !== undefined) {
      editor.commands.setContent(formData.article || '<p><br /></p>');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isLoading]);

  // Sincroniza conteúdo ao alternar modos
  useEffect(() => {
    if (!formData.article) return;
    if (editorMode === 'markdown') {
      // Converte HTML atual para Markdown
      import('turndown').then(({ default: TurndownService }) => {
        const td = new TurndownService();
        setMarkdownText(td.turndown(formData.article || ''));
      }).catch(()=>{});
    } else if (editorMode === 'html') {
      setHtmlText(formData.article || '');
    } else if (editorMode === 'visual' && editor) {
      editor.commands.setContent(formData.article || '<p><br /></p>');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);

  // Autosave para Markdown (converte para HTML e salva)
  const mdAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (editorMode !== 'markdown') return;
    if (mdAutosaveRef.current) clearTimeout(mdAutosaveRef.current);
    mdAutosaveRef.current = setTimeout(async () => {
      try {
        const { marked } = await import('marked');
        const html = marked.parse(markdownText || '') as string;
        setFormData((fd) => ({ ...fd, article: html }));
        setSavingArticle(true);
        await fetch(`/api/products/${params.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article: html }),
        });
        setLastSavedAt(new Date());
      } catch (e) {
        console.error('Autosave (markdown) falhou', e);
      } finally {
        setSavingArticle(false);
      }
    }, 800);
    return () => { if (mdAutosaveRef.current) clearTimeout(mdAutosaveRef.current); };
  }, [markdownText, editorMode]);

  // Autosave para HTML bruto
  const htmlAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (editorMode !== 'html') return;
    if (htmlAutosaveRef.current) clearTimeout(htmlAutosaveRef.current);
    htmlAutosaveRef.current = setTimeout(async () => {
      try {
        const html = htmlText || '';
        setFormData((fd) => ({ ...fd, article: html }));
        setSavingArticle(true);
        await fetch(`/api/products/${params.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article: html }),
        });
        setLastSavedAt(new Date());
      } catch (e) {
        console.error('Autosave (html) falhou', e);
      } finally {
        setSavingArticle(false);
      }
    }, 800);
    return () => { if (htmlAutosaveRef.current) clearTimeout(htmlAutosaveRef.current); };
  }, [htmlText, editorMode]);

  // Atalho Cmd/Ctrl+S para salvar artigo explicitamente
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const html = editor?.getHTML() || '';
        fetch(`/api/products/${params.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article: html }),
        }).then(() => setLastSavedAt(new Date()));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, params.id]);

  // Adicionar novo link
  const addLink = () => {
    const next = [...formData.links, { url: '', title: '' } as any];
    setFormData({ ...formData, links: next });
    setExpandedLink(next.length - 1);
  };

  // Remover link
  const removeLink = (index: number) => {
    const newLinks = [...formData.links];
    newLinks.splice(index, 1);
    setFormData({
      ...formData,
      links: newLinks.length > 0 ? newLinks : [{ url: '', title: '' }],
    });
  };

  // Atualizar link
  const updateLink = (index: number, field: 'url' | 'title' | 'locale' | 'productTitle', value: string) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value } as any;
    setFormData({
      ...formData,
      links: newLinks,
    });
  };

  // Salvar produto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = params.id === 'novo' 
        ? '/api/products'
        : `/api/products/${params.id}`;
      
      const method = params.id === 'novo' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Sempre envia a versão atual como chips normalizados
          tags: tagsList.join(', '),
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar produto');

      if (method === 'POST') {
        const created = await res.json();
        if (created?.id) {
          // Enfileira toast para a próxima rota e vai para a edição
          toast.next({ type: 'success', title: 'Produto criado', placement: 'bottom-center' });
          router.replace(`/admin-secret-xyz/produtos/${created.id}/editar`);
          return;
        }
      }
      // Em PATCH, permanecer na página e liberar o botão
      toast.success('Alterações salvas', undefined, { anchor: lastClickPos.current ?? undefined });
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao salvar produto');
      toast.error('Erro ao salvar', undefined, { anchor: lastClickPos.current ?? undefined });
      setIsLoading(false);
    }
  };

  // Excluir produto (com toast de confirmação)
  const handleDeleteProduct = async (e?: React.MouseEvent) => {
    const clickPos = e ? { x: e.clientX, y: e.clientY } : undefined;
    const ok = await toast.confirm({
      title: 'Excluir produto?',
      description: 'Essa ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      placement: 'center',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      toast.next({ type: 'success', title: 'Produto excluído', placement: 'bottom-center' });
      router.refresh();
      router.push('/admin-secret-xyz/produtos');
    } catch (e) {
      toast.error('Erro ao excluir produto', undefined, { anchor: clickPos });
    }
  };

  // Autosave de links (debounced) - envia apenas o campo 'links' para evitar sobrescritas
  useEffect(() => {
    if (isLoading) return;
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    const timer = setTimeout(async () => {
      try {
        setSavingLinks(true);
        const url = `/api/products/${params.id}`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: formData.links }),
        });
        setLastSavedLinksAt(new Date());
      } catch (e) {
        console.error('Autosave (links) falhou', e);
      } finally {
        setSavingLinks(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.links]);

  // Autosave de reviews (debounced) — substitui completamente as reviews
  useEffect(() => {
    if (isLoading) return;
    if (params.id === 'novo') return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/products/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviews }),
        });
      } catch (e) {
        console.error('Autosave (reviews) falhou', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [reviews]);

  // Autosave da configuração de exibição de reviews (debounced)
  useEffect(() => {
    if (isLoading) return;
    if (params.id === 'novo') return;
    if (reviewsCfgTimer.current) clearTimeout(reviewsCfgTimer.current);
    reviewsCfgTimer.current = setTimeout(async () => {
      try {
        // Merge em scrapedQnA existente
        let current: any = {};
        try { current = (formData as any).scrapedQnA ? JSON.parse((formData as any).scrapedQnA as any) : {}; } catch {}
        const merged = { ...current, reviewsDisplay };
        const payload = JSON.stringify(merged);
        setFormData((fd) => ({ ...fd, scrapedQnA: payload } as any));
        await fetch(`/api/products/${params.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scrapedQnA: payload }),
        });
      } catch (e) {
        console.error('Falha ao salvar configuração de reviews', e);
      }
    }, 600);
    return () => { if (reviewsCfgTimer.current) clearTimeout(reviewsCfgTimer.current); };
  }, [reviewsDisplay]);

  // Helpers de tags
  const commitTag = (raw: string) => {
    const t = raw.trim().replace(/^,+|,+$/g, '');
    if (!t) return;
    if (tagsList.includes(t)) { setTagsInput(''); return; }
    setTagsList((prev) => [...prev, t]);
    setTagsInput('');
  };

  const removeTag = (tag: string) => {
    setTagsList((prev) => prev.filter((t) => t !== tag));
  };

  // Autosave de tags (somente para itens existentes)
  useEffect(() => {
    if (isLoading) return;
    if (params.id === 'novo') return;
    // Mantém string de tags em sincronia
    setFormData((fd) => ({ ...fd, tags: tagsList.join(', ') }));
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/products/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: tagsList.join(', ') }),
        });
      } catch (e) {
        console.error('Autosave (tags) falhou', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [tagsList]);

  // Commit automático da tag digitada ao parar de digitar
  useEffect(() => {
    if (!tagsInput.trim()) return;
    const t = setTimeout(() => {
      commitTag(tagsInput);
    }, 1000);
    return () => clearTimeout(t);
  }, [tagsInput]);

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        {params.id === 'novo' ? 'Novo Produto' : 'Editar Produto'}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 lg:col-span-2">
        {/* Título */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-1 text-foreground">Título</label>
          <div className="text-xs text-foreground/60 mb-2 break-words">Título atual: {formData.title || '—'}</div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 rounded-md bg-background border border-border text-foreground"
            required
          />
        </div>

        {/* Resumo */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">Resumo</label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full p-2 rounded-md bg-background border border-border text-foreground"
            rows={3}
            required
          />
        </div>

        {/* Artigo Completo: modos Visual / Markdown / HTML */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">Artigo Completo</label>
            <div className="text-xs text-foreground/60">
              {savingArticle ? 'Salvando…' : lastSavedAt ? `Auto-salvo às ${lastSavedAt.toLocaleTimeString()}` : '—'}
            </div>
          </div>
          <div className="rounded-md p-3 bg-card text-foreground border border-border">
            {/* Abas de modo */}
            <div className="mb-2 inline-flex rounded-md border border-border overflow-hidden">
              {(['visual','markdown','html'] as const).map((m)=> (
                <button key={m} type="button" onClick={()=>setEditorMode(m)}
                  className={`px-3 py-1.5 text-sm border-r border-border last:border-r-0 ${editorMode===m? 'bg-foreground text-background' : 'bg-card hover:bg-card/80 text-foreground/80'}`}
                >
                  {m === 'visual' ? 'Editor' : m === 'markdown' ? 'Markdown' : 'HTML'}
                </button>
              ))}
            </div>

            {editorMode === 'visual' && editor && (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('bold') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('italic') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('strike') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
                  <span className="mx-1 text-muted-foreground">|</span>
                  {[1,2,3,4,5,6].map((lvl)=> (
                    <button key={lvl} type="button" title={`H${lvl}`} className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('heading',{level:lvl as any}) ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleHeading({ level: lvl as any }).run()}>H{lvl}</button>
                  ))}
                  <span className="mx-1 text-muted-foreground">|</span>
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('bulletList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('orderedList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
                  <button type="button" className={`px-2.5 py-1.5 text-sm rounded border ${editor.isActive('blockquote') ? 'bg-blue-600 text-white border-blue-600' : 'bg-card hover:bg-blue-500/10 border-border'}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>“”</button>
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-blue-500/10 border-border" onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</button>
                  <span className="mx-1 text-muted-foreground">|</span>
                  {/* Link */}
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-muted" onClick={() => {
                    const url = prompt('URL do link:');
                    if (!url) return;
                    editor.chain().focus().setLink({ href: url }).run();
                  }}>Link</button>
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-muted" onClick={() => editor.chain().focus().unsetLink().run()}>Remover Link</button>
                  {/* Imagem */}
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-muted" onClick={() => {
                    const url = prompt('URL da imagem:');
                    if (!url) return;
                    editor.chain().focus().setImage({ src: url }).run();
                  }}>Imagem</button>
                  <span className="mx-1 text-muted-foreground">|</span>
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-muted" onClick={() => editor.chain().focus().undo().run()}>↶</button>
                  <button type="button" className="px-2.5 py-1.5 text-sm rounded border bg-card hover:bg-muted" onClick={() => editor.chain().focus().redo().run()}>↷</button>
                </div>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground">
                  <EditorContent editor={editor} className="focus:outline-none min-h-[420px] mt-2" />
                </div>
              </>
            )}

            {editorMode === 'markdown' && (
              <textarea
                className="w-full min-h-[420px] text-sm p-3 bg-background rounded-md border border-border text-foreground"
                value={markdownText}
                onChange={(e)=> setMarkdownText(e.target.value)}
                placeholder="Escreva em Markdown..."
              />
            )}

            {editorMode === 'html' && (
              <textarea
                className="w-full min-h-[420px] text-sm p-3 bg-background rounded-md border border-border font-mono text-foreground"
                value={htmlText}
                onChange={(e)=> setHtmlText(e.target.value)}
                placeholder="Edite o HTML bruto..."
              />
            )}
          </div>
        </div>

        {/* (Removido) Controles antigos de imagem — agora ficam dentro do Preview Card */}

        {/* Categoria */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">Categoria</label>
          <div className="flex gap-2">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full p-2 rounded-md bg-background border border-border text-foreground"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {/* Sugestões rápidas com base no título */}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewCategory(s.charAt(0).toUpperCase() + s.slice(1))}
                  className="px-2 py-1 text-xs rounded-full border border-border text-foreground/80 hover:bg-card/60"
                >
                  Sugerir: {s}
                </button>
              ))}
            </div>
          )}
          {/* Criar nova categoria inline */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria"
              className="flex-1 p-2 rounded-md bg-background border border-border text-foreground"
            />
            <button
              type="button"
              disabled={creatingCategory || !newCategory.trim()}
              onClick={async () => {
                try {
                  setCreatingCategory(true);
                  const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCategory.trim() }),
                  });
                  if (!res.ok) throw new Error('Erro ao criar categoria');
                  const created = await res.json();
                  setCategories((prev) => [...prev, created]);
                  setFormData((fd) => ({ ...fd, categoryId: created.id }));
                  setNewCategory('');
                } catch (e) {
                  setError('Não foi possível criar a categoria');
                } finally {
                  setCreatingCategory(false);
                }
              }}
              className="px-3 py-2 rounded-md bg-foreground text-background disabled:opacity-50"
            >
              {creatingCategory ? 'Criando...' : 'Criar e Selecionar'}
            </button>
          </div>
        </div>

        {/* Tags internas (chips com azul Apple-like, vírgula/Enter para adicionar, autosave) */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">Tags internas</label>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2">
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white text-xs font-medium px-3 py-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-white/20 w-4 h-4 leading-none flex items-center justify-center"
                  aria-label={`Remover tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitTag(tagsInput); }
                if (e.key === ',') { e.preventDefault(); commitTag(tagsInput); }
              }}
              onBlur={() => { if (tagsInput.trim()) commitTag(tagsInput); }}
              placeholder={tagsList.length === 0 ? 'ex.: barato, portátil, silencioso' : 'Digite e use vírgula para adicionar'}
              className="flex-1 min-w-[140px] p-1.5 bg-transparent focus:outline-none text-sm text-foreground placeholder:text-foreground/50"
            />
          </div>
          <p className="mt-1 text-xs text-foreground/60">Usadas apenas para relacionar produtos semelhantes. Não serão exibidas no site.</p>
        </div>

        {/* Configuração de Exibição das Avaliações (Admin) */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="block text-sm font-medium text-foreground">Exibição das Avaliações (Público)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-foreground/70 mb-1">Layout</label>
              <select
                className="w-full p-2 rounded-md bg-background border border-border text-sm text-foreground"
                value={reviewsDisplay.mode}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, mode: e.target.value as any }))}
              >
                <option value="minimal">Cartões minimalistas (atual)</option>
                <option value="grid">Grade (2 colunas)</option>
                <option value="single-slide">Cartão único (slide automático)</option>
                <option value="single-fade">Cartão único (fade in/out)</option>
                <option value="marquee">Cartões em fila (loop contínuo)</option>
                <option value="summary">Somente resumo (média e contagem)</option>
                <option value="hidden">Ocultar</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-foreground/70 mb-1">Máximo de avaliações</label>
              <input type="number" min={1} max={12} value={reviewsDisplay.max}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, max: Math.max(1, Math.min(12, Number(e.target.value)||0)) }))}
                className="w-full p-2 rounded-md bg-background border border-border text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-foreground/70 mb-1">Ordem</label>
              <select
                className="w-full p-2 rounded-md bg-background border border-border text-sm text-foreground"
                value={reviewsDisplay.order}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, order: e.target.value as any }))}
              >
                <option value="recent">Mais recentes</option>
                <option value="rating">Maior nota</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input id="cfg-stars" type="checkbox" checked={reviewsDisplay.showStars} onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, showStars: e.target.checked }))} />
              <label htmlFor="cfg-stars" className="text-sm text-foreground">Mostrar estrelas no público</label>
            </div>
          </div>

          {/* Amostra (preview público) */}
          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="text-xs text-foreground/60 mb-2">Amostra de como aparecerá no site</div>
            <div className="mx-auto max-w-2xl">
              {(function(){
                const list = [...reviews];
                if (reviewsDisplay.order === 'rating') list.sort((a:any,b:any)=> (b.rating||0)-(a.rating||0));
                else list.sort((a:any,b:any)=> (new Date(b.createdAt||0).getTime()) - (new Date(a.createdAt||0).getTime()));
                const lim = list.slice(0, reviewsDisplay.max);
                if (reviewsDisplay.mode === 'hidden') return <div className="text-sm text-foreground/50">Oculto</div>;
                if (reviewsDisplay.mode === 'summary') {
                  const avg = lim.length? (lim.reduce((s:any,r:any)=> s + (Number(r.rating)||0), 0)/lim.length).toFixed(1): '0.0';
                  return (
                    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 text-center">
                      <div className="text-sm text-foreground/70">Média das avaliações</div>
                      <div className="text-3xl font-bold text-foreground mt-1">{avg} {reviewsDisplay.showStars ? '⭐' : ''}</div>
                      <div className="text-xs text-foreground/60 mt-1">{reviews.length} avaliações</div>
                    </div>
                  );
                }
                if (reviewsDisplay.mode === 'single-slide' || reviewsDisplay.mode === 'single-fade') {
                  return (
                    <div className="py-1">
                      <ReviewsCarousel reviews={lim as any} showStars={reviewsDisplay.showStars} variant={reviewsDisplay.mode === 'single-fade' ? 'fade' : 'slide'} />
                    </div>
                  );
                }
                if (reviewsDisplay.mode === 'marquee') {
                  return (
                    <div className="py-1">
                      <ReviewsMarquee reviews={lim as any} showStars={reviewsDisplay.showStars} />
                    </div>
                  );
                }
                const grid = reviewsDisplay.mode === 'grid';
                return (
                  <div className={grid ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
                    {lim.map((r:any, idx:number)=> (
                      <div key={r.id || idx} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 text-center">
                        <div className="text-sm font-medium text-foreground">{r.author || 'Usuário'}</div>
                        <div className="mt-1 text-xs text-foreground/70">{Number(r.rating||0).toFixed(1)} / 5.0 {reviewsDisplay.showStars ? '⭐'.repeat(Math.round(Number(r.rating||0))) : ''}</div>
                        <p className="mt-3 text-foreground/80 line-clamp-4">“{r.content}”</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Links (Acordeão minimalista, autosave e badge de loja) */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="block text-sm font-medium text-foreground">Affiliate Links</span>
            <div className="text-xs text-foreground/60">
              {savingLinks ? 'Saving…' : lastSavedLinksAt ? 'Auto-saved' : '—'}
            </div>
          </div>
          <div className="space-y-3">
            {formData.links.map((link, index) => {
              const locale = (link as any).locale || ((link as any).title === 'Amazon US' ? 'en-us' : (link as any).title ? 'pt-br' : undefined);
              const badge = locale === 'en-us' ? 'Amazon US' : locale === 'pt-br' ? 'Amazon BR' : '—';
              const headerTitle = (link as any).productTitle?.trim() || (link.url ? new URL(link.url).hostname : 'Untitled link');
              const isOpen = expandedLink === index;
              return (
                <div key={index} className="rounded-lg border border-border bg-background/60">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <button
                      type="button"
                      className={`mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      onClick={()=> setExpandedLink(isOpen ? null : index)}
                      aria-label="Expandir"
                    >
                      <ChevronDown className="w-4 h-4 text-foreground/70" />
                    </button>
                    <button type="button" className="flex-1 min-w-0 text-left" onClick={()=> setExpandedLink(isOpen ? null : index)}>
                      <div className="truncate text-sm font-medium text-foreground">{headerTitle}</div>
                    </button>
                    <button type="button" onClick={()=> setExpandedLink(isOpen ? null : index)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.includes('US') ? 'border-blue-400/40 text-blue-700 bg-blue-500/10' : badge.includes('BR') ? 'border-emerald-400/40 text-emerald-700 bg-emerald-500/10' : 'border-border text-foreground/60'}`}>{badge}</button>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-500/10 rounded-md"
                      aria-label="Remover link"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/50">
                      <label className="block text-[11px] font-medium text-foreground/70 mb-1">Title</label>
                      <input
                        type="text"
                        value={(link as any).productTitle ?? ''}
                        onChange={(e) => updateLink(index, 'productTitle', e.target.value)}
                        placeholder="Link title"
                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
                      />
                      <div className="grid grid-cols-12 gap-3 mt-3 items-center">
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[11px] font-medium text-foreground/70 mb-1">Store</label>
                          <select
                            className="w-full p-2 rounded-md bg-background border border-border text-sm text-foreground"
                            value={(link as any).title || ''}
                            onChange={(e)=>{
                              const val = e.target.value;
                              const locale = val === 'Amazon US' ? 'en-us' : 'pt-br';
                              const newLinks = [...formData.links];
                              newLinks[index] = { ...(newLinks[index] as any), title: val, locale };
                              setFormData({ ...formData, links: newLinks });
                            }}
                          >
                            <option value="">Select</option>
                            <option value="Amazon BR">Amazon BR</option>
                            <option value="Amazon US">Amazon US</option>
                          </select>
                        </div>
                        <div className="col-span-12 sm:col-span-9">
                          <label className="block text-[11px] font-medium text-foreground/70 mb-1">URL</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full p-2 rounded-md bg-background border border-border text-foreground"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={addLink}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Add Link
            </button>
          </div>
        </div>

          {/* Botões */}
          <div className="flex gap-4 bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
            <button
              type="submit"
              disabled={isLoading}
              onClick={(e)=>{ lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md bg-background border border-border text-foreground hover:bg-card/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
            >
              Cancelar
            </button>
            {params.id !== 'novo' && (
              <button
                type="button"
                onClick={(e)=>handleDeleteProduct(e)}
                className="ml-auto px-4 py-2 rounded-md border border-red-400/40 bg-red-500/10 text-red-600 hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                aria-label="Excluir produto"
              >
                Excluir produto
              </button>
            )}
          </div>
        </div>

        {/* Preview Card da Home (fidelidade) */}
        <div className="lg:col-span-1">
          <div className="mb-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-wide uppercase text-foreground">Preview</h2>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1 text-foreground/80">URL</label>
            <input
              type="url"
              placeholder="Adicione uma imagem via URL"
              className="w-full p-3 text-sm rounded-lg bg-background border border-border text-foreground"
              onKeyDown={(e:any)=>{ if(e.key==='Enter'){ e.preventDefault(); openCropWithUrl(e.currentTarget.value); } }}
            />
          </div>
          <div className="sticky top-24" id="imagem">
            <div
              className={`max-w-sm relative group ${isDraggingOver ? 'ring-2 ring-foreground ring-offset-2 rounded-2xl' : ''}`}
              onDragOver={(e)=>{ e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={()=>setIsDraggingOver(false)}
              onDrop={async (e)=>{ e.preventDefault(); setIsDraggingOver(false); const f = e.dataTransfer.files?.[0]; if(f) openCropWithFile(f); }}
            >
              {(() => {
                const imageUrl = formData.imageUrl || 'https://placehold.co/600x600/1C1C1E/F2F2F2?text=Produto';
                const categoryName = categories.find(c => c.id === formData.categoryId)?.name || 'Sem Categoria';
                const description = formData.summary || 'Sem resumo rápido.';
                const title = formData.title || 'Título do Produto';
                const affiliate = formData.links[0]?.url || '#';
                const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
                const articleLink = `/produto/${formData.slug || slugify(title)}`;
                const position = `${posX}% ${posY}%`;
                return (
                  <ProductCard
                    imageUrl={imageUrl}
                    title={title}
                    category={categoryName}
                    description={description}
                    articleLink={articleLink}
                    affiliateLink={affiliate}
                    imageFit={imageFit}
                    imagePosition={position}
                    imageScale={imageScale}
                  />
                );
              })()}
              {/* Overlay hint de DnD / Clique para enviar (somente na área da imagem) */}
              <div className="absolute inset-x-0 top-0 pointer-events-none group-hover:pointer-events-auto">
                <div className="relative w-full" style={{ paddingTop: '100%' }}>
                  <div
                    className="absolute inset-0 rounded-2xl border-2 border-dashed border-transparent group-hover:border-white/50 flex items-center justify-center text-center text-sm text-white drop-shadow-md bg-black/0 group-hover:bg-black/40 transition"
                    onClick={(e)=>{
                      const input = document.getElementById('editar-hidden-file') as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/30">
                      <ImagePlus className="w-5 h-5"/>
                      <span>Arraste, solte ou clique para enviar</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* input oculto para clique */}
              <input id="editar-hidden-file" type="file" accept="image/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(f) openCropWithFile(f); e.currentTarget.value=''; }} />
            </div>
          </div>

          {/* Modal de recorte */}
          {isCropOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl w-full max-w-xl p-4 border border-border">
                <h3 className="font-semibold mb-3 text-foreground">Ajuste a imagem</h3>
                <div className="relative w-full aspect-square bg-background rounded-md overflow-hidden">
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <label className="text-xs text-foreground/80">Zoom
                    <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="ml-2 align-middle" />
                  </label>
                  <div className="ml-auto flex gap-2">
                    <button type="button" className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground hover:bg-card/60" onClick={()=>setIsCropOpen(false)}>Cancelar</button>
                    <button type="button" className="px-3 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90" onClick={confirmCropAndUpload}>Aplicar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Reviews Manager abaixo do Preview */}
          <div className="mt-6 bg-card/70 backdrop-blur-md rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Avaliações</h3>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-md border border-border bg-background hover:bg-card/60"
                onClick={async () => {
                  try {
                    const primary = formData.links?.[0]?.url;
                    if (!primary) { toast.info('Nenhum link principal encontrado', undefined, { placement: 'bottom-center' }); return; }
                    const loadingId = toast.loading('Buscando avaliações…', undefined, { placement: 'center' });
                    const res = await fetch('/api/scrape/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: primary }) });
                    const data = await res.json();
                    toast.dismiss(loadingId);
                    if (res.ok && Array.isArray(data?.reviews)) {
                      const merged = [...reviews, ...data.reviews.map((r:any)=>({ ...r, isManual: false }))];
                      setReviews(merged);
                      toast.success(`${data.reviews.length} avaliações importadas`, undefined, { placement: 'bottom-center' });
                    } else {
                      toast.info('Não foi possível extrair avaliações', undefined, { placement: 'bottom-center' });
                    }
                  } catch (e) {
                    toast.error('Falha ao importar avaliações', undefined, { placement: 'bottom-center' });
                  }
                }}
              >
                Importar de link principal
              </button>
            </div>
            <ReviewsManager
              initialReviews={reviews}
              onReviewsChange={(r)=> setReviews(r)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}