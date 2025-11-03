'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, ImagePlus, ChevronDown, Globe2, Code2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ProductCard from '../../../../../../components/ProductCard';
import ReviewsManager from '../../../../../../components/ReviewsManager';
import ReviewsCarousel from '../../../../../../components/ReviewsCarousel';
import ReviewsMarquee from '../../../../../../components/ReviewsMarquee';
import CategoryChipsInput from '../../../../../../components/CategoryChipsInput';
import { useToast } from '@/components/ToastProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { generateSlug } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleButton } from '@/components/ui/apple-button';
import { AppleBadge, type SaveStatus } from '@/components/ui/apple-badge';
import { AppleCard } from '@/components/ui/apple-card';

const InlineProductArticleEditor = dynamic(() => import('@/components/InlineProductArticleEditor'), { ssr: false });

// Server Component wrapper to handle async params
export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditarProdutoPageClient id={id} />;
}

// Client Component with hooks
function EditarProdutoPageClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { t, locale } = useLanguage() as { t: (k: string)=> string; locale: 'en-US' | 'pt-BR' };
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const capFirst = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const [creatingCategory, setCreatingCategory] = useState(false);
  const isInitialLoad = useRef(true);
  const [reviews, setReviews] = useState<any[]>([]);
  // Configuração de exibição de reviews (salva em scrapedQnA)
  const [reviewsDisplay, setReviewsDisplay] = useState<{ mode: 'minimal' | 'grid' | 'summary' | 'hidden' | 'single-slide' | 'single-fade' | 'marquee'; max: number; order: 'recent' | 'rating'; showStars: boolean }>({ mode: 'minimal', max: 6, order: 'recent', showStars: false });
  const reviewsCfgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Estado de edição de links (acordeão + autosave)
  const [expandedLink, setExpandedLink] = useState<number | null>(null);
  const [linksSaveStatus, setLinksSaveStatus] = useState<SaveStatus>('saved');
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
    if (id !== 'novo') {
      fetch(`/api/products/${id}`)
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
  }, [id]);
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
      const url = id === 'novo' 
        ? '/api/products'
        : `/api/products/${id}`;
      
      const method = id === 'novo' ? 'POST' : 'PATCH';

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
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
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
    setLinksSaveStatus('editing');
    const timer = setTimeout(async () => {
      try {
        setLinksSaveStatus('saving');
        const url = `/api/products/${id}`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: formData.links }),
        });
        setLastSavedLinksAt(new Date());
        setLinksSaveStatus('saved');
      } catch (e) {
        console.error('Autosave (links) failed', e);
        setLinksSaveStatus('failed');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.links]);

  // Autosave de reviews (debounced) — substitui completamente as reviews
  useEffect(() => {
    if (isLoading) return;
    if (id === 'novo') return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/products/${id}`, {
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
    if (id === 'novo') return;
    if (reviewsCfgTimer.current) clearTimeout(reviewsCfgTimer.current);
    reviewsCfgTimer.current = setTimeout(async () => {
      try {
        // Merge em scrapedQnA existente
        let current: any = {};
        try { current = (formData as any).scrapedQnA ? JSON.parse((formData as any).scrapedQnA as any) : {}; } catch {}
        const merged = { ...current, reviewsDisplay };
        const payload = JSON.stringify(merged);
        setFormData((fd) => ({ ...fd, scrapedQnA: payload } as any));
        await fetch(`/api/products/${id}`, {
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
    if (id === 'novo') return;
    // Mantém string de tags em sincronia
    setFormData((fd) => ({ ...fd, tags: tagsList.join(', ') }));
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/products/${id}`, {
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
        {id === 'novo' ? (t('editor.newProduct') || 'New Product') : (t('editor.editProduct') || 'Edit Product')}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 lg:col-span-2">
        {/* Title - Blue accent glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(59,130,246,0.15),inset_0_1px_2px_rgba(255,255,255,0.06)] transition-all duration-500">
            {/* Elegant blue glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-cyan-500/[0.02] dark:from-blue-400/[0.03] dark:to-cyan-400/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-6">
              <label className="block text-[13px] font-semibold mb-3 text-foreground/80 tracking-tight">
                {t('editor.title') || 'Title'}
              </label>
              <textarea
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-4 text-lg font-semibold rounded-xl bg-white/60 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] text-foreground resize-y min-h-[70px] focus:outline-none focus:bg-white/80 dark:focus:bg-black/40 focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-foreground/30"
                placeholder={t('editor.titlePlaceholder') || 'Enter product title...'}
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Summary - Emerald accent glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_2px_rgba(255,255,255,0.06)] transition-all duration-500">
            {/* Elegant emerald glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-teal-500/[0.02] dark:from-emerald-400/[0.025] dark:to-teal-400/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-6">
              <label className="block text-[13px] font-semibold mb-3 text-foreground/80 tracking-tight">
                {t('editor.cardSummary') || 'Card Summary'}
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full p-4 text-sm leading-relaxed rounded-xl bg-white/60 dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] text-foreground resize-y min-h-[90px] focus:outline-none focus:bg-white/80 dark:focus:bg-black/40 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-foreground/30"
                placeholder={t('editor.summaryPlaceholder') || 'Brief description that will appear on the product card...'}
                required
              />
            </div>
          </div>
        </motion.div>

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
              productId={id}
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

        {/* Category (chips-like selector) */}
        <AppleCard variant="glass" className="p-6">
          <label className="block text-sm font-medium mb-3 text-foreground">{t('editor.category') || 'Category'}</label>
          <CategoryChipsInput
            categories={categories}
            value={formData.categoryId}
            onChange={(id)=> setFormData((fd)=> ({ ...fd, categoryId: id }))}
            onCreate={async (name: string) => {
              const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
              if (!res.ok) throw new Error('Failed to create category');
              const created = await res.json();
              setCategories((prev)=> [...prev, created]);
              return created;
            }}
            locale={locale}
            titleSuggestions={suggestions.map((s)=> s.charAt(0).toUpperCase() + s.slice(1))}
          />
        </AppleCard>

        {/* Internal Tags (chips with Apple-like blue, comma/Enter to add, autosave) */}
        <AppleCard variant="glass" className="p-6">
          <label className="block text-sm font-medium mb-2 text-foreground">{t('editor.internalTags') || 'Internal Tags'}</label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.06] backdrop-blur-xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.06] backdrop-blur-sm text-foreground/80 text-xs font-medium px-3 py-1 shadow-sm hover:border-blue-500/30 hover:text-blue-700/80 dark:hover:text-blue-300/90 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 w-4 h-4 leading-none flex items-center justify-center transition-colors"
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
        </AppleCard>

        {/* Reviews Display Configuration - Purple accent glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(147,51,234,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(147,51,234,0.15),inset_0_1px_2px_rgba(255,255,255,0.06)] transition-all duration-500">
            {/* Elegant purple glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.04] via-transparent to-pink-500/[0.02] dark:from-purple-400/[0.03] dark:to-pink-400/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-8">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide bg-purple-500/[0.08] dark:bg-purple-400/[0.12] text-purple-700/90 dark:text-purple-300/90 border border-purple-500/20 dark:border-purple-400/20 shadow-[0_2px_8px_rgba(147,51,234,0.12)] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
                  {t('editor.reviewsDisplay') || 'Reviews Display (Public)'}
                </span>
              <p className="mt-4 text-[13px] text-foreground/60 leading-relaxed max-w-lg mx-auto">Configure how reviews will appear on the product page</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2.5 tracking-wide">Layout Style</label>
              <select
                className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-xl border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2.5 tracking-wide">{t('editor.maxReviews') || 'Maximum reviews'}</label>
              <input type="number" min={1} max={12} value={reviewsDisplay.max}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, max: Math.max(1, Math.min(12, Number(e.target.value)||0)) }))}
                className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-xl border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-[12px] font-semibold text-foreground/80 mb-2.5 tracking-wide">{t('editor.order') || 'Order'}</label>
              <select
                className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-xl border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                value={reviewsDisplay.order}
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, order: e.target.value as any }))}
              >
                <option value="recent">{t('editor.mostRecent') || 'Most recent'}</option>
                <option value="rating">{t('editor.highestRating') || 'Highest rating'}</option>
              </select>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3 pt-7"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <input 
                id="cfg-stars" 
                type="checkbox" 
                checked={reviewsDisplay.showStars} 
                onChange={(e)=> setReviewsDisplay((s)=> ({ ...s, showStars: e.target.checked }))} 
                className="w-5 h-5 rounded-lg border-2 border-border/60 bg-gradient-to-b from-background/90 to-background/70 checked:bg-gradient-to-br checked:from-purple-500 checked:to-blue-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer shadow-sm"
              />
              <label htmlFor="cfg-stars" className="text-[13px] font-medium text-foreground/90 cursor-pointer">{t('editor.showStarsPublic') || 'Show stars in public'}</label>
            </motion.div>
          </div>

          {/* Sample (public preview) */}
          <motion.div 
            className="mt-8 pt-8 border-t border-border/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center mb-6">
              <motion.span 
                className="inline-flex items-center px-4 py-2 rounded-full text-[11px] font-medium bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {t('editor.samplePreview') || 'Live Preview'}
              </motion.span>
            </div>
            <motion.div 
              className="mx-auto max-w-2xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>
          </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Links (Minimalist accordion, autosave and store badge) */}
        <AppleCard variant="glass" className="p-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="block text-sm font-medium text-foreground">{t('editor.affiliateLinks') || 'Affiliate Links'}</span>
            <AppleBadge status={linksSaveStatus} />
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
            <AppleButton
              type="button"
              variant="primary"
              size="sm"
              onClick={addLink}
            >
              <PlusCircle className="w-4 h-4" />
              {t('editor.addLink') || 'Add Link'}
            </AppleButton>
          </div>
        </AppleCard>

          {/* Buttons */}
          <AppleCard variant="glass" className="flex gap-4 p-6">
            <AppleButton
              type="submit"
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              onClick={(e)=>{ lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
            >
              {t('common.save') || 'Save'}
            </AppleButton>
            <AppleButton
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              {t('common.cancel') || 'Cancel'}
            </AppleButton>
            {id !== 'novo' && (
              <AppleButton
                type="button"
                variant="danger"
                onClick={(e)=>handleDeleteProduct(e)}
                className="ml-auto"
              >
                {t('common.deleteProduct') || 'Delete Product'}
              </AppleButton>
            )}
          </AppleCard>
        </div>

        {/* Preview Card (Apple-like) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <AppleCard variant="premium" className="p-6">
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
                  const cat = categories.find(c => c.id === formData.categoryId);
                  const categoryName = (locale === 'pt-BR' && cat?.namePtBr) ? cat.namePtBr : (cat?.name || (t('editor.noCategory') || 'No Category'));
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
            </AppleCard>
          </div>

          {/* Modal de recorte */}
          {isCropOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <AppleCard variant="glass" className="w-full max-w-xl p-4">
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
                    <AppleButton type="button" variant="secondary" onClick={()=>setIsCropOpen(false)}>{t('common.cancel')}</AppleButton>
                    <AppleButton type="button" variant="primary" onClick={confirmCropAndUpload}>{t('common.save')}</AppleButton>
                  </div>
                </div>
              </AppleCard>
            </div>
          )}
          {/* Reviews Manager - Amber warm glow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.15)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.08),inset_0_1px_2px_rgba(255,255,255,0.2)] dark:hover:shadow-[0_8px_24px_rgba(245,158,11,0.15),inset_0_1px_2px_rgba(255,255,255,0.06)] transition-all duration-500 mt-10">
              {/* Warm amber glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-orange-500/[0.02] dark:from-amber-400/[0.025] dark:to-orange-400/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-8">
                <div className="text-center mb-7">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/[0.08] dark:bg-amber-400/[0.12] text-amber-700/90 dark:text-amber-300/90 border border-amber-500/20 dark:border-amber-400/20 shadow-[0_2px_8px_rgba(245,158,11,0.12)] backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                    {t('chip.reviewsEditor') || 'Reviews Editor'}
                  </span>
                <p className="mt-4 text-[13px] leading-relaxed text-foreground/60 max-w-xs mx-auto">{t('reviews.subtitle') || 'Curate and manage customer reviews for this product'}</p>
                <div className="mt-6 flex items-center justify-center">
                  <AppleButton
                    type="button"
                    variant="primary"
                    onClick={() => setIsImportOpen(true)}
                  >
                    {t('btn.importFromPrimary') || 'Import Reviews'}
                  </AppleButton>
                </div>
              </div>
              {/* Fecha div text-center */}
              {/* Modal de importação */}
              {isImportOpen && (
                <motion.div 
                  className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <AppleCard variant="glass" className="w-full max-w-md overflow-hidden">
                      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                        <h5 className="text-sm font-semibold text-foreground">{t('chip.reviewsEditor') || 'Reviews Editor'}</h5>
                        <AppleButton variant="ghost" size="sm" onClick={()=> setIsImportOpen(false)}>{t('common.close') || 'Close'}</AppleButton>
                      </div>
                      <div className="p-5 space-y-3">
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-background/80 hover:bg-background transition-all text-left"
                        onClick={async ()=>{
                          let loadingId: string | number | undefined;
                          try {
                            // Find the affiliate link that matches current locale toggle (normalized)
                            const targetLink = formData.links?.find((l: any) => {
                              const lcl = String((l as any)?.locale || '').toLowerCase();
                              return locale === 'pt-BR' ? (lcl.includes('pt') || lcl.includes('br')) : (lcl.includes('en') || lcl.includes('us'));
                            }) || formData.links?.[0];
                            const url = targetLink?.url;
                            const linkLocale: 'en-US' | 'pt-BR' = (String((targetLink as any)?.locale || '').toLowerCase().includes('pt') || String((targetLink as any)?.locale || '').toLowerCase().includes('br')) ? 'pt-BR' : 'en-US';
                            
                            if (!url) { toast.info(t('reviews.noPrimaryLink') || 'No primary link found', undefined, { placement: 'bottom-center' }); return; }
                            loadingId = toast.loading(t('reviews.fetching') || 'Fetching reviews…', undefined, { placement: 'center' });
                            const res = await fetch('/api/scrape/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, locale: linkLocale }) });
                            const data = await res.json();
                            if (res.ok && Array.isArray(data?.reviews)) {
                              // Dedup: normalize + compare author + content + rating
                              const normalize = (s: string) => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/["'`´'""]/g,'').replace(/\s+/g,' ').trim();
                              const keyOf = (r: any) => [normalize(r.author||''), normalize(r.content||''), String(Math.round((Number(r.rating)||0)*10)/10)].join('|');
                              const existingKeys = new Set(reviews.map(keyOf));
                              const newReviews = data.reviews.filter((r:any)=> !existingKeys.has(keyOf(r))).map((r:any)=>({...r, isManual: false, locale: linkLocale}));
                              const merged = [...reviews, ...newReviews];
                              setReviews(merged);
                              toast.dismiss(loadingId as any);
                              toast.success(`${newReviews.length} ${t('reviews.imported') || 'reviews imported'}`, undefined, { placement: 'bottom-center' });
                              setIsImportOpen(false);
                            } else {
                              toast.dismiss(loadingId as any);
                              toast.info(t('reviews.couldNotExtract') || 'Could not extract reviews', undefined, { placement: 'bottom-center' });
                            }
                          } catch (e) {
                            if (loadingId !== undefined) toast.dismiss(loadingId as any);
                            toast.error(t('reviews.importFailed') || 'Failed to import reviews', undefined, { placement: 'bottom-center' });
                          }
                        }}
                      >
                        <Code2 className="w-4 h-4" />
                        <div>
                          <div className="text-[13px] font-semibold">{t('reviews.import.scrapeHtml') || 'Import (Scraping HTML)'}</div>
                          <div className="text-[12px] text-foreground/60">{(t as any)?.locale === 'pt-BR' ? 'Funciona para amazon.* e fallback HTML.' : 'Works for amazon.* and generic HTML fallback.'}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-background/80 hover:bg-background transition-all text-left"
                        onClick={async ()=>{
                          let loadingId: string | number | undefined;
                          try {
                            // Find the affiliate link that matches current locale toggle (normalized)
                            const targetLink = formData.links?.find((l: any) => {
                              const lcl = String((l as any)?.locale || '').toLowerCase();
                              return locale === 'pt-BR' ? (lcl.includes('pt') || lcl.includes('br')) : (lcl.includes('en') || lcl.includes('us'));
                            }) || formData.links?.[0];
                            const url = targetLink?.url;
                            const linkLocale: 'en-US' | 'pt-BR' = (String((targetLink as any)?.locale || '').toLowerCase().includes('pt') || String((targetLink as any)?.locale || '').toLowerCase().includes('br')) ? 'pt-BR' : 'en-US';
                            
                            if (!url) { toast.info(t('reviews.noPrimaryLink') || 'No primary link found', undefined, { placement: 'bottom-center' }); return; }
                            loadingId = toast.loading(t('reviews.fetching') || 'Fetching reviews…', undefined, { placement: 'center' });
                            const res = await fetch('/api/scrape/reviews-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, max: 12, locale: linkLocale }) });
                            const data = await res.json();
                            if (res.ok && Array.isArray(data?.reviews)) {
                              // Dedup: normalize + compare author + content + rating
                              const normalize = (s: string) => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/["'`´'""]/g,'').replace(/\s+/g,' ').trim();
                              const keyOf = (r: any) => [normalize(r.author||''), normalize(r.content||''), String(Math.round((Number(r.rating)||0)*10)/10)].join('|');
                              const existingKeys = new Set(reviews.map(keyOf));
                              const newReviews = data.reviews.filter((r:any)=> !existingKeys.has(keyOf(r))).map((r:any)=>({...r, isManual: false, locale: linkLocale}));
                              const merged = [...reviews, ...newReviews];
                              setReviews(merged);
                              toast.dismiss(loadingId as any);
                              toast.success(`${newReviews.length} ${t('reviews.imported') || 'reviews imported'}`, undefined, { placement: 'bottom-center' });
                              setIsImportOpen(false);
                            } else {
                              toast.dismiss(loadingId as any);
                              toast.info(t('reviews.couldNotExtract') || 'Could not extract reviews', undefined, { placement: 'bottom-center' });
                            }
                          } catch (e) {
                            if (loadingId !== undefined) toast.dismiss(loadingId as any);
                            toast.error(t('reviews.importFailed') || 'Failed to import reviews', undefined, { placement: 'bottom-center' });
                          }
                        }}
                      >
                        <Globe2 className="w-4 h-4" />
                        <div>
                          <div className="text-[13px] font-semibold">{t('reviews.import.api') || 'Import (Via API)'}</div>
                          <div className="text-[12px] text-foreground/60">{(t as any)?.locale === 'pt-BR' ? 'Mais estável, apenas amazon.* (Rainforest API).' : 'More stable, amazon.* only (Rainforest API).'}</div>
                        </div>
                      </button>
                      </div>
                    </AppleCard>
                  </motion.div>
                </motion.div>
              )}
              <ReviewsManager
                initialReviews={reviews}
                onReviewsChange={(r)=> setReviews(r)}
              />
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}