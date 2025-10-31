'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, ImagePlus, ChevronDown, Globe2, Code2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ProductCard from '../../../../../components/ProductCard';
import ReviewsManager from '../../../../../components/ReviewsManager';
import ReviewsCarousel from '../../../../../components/ReviewsCarousel';
import ReviewsMarquee from '../../../../../components/ReviewsMarquee';
import { useToast } from '@/components/ToastProvider';
import { useLanguage } from '@/components/LanguageProvider';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const InlineProductArticleEditor = dynamic(() => import('@/components/InlineProductArticleEditor'), { ssr: false });

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const lastClickPos = useRef<{x:number;y:number}|null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    titlePtBr: '',
    slug: '',
    summary: '',
    summaryPtBr: '',
    article: '',
    imageUrl: '',
    categoryId: '',
    tags: '',
    links: [{ url: '', title: '' }],
  });
  const [savingArticle, setSavingArticle] = useState(false);
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
  const [showEditor, setShowEditor] = useState(true);

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
      console.error('Failed to crop:', e);
    }
  };

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setError(t('editor.errorLoadingCategories') || 'Error loading categories'));
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
            titlePtBr: data.titlePtBr || '',
            summaryPtBr: data.summaryPtBr || '',
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
          setError(t('editor.errorLoadingProduct') || 'Error loading product');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [params.id]);
  // Keyboard shortcuts: Cmd+Shift+E for fullscreen toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd+Shift+E toggles fullscreen in editor
      const isFullscreenToggle = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e';
      if (isFullscreenToggle) {
        e.preventDefault();
        // Dispatch event to editor to toggle fullscreen
        window.dispatchEvent(new CustomEvent('editor:toggle-fullscreen'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Article editing removed - now handled in dedicated page at /artigo route

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

      if (!res.ok) throw new Error('Failed to save product');

      if (method === 'POST') {
        const created = await res.json();
        if (created?.id) {
          // Enfileira toast para a próxima rota e vai para a edição
          toast.next({ type: 'success', title: t('editor.productCreated') || 'Product created', placement: 'bottom-center' });
          router.replace(`/admin-secret-xyz/products/${created.id}/edit`);
          return;
        }
      }
      // Em PATCH, permanecer na página e liberar o botão
      toast.success(t('editor.changesSaved') || 'Changes saved', undefined, { anchor: lastClickPos.current ?? undefined });
      setIsLoading(false);
    } catch (err) {
      setError(t('editor.errorSaving') || 'Error saving product');
      toast.error(t('editor.errorSaving') || 'Error saving', undefined, { anchor: lastClickPos.current ?? undefined });
      setIsLoading(false);
    }
  };

  // Excluir produto (com toast de confirmação)
  const handleDeleteProduct = async (e?: React.MouseEvent) => {
    const clickPos = e ? { x: e.clientX, y: e.clientY } : undefined;
    const ok = await toast.confirm({
      title: t('editor.deleteProduct') || 'Delete product?',
      description: t('editor.deleteConfirm') || 'This action cannot be undone.',
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      placement: 'center',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.next({ type: 'success', title: t('editor.productDeleted') || 'Product deleted', placement: 'bottom-center' });
      router.refresh();
      router.push('/admin-secret-xyz/products');
    } catch (e) {
      toast.error(t('editor.errorDeleting') || 'Error deleting product', undefined, { anchor: clickPos });
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
        console.error('Autosave (links) failed', e);
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
        console.error('Autosave (reviews) failed', e);
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
        console.error('Failed to save reviews configuration', e);
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
        console.error('Autosave (tags) failed', e);
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

  if (isLoading) return <div className="p-8">{t('common.loading') || 'Loading...'}</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        {params.id === 'novo' ? (t('editor.newProduct') || 'New Product') : (t('editor.editProduct') || 'Edit Product')}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 lg:col-span-2">
        {/* Title */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-3 text-foreground">{t('editor.title') || 'Title'}</label>
          <textarea
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3 rounded-md bg-background border border-border text-foreground resize-y min-h-[60px]"
            placeholder={t('editor.titlePlaceholder') || 'Enter product title...'}
            required
          />
        </div>

        {/* Summary */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-3 text-foreground">
            {t('editor.cardSummary') || 'Card Summary'}
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full p-3 rounded-md bg-background border border-border text-foreground resize-y min-h-[80px]"
            placeholder={t('editor.summaryPlaceholder') || 'Brief description that will appear on the product card...'}
            required
          />
        </div>

        {/* Product Article Editor (inline, premium) */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with actions */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
            <div className="space-y-1">
              <h3 className="text-[17px] font-semibold text-foreground tracking-tight">Product Article</h3>
              <p className="text-[13px] text-foreground/60 leading-relaxed">Create comprehensive, beautifully formatted articles for your products with a modern Notion-style editor</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-b from-background/60 to-background/40 backdrop-blur-md border border-border/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[16px] font-medium text-foreground/90 transition-all hover:scale-105">⌘</kbd>
                  <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[14px] font-semibold text-foreground/90 transition-all hover:scale-105">S</kbd>
                </div>
                <span className="text-[13px] font-medium text-foreground/70 tracking-tight">save</span>
              </div>
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[16px] font-medium text-foreground/90 transition-all hover:scale-105">⌘</kbd>
                  <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[16px] font-medium text-foreground/90 transition-all hover:scale-105">⇧</kbd>
                  <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[14px] font-semibold text-foreground/90 transition-all hover:scale-105">E</kbd>
                </div>
                <span className="text-[13px] font-medium text-foreground/70 tracking-tight">fullscreen</span>
              </div>
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>
              <div className="flex items-center gap-2">
                <kbd className="inline-flex items-center justify-center min-w-[46px] h-8 px-3 rounded-lg bg-gradient-to-b from-background via-background to-background/90 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] text-[14px] font-semibold text-foreground/90 transition-all hover:scale-105">Esc</kbd>
                <span className="text-[13px] font-medium text-foreground/70 tracking-tight">exit</span>
              </div>
            </div>
          </div>

          {/* Editor inline sempre aberto */}
          <div className="p-5">
            <InlineProductArticleEditor
              productId={params.id}
              initialTitle={formData.title}
              initialSlug={formData.slug}
              initialArticleEn={(formData as any).article}
              initialArticlePtBr={(formData as any).articlePtBr}
              onSaved={() => toast.success(t('editor.changesSaved') || 'Changes saved')}
              onHiddenChange={(hidden) => {
                // Noop: editor always visible
              }}
            />
          </div>
        </div>
        {/* (Removido) Controles antigos de imagem — agora ficam dentro do Preview Card */}

        {/* Category */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">{t('editor.category') || 'Category'}</label>
          <div className="flex gap-2">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full p-2 rounded-md bg-background border border-border text-foreground"
              required
            >
              <option value="">{t('editor.selectCategory') || 'Select a category'}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {/* Quick suggestions based on title */}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewCategory(s.charAt(0).toUpperCase() + s.slice(1))}
                  className="px-2 py-1 text-xs rounded-full border border-border text-foreground/80 hover:bg-card/60"
                >
                  {t('editor.suggest') || 'Suggest'}: {s}
                </button>
              ))}
            </div>
          )}
          {/* Create new category inline */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('editor.newCategory') || 'New category'}
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
                  if (!res.ok) throw new Error('Failed to create category');
                  const created = await res.json();
                  setCategories((prev) => [...prev, created]);
                  setFormData((fd) => ({ ...fd, categoryId: created.id }));
                  setNewCategory('');
                } catch (e) {
                  setError(t('editor.errorCreatingCategory') || 'Could not create category');
                } finally {
                  setCreatingCategory(false);
                }
              }}
              className="px-3 py-2 rounded-md bg-foreground text-background disabled:opacity-50"
            >
              {creatingCategory ? (t('editor.creating') || 'Creating...') : (t('editor.createAndSelect') || 'Create & Select')}
            </button>
          </div>
        </div>

        {/* Internal Tags (chips with Apple-like blue, comma/Enter to add, autosave) */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">{t('editor.internalTags') || 'Internal Tags'}</label>
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
                  aria-label={`${t('editor.removeTag') || 'Remove tag'} ${tag}`}
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
              placeholder={tagsList.length === 0 ? (t('editor.tagsPlaceholder') || 'e.g.: cheap, portable, quiet') : (t('editor.tagsPlaceholderMore') || 'Type and use comma to add')}
              className="flex-1 min-w-[140px] p-1.5 bg-transparent focus:outline-none text-sm text-foreground placeholder:text-foreground/50"
            />
          </div>
          <p className="mt-1 text-xs text-foreground/60">{t('editor.tagsNote') || 'Used only to relate similar products. Will not be displayed on the site.'}</p>
        </div>

        {/* Reviews Display Configuration (Admin) */}
        <div className="bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-xl border border-border/40 rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-6 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="text-center mb-6">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-gradient-to-b from-foreground/12 to-foreground/8 text-foreground/90 shadow-sm">
              {t('editor.reviewsDisplay') || 'Reviews Display (Public)'}
            </span>
            <p className="mt-3 text-[13px] text-foreground/60 leading-relaxed">Configure how reviews will appear on the product page</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2">Layout Style</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-background/80 backdrop-blur border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-sm"
                value={reviewsDisplay.mode}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, mode: e.target.value as any }))}
              >
                <option value="minimal">Minimalist cards (current)</option>
                <option value="grid">Grid (2 columns)</option>
                <option value="single-slide">Single card (auto slide)</option>
                <option value="single-fade">Single card (fade in/out)</option>
                <option value="marquee">Cards queue (continuous loop)</option>
                <option value="summary">Summary only (average & count)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2">{t('editor.maxReviews') || 'Maximum reviews'}</label>
              <input type="number" min={1} max={12} value={reviewsDisplay.max}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, max: Math.max(1, Math.min(12, Number(e.target.value)||0)) }))}
                className="w-full px-4 py-3 rounded-xl bg-background/80 backdrop-blur border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2">{t('editor.order') || 'Order'}</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-background/80 backdrop-blur border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-sm"
                value={reviewsDisplay.order}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, order: e.target.value as any }))}
              >
                <option value="recent">{t('editor.mostRecent') || 'Most recent'}</option>
                <option value="rating">{t('editor.highestRating') || 'Highest rating'}</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-7">
              <input 
                id="cfg-stars" 
                type="checkbox" 
                checked={reviewsDisplay.showStars} 
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, showStars: e.target.checked }))} 
                className="w-5 h-5 rounded-md border-2 border-border/60 bg-background/80 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              />
              <label htmlFor="cfg-stars" className="text-[13px] font-medium text-foreground/90 cursor-pointer">{t('editor.showStarsPublic') || 'Show stars in public'}</label>
            </div>
          </div>

          {/* Sample (public preview) */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <div className="text-center mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {t('editor.samplePreview') || 'Live Preview'}
              </span>
            </div>
            <div className="mx-auto max-w-2xl">
              {(function(){
                const list = [...reviews];
                if (reviewsDisplay.order === 'rating') list.sort((a:any,b:any)=> (b.rating||0)-(a.rating||0));
                else list.sort((a:any,b:any)=> (new Date(b.createdAt||0).getTime()) - (new Date(a.createdAt||0).getTime()));
                const lim = list.slice(0, reviewsDisplay.max);
                if (reviewsDisplay.mode === 'hidden') return <div className="text-sm text-foreground/50">{t('editor.hidden') || 'Hidden'}</div>;
                if (reviewsDisplay.mode === 'summary') {
                  const avg = lim.length? (lim.reduce((s:any,r:any)=> s + (Number(r.rating)||0), 0)/lim.length).toFixed(1): '0.0';
                  return (
                    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 text-center">
                      <div className="text-sm text-foreground/70">{t('editor.reviewsAverage') || 'Reviews average'}</div>
                      <div className="text-3xl font-bold text-foreground mt-1">{avg} {reviewsDisplay.showStars ? '⭐' : ''}</div>
                      <div className="text-xs text-foreground/60 mt-1">{reviews.length} {t('editor.reviews') || 'reviews'}</div>
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
                        <div className="text-sm font-medium text-foreground">{r.author || t('editor.user') || 'User'}</div>
                        <div className="mt-1 text-xs text-foreground/70">{Number(r.rating||0).toFixed(1)} / 5.0 {reviewsDisplay.showStars ? '⭐'.repeat(Math.round(Number(r.rating||0))) : ''}</div>
                        <p className="mt-3 text-foreground/80 line-clamp-4">"{r.content}"</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Links (Minimalist accordion, autosave and store badge) */}
        <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="block text-sm font-medium text-foreground">{t('editor.affiliateLinks') || 'Affiliate Links'}</span>
            <div className="text-xs text-foreground/60">
              {savingLinks ? (t('common.saving') || 'Saving…') : lastSavedLinksAt ? (t('common.autoSaved') || 'Auto-saved') : '—'}
            </div>
          </div>
          <div className="space-y-3">
            {formData.links.map((link, index) => {
              const locale = (link as any).locale || ((link as any).title === 'Amazon US' ? 'en-us' : (link as any).title ? 'pt-br' : undefined);
              const badge = locale === 'en-us' ? 'Amazon US' : locale === 'pt-br' ? 'Amazon BR' : '—';
              const headerTitle = (link as any).productTitle?.trim() || (link.url ? new URL(link.url).hostname : (t('editor.untitledLink') || 'Untitled link'));
              const isOpen = expandedLink === index;
              return (
                <div key={index} className="rounded-lg border border-border bg-background/60">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <button
                      type="button"
                      className={`mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      onClick={()=> setExpandedLink(isOpen ? null : index)}
                      aria-label={t('editor.expand') || 'Expand'}
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
                      aria-label={t('common.removeLink') || 'Remove link'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/50">
                      <label className="block text-[11px] font-medium text-foreground/70 mb-1">{t('editor.title') || 'Title'}</label>
                      <input
                        type="text"
                        value={(link as any).productTitle ?? ''}
                        onChange={(e) => updateLink(index, 'productTitle', e.target.value)}
                        placeholder={t('editor.linkTitle') || 'Link title'}
                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
                      />
                      <div className="grid grid-cols-12 gap-3 mt-3 items-center">
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[11px] font-medium text-foreground/70 mb-1">{t('editor.store') || 'Store'}</label>
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
                            <option value="">{t('editor.select') || 'Select'}</option>
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
              {t('editor.addLink') || 'Add Link'}
            </button>
          </div>
        </div>

          {/* Buttons */}
          <div className="flex gap-4 bg-card/70 backdrop-blur-md border border-border rounded-xl p-6">
            <button
              type="submit"
              disabled={isLoading}
              onClick={(e)=>{ lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {isLoading ? (t('common.saving') || 'Saving...') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md bg-background border border-border text-foreground hover:bg-card/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
            >
              {t('common.cancel')}
            </button>
            {params.id !== 'novo' && (
              <button
                type="button"
                onClick={(e)=>handleDeleteProduct(e)}
                className="ml-auto px-4 py-2 rounded-md border border-red-400/40 bg-red-500/10 text-red-600 hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                aria-label={t('common.deleteProduct') || 'Delete product'}
              >
                {t('common.deleteProduct') || 'Delete Product'}
              </button>
            )}
          </div>
        </div>

        {/* Preview Card (Apple-like) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-xl border border-border/40 rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-6 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
              <div className="text-center mb-5">
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-gradient-to-b from-foreground/12 to-foreground/8 text-foreground/90 shadow-sm">
                  {t('chip.cardPreview')}
                </span>
              </div>
              <div className="mb-5">
                <input
                  type="url"
                  placeholder={t('placeholder.pasteImageUrl')}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-background/80 backdrop-blur border border-border/60 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-sm"
                  onKeyDown={(e:any)=>{ if(e.key==='Enter'){ e.preventDefault(); openCropWithUrl(e.currentTarget.value); } }}
                />
              </div>
              <div
                className={`max-w-sm mx-auto relative group ${isDraggingOver ? 'ring-2 ring-foreground ring-offset-2 rounded-2xl' : ''}`}
                onDragOver={(e)=>{ e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={()=>setIsDraggingOver(false)}
                onDrop={async (e)=>{ e.preventDefault(); setIsDraggingOver(false); const f = e.dataTransfer.files?.[0]; if(f) openCropWithFile(f); }}
              >
                {(() => {
                  const imageUrl = formData.imageUrl || 'https://placehold.co/600x600/1C1C1E/F2F2F2?text=Product';
                  const categoryName = categories.find(c => c.id === formData.categoryId)?.name || (t('editor.noCategory') || 'No Category');
                  const description = formData.summary || (t('editor.noSummary') || 'No summary.');
                  const title = formData.title || (t('editor.productTitle') || 'Product Title');
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
                      className="absolute inset-0 rounded-2xl border-2 border-dashed border-transparent group-hover:border-white/50 flex items-center justify-center text-center text-sm text-white drop-shadow-md bg-black/0 group-hover:bg-black/30 transition"
                      onClick={(e)=>{
                        const input = document.getElementById('editar-hidden-file') as HTMLInputElement | null;
                        input?.click();
                      }}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/30">
                        <ImagePlus className="w-5 h-5"/>
                        <span>{t('overlay.dropOrClick')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* input oculto para clique */}
                <input id="editar-hidden-file" type="file" accept="image/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(f) openCropWithFile(f); e.currentTarget.value=''; }} />
              </div>
            </div>
          </div>

          {/* Modal de recorte */}
          {isCropOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl w-full max-w-xl p-4 border border-border">
                <h3 className="font-semibold mb-3 text-foreground">{t('image.adjust') || 'Adjust Image'}</h3>
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
                  <label className="text-xs text-foreground/80">{t('image.zoom') || 'Zoom'}
                    <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="ml-2 align-middle" />
                  </label>
                  <div className="ml-auto flex gap-2">
                    <button type="button" className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground hover:bg-card/60" onClick={()=>setIsCropOpen(false)}>{t('common.cancel')}</button>
                    <button type="button" className="px-3 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90" onClick={confirmCropAndUpload}>{t('common.save')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Reviews Manager below Preview (Apple-like header) */}
          <div className="mt-10 bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-xl rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-border/40 p-6 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="text-center mb-5">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-gradient-to-b from-foreground/12 to-foreground/8 text-foreground/90 shadow-sm">{t('chip.reviewsEditor') || 'Reviews Editor'}</span>
              <div className="mt-3 text-[13px] leading-relaxed text-foreground/60">{t('reviews.subtitle') || 'Manage product reviews'}</div>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {/* Import via Scraping (HTML) */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl bg-gradient-to-b from-foreground to-foreground/90 text-background shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)] active:scale-[0.98] transition-all"
                  onClick={async () => {
                    try {
                      const primary = formData.links?.[0]?.url;
                      if (!primary) { toast.info(t('reviews.noPrimaryLink') || 'No primary link found', undefined, { placement: 'bottom-center' }); return; }
                      const loadingId = toast.loading(t('reviews.fetching') || 'Fetching reviews…', undefined, { placement: 'center' });
                      const res = await fetch('/api/scrape/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: primary }) });
                      const data = await res.json();
                      toast.dismiss(loadingId);
                      if (res.ok && Array.isArray(data?.reviews)) {
                        const merged = [...reviews, ...data.reviews.map((r:any)=>({ ...r, isManual: false }))];
                        setReviews(merged);
                        toast.success(`${data.reviews.length} ${t('reviews.imported') || 'reviews imported'}`, undefined, { placement: 'bottom-center' });
                      } else {
                        toast.info(t('reviews.couldNotExtract') || 'Could not extract reviews', undefined, { placement: 'bottom-center' });
                      }
                    } catch (e) {
                      toast.error(t('reviews.importFailed') || 'Failed to import reviews', undefined, { placement: 'bottom-center' });
                    }
                  }}
                >
                  <Code2 className="w-4 h-4" /> {t('reviews.import.scrapeHtml') || 'Import (Scraping HTML)'}
                </button>
                {/* Import via API (Rainforest) */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-xl bg-gradient-to-b from-foreground to-foreground/90 text-background shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)] active:scale-[0.98] transition-all"
                  onClick={async () => {
                    try {
                      const primary = formData.links?.[0]?.url;
                      if (!primary) { toast.info(t('reviews.noPrimaryLink') || 'No primary link found', undefined, { placement: 'bottom-center' }); return; }
                      const loadingId = toast.loading(t('reviews.fetching') || 'Fetching reviews…', undefined, { placement: 'center' });
                      const res = await fetch('/api/scrape/reviews-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: primary, max: 12 }) });
                      const data = await res.json();
                      toast.dismiss(loadingId);
                      if (res.ok && Array.isArray(data?.reviews)) {
                        const merged = [...reviews, ...data.reviews.map((r:any)=>({ ...r, isManual: false }))];
                        setReviews(merged);
                        toast.success(`${data.reviews.length} ${t('reviews.imported') || 'reviews imported'}`, undefined, { placement: 'bottom-center' });
                      } else {
                        toast.info(t('reviews.couldNotExtract') || 'Could not extract reviews', undefined, { placement: 'bottom-center' });
                      }
                    } catch (e) {
                      toast.error(t('reviews.importFailed') || 'Failed to import reviews', undefined, { placement: 'bottom-center' });
                    }
                  }}
                >
                  <Globe2 className="w-4 h-4" /> {t('reviews.import.api') || 'Import (Via API)'}
                </button>
              </div>
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