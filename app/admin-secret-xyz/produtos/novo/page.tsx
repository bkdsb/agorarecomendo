"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, CheckCircle, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '../../../../components/ProductCard';
import Cropper from 'react-easy-crop';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

// --- TIPAGEM ---
interface AffiliateLink {
  id: string;
  url: string;
  locale: string;
  store: string;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  isManual: boolean;
}

interface ProductData {
  title: string;
  slug: string;
  price: string;
  imageUrl: string;
  summary: string;
  article?: string;
  scrapedDescription: string;
  scrapedQnA: string;
  links: AffiliateLink[]; 
  reviews: Review[];
  categoryId?: string | null;
}

// --- DADOS MOCKADOS/SIMULADOS (Scraping) ---
const mockProductData = (url: string): ProductData => {
  let title, slug, price, imageUrl, summary, reviews;

  // Lógica de aperfeiçoamento de scraping (reconhecendo o link da luminária)
  if (url.includes('amzn.to/49lIDUz') || url.includes('luminaria')) {
    title = 'Luminária de Mesa LED Flexível (Reconhecida)';
    slug = 'luminaria-led-flexivel';
    // PREÇO REALISTA DE MOCKUP: (Editável pelo Admin)
    price = 'R$ 149,99'; 
    // IMAGEM REALISTA DE MOCKUP: (Editável pelo Admin)
    imageUrl = 'https://m.media-amazon.com/images/I/51WDlUBODuL._AC_SX342_SY445_QL70_ML2_.jpg';
    summary = 'A escolha ideal para home office. Brilho ajustável e design moderno.';
    reviews = [
      { id: 'r1', author: 'João S.', rating: 4.5, content: 'Muito potente e elegante. A cor cinza combina com tudo.', isManual: false },
      { id: 'r2', author: 'Maria F.', rating: 5.0, content: 'Melhor compra do ano! Chegou rápido.', isManual: false },
    ];
  } else {
    // Dados padrão
    title = 'Fone de Ouvido Bluetooth Xtreme Comfort (Simulado)';
    slug = 'fone-bluetooth';
    price = 'R$ 399,00';
    imageUrl = 'https://placehold.co/600x400/1C1C1E/F2F2F2?text=Fone+de+Ouvido';
    summary = 'Som cristalino e bateria de longa duração, ideal para treinos.';
    reviews = [{ id: 'r3', author: 'Cliente Sim', rating: 3.5, content: 'Muito bom, mas um pouco apertado na cabeça.', isManual: false }];
  }

  return {
    title,
    slug,
    price,
    imageUrl,
    summary,
    scrapedDescription: 'Descrição completa do fabricante (mock). Material premium, 1 ano de garantia.',
    scrapedQnA: '{"pergunta": "Tem microfone?", "resposta": "Sim, com cancelamento de ruído."}',
    links: [
      { id: 'l1', url: 'https://amazon.com.br/link-br', locale: 'pt-br', store: 'Amazon BR' },
      { id: 'l2', url: 'https://amazon.com/link-us', locale: 'en-us', store: 'Amazon US' },
    ],
    reviews,
  };
};

// --- COMPONENTE PRINCIPAL (Novo Produto) ---
export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [lastClick, setLastClick] = useState<{x:number;y:number}|null>(null);

  const [link, setLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  
  // Dados do Produto (Estado de Edição)
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // Estado para o input de URL de Imagem
  // Controles de exibição da imagem no preview
  const [imageFit, setImageFit] = useState<'cover'|'contain'>('contain');
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [imageScale, setImageScale] = useState(1);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<{x:number; y:number}>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  // Categorias
  const [categories, setCategories] = useState<Array<{id: string; name: string; slug: string}>>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false); // toggle UI open/close
  const [savingCat, setSavingCat] = useState(false); // saving state
  const [newCatName, setNewCatName] = useState('');

  const onCropComplete = (_: any, cropped: any) => setCroppedAreaPixels(cropped);
  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
  const openCropWithUrl = (url: string) => { if(!url) return; setCropImageSrc(url); setIsCropOpen(true); setZoom(1); setCrop({x:0,y:0}); };
  const openCropWithFile = async (file: File) => { const dataUrl = await fileToDataUrl(file); setCropImageSrc(dataUrl); setIsCropOpen(true); setZoom(1); setCrop({x:0,y:0}); };
  const getCroppedBlob = async (imageSrc: string, cropPixels: {x:number;y:number;width:number;height:number}) => {
    const img = new window.Image(); img.crossOrigin = 'anonymous'; img.src = imageSrc; await new Promise((res, rej)=>{ img.onload=()=>res(null as any); img.onerror=rej; });
    const canvas = document.createElement('canvas'); const outSize = 800; canvas.width = outSize; canvas.height = outSize; const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, outSize, outSize);
    const blob: Blob = await new Promise((resolve)=>canvas.toBlob((b)=>resolve(b as Blob), 'image/jpeg', 0.9)!);
    return blob;
  };
  const confirmCropAndUpload = async () => { if(!cropImageSrc || !croppedAreaPixels || !productData) return; try { const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels); const data = new FormData(); data.append('file', new File([blob], 'crop.jpg', { type: 'image/jpeg' })); const res = await fetch('/api/upload', { method:'POST', body:data }); if(res.ok){ const j = await res.json(); setCurrentImageUrl(j.url); setProductData(prev=>({...prev!, imageUrl:j.url })); setIsCropOpen(false);} } catch(e){ console.error('Falha ao recortar:', e);} };

  // Sincroniza a imagem atual no estado de edição
  useEffect(() => {
    if (productData) {
      setCurrentImageUrl(productData.imageUrl);
    }
  }, [productData]);

  // Carrega categorias quando existir produto para editar
  useEffect(() => {
    let ignore = false;
    async function loadCategories(){
      try {
        setCatLoading(true);
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setCategories(data ?? []);
      } finally {
        setCatLoading(false);
      }
    }
    if (productData) loadCategories();
    return () => { ignore = true; };
  }, [productData]);

  const normalize = (s: string) => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const capitalize = (s: string) => s.length ? s[0].toUpperCase() + s.slice(1) : s;

  const getTitleFirstWords = (title: string) => {
    const words = normalize(title).split(' ').filter(Boolean).slice(0, 6);
    return words;
  };

  const handleTitleWordSuggestion = async (word: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const anchor = { x: e.clientX, y: e.clientY };
    const wlower = word.toLowerCase();
    const existing = categories.find(c => c.name.toLowerCase() === wlower);
    if (existing) {
      handleSelectCategory(existing.id);
      toast.info('Categoria selecionada', existing.name, { anchor });
      return;
    }
    // cria nova categoria com o termo e seleciona
    try {
      const name = capitalize(word);
      setSavingCat(true);
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error('fail');
      const created = await res.json();
      setCategories(prev => [...prev, created].sort((a,b)=>a.name.localeCompare(b.name)));
      handleSelectCategory(created.id);
      toast.success('Categoria criada', created.name, { anchor });
    } catch {
      toast.error('Erro ao criar categoria', undefined, { anchor });
    } finally {
      setSavingCat(false);
    }
  };

  const handleSelectCategory = (id: string | null) => {
    if (!productData) return;
    setProductData(prev => ({ ...prev!, categoryId: id }));
  };

  const handleCreateCategory = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const anchor = { x: e.clientX, y: e.clientY };
    if (!newCatName.trim()) {
      toast.error('Informe um nome', undefined, { anchor });
      return;
    }
    try {
      setSavingCat(true);
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) });
      if (!res.ok) throw new Error('fail');
      const created = await res.json();
      setCategories(prev => [...prev, created].sort((a,b)=>a.name.localeCompare(b.name)));
      handleSelectCategory(created.id);
      setNewCatName('');
      setCreatingCat(false);
      setSavingCat(false);
      toast.success('Categoria criada', undefined, { anchor });
    } catch {
      setSavingCat(false);
      toast.error('Erro ao criar categoria', undefined, { anchor });
    }
  };

  // Função para simular o Scraping (roda no cliente)
  const handleScraping = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    const loadingId = toast.loading('Fetching product information…', undefined, { placement: 'center' });

    if (!link.startsWith('http')) {
      setError('Por favor, insira um link válido (começando com http:// ou https://).');
      setStatus('error');
      toast.error('Invalid link', 'Use a full URL starting with http(s)://', { anchor: lastClick ?? undefined });
      toast.dismiss(loadingId);
      return;
    }

    // SIMULAÇÃO: Demora um pouco para simular a chamada API/Scraping
    setTimeout(() => {
      try {
        const scrapedData = mockProductData(link);
        setProductData(scrapedData);
        setLink('');
        setStatus('success');
        toast.dismiss(loadingId);
        toast.success('Product info fetched', undefined, { placement: 'bottom-center' });
      } catch (err) {
        setError('Erro ao processar o link. Tente novamente.');
        setStatus('error');
        toast.dismiss(loadingId);
        toast.error('Failed to fetch info', undefined, { placement: 'bottom-center' });
      }
    }, 1500);
  };

  // Atualiza os dados do formulário de Edição
  const handleProductChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (productData) {
      setProductData(prev => ({ ...prev!, [name]: value }));
    }
  };

  // Função de Publicação (simulação)
  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const loadingId = toast.loading('Publishing product…', undefined, { placement: 'center' });
    
    try {
      // Aqui você faria a chamada real para sua API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar o produto');
      }

      setStatus('success');
      toast.dismiss(loadingId);
      const created = await response.json();
      // Toast na próxima rota (edição completa) garantindo feedback visível após navegar
      toast.next({ type: 'success', title: 'Product card published', placement: 'bottom-center' });
      router.push(`/admin-secret-xyz/produtos/${created.id}/editar`);
    } catch (error) {
      console.error('Erro ao publicar:', error);
      setStatus('error');
      setError('Erro ao publicar o produto. Tente novamente.');
      toast.dismiss(loadingId);
      toast.error('Failed to publish', undefined, { anchor: lastClick ?? undefined });
    }
  };

  // --- Renderização Condicional ---
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin-secret-xyz" className="text-foreground/70 hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-3xl font-bold text-foreground">
          {productData ? 'Edit and Publish Product Card' : 'Novo Produto via Link'}
        </h2>
      </div>

      {/* --- FORMULÁRIO DE SCRAPING (INICIAL) --- */}
      {!productData && (
        <form onSubmit={handleScraping} className="bg-card/70 backdrop-blur-md p-6 rounded-xl shadow-sm shadow-black/5 dark:shadow-white/5 border border-border max-w-2xl mx-auto space-y-4">
          <label htmlFor="productLink" className="block text-sm font-medium text-foreground">
            Enter the product link
          </label>
          <input
            id="productLink"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g., https://amzn.to/..."
            className="w-full p-3 rounded-lg bg-background border border-border text-foreground"
            required
            disabled={status === 'loading'}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            onClick={(e)=> setLastClick({ x: (e as any).clientX, y: (e as any).clientY })}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            {status === 'loading' ? 'Fetching…' : 'Fetch product information with the link'}
          </button>
        </form>
      )}

      {/* --- FORMULÁRIO DE EDIÇÃO (APÓS SCRAPING) --- */}
      {productData && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Dados Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mídia e Dados – controles agora ficam embutidos no preview do card ao lado */}
              <div className="bg-card/70 backdrop-blur-md p-6 rounded-xl shadow-sm shadow-black/5 dark:shadow-white/5 border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-2">Mídia e Dados</h3>
                <p className="text-sm text-foreground/70">Ajuste a imagem diretamente no preview do card (coluna à direita).</p>
              </div>

              {/* Dados Editáveis */}
              <div className="bg-card/70 backdrop-blur-md p-6 rounded-xl shadow-sm shadow-black/5 dark:shadow-white/5 border border-border space-y-4">
                <h3 className="text-xl font-semibold text-foreground mb-4">Conteúdo Principal</h3>
                
                {/* Título (Editável) */}
                <label className="block text-sm font-medium text-foreground">Título do Produto</label>
                <input
                  type="text"
                  name="title"
                  value={productData.title}
                  onChange={handleProductChange}
                  className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
                />

                {/* Preço (Editável) */}
                <label className="block text-sm font-medium text-foreground">Preço (R$)</label>
                <input
                  type="text"
                  name="price"
                  value={productData.price}
                  onChange={handleProductChange}
                  placeholder="Ex: R$ 399,00"
                  className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
                />

                {/* Categoria (Seleção/Sugestão/Criação rápida) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={productData.categoryId ?? ''}
                      onChange={(e)=> handleSelectCategory(e.target.value || null)}
                      className="flex-1 p-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    >
                      <option value="">Selecionar…</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={()=> setCreatingCat(v=>!v)}
                      className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground hover:bg-card/60"
                    >
                      {creatingCat ? 'Cancelar' : 'Criar nova'}
                    </button>
                  </div>
                  {creatingCat && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e)=> setNewCatName(e.target.value)}
                        placeholder="Nome da categoria"
                        className="flex-1 p-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={savingCat}
                        className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >Salvar</button>
                    </div>
                  )}
                  {!creatingCat && !!(productData.title) && getTitleFirstWords(productData.title).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-foreground/60">Sugestões do título:</span>
                      {getTitleFirstWords(productData.title).map(w => (
                        <button key={w} type="button" onClick={(e)=> handleTitleWordSuggestion(w, e)} className="px-2 py-1 text-xs rounded-full border border-border text-foreground/80 hover:bg-card/60">
                          {capitalize(w)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumo Rápido (Editável) */}
                <label className="block text-sm font-medium text-foreground">Resumo Rápido (para Card)</label>
                <textarea
                  name="summary"
                  value={productData.summary}
                  onChange={handleProductChange}
                  rows={3}
                  className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>

              {/* Botão Final de Publicação (no lugar do "Full Article") */}
              <button
                type="button"
                onClick={(e)=>{ setLastClick({ x: (e as any).clientX, y: (e as any).clientY }); handlePublish(e); }}
                disabled={status === 'loading'}
                className="w-full px-4 py-3 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-colors disabled:opacity-50 shadow-sm shadow-black/5 dark:shadow-white/5"
              >
                {status === 'loading' ? 'Publicando...' : 'Publicar Produto'}
              </button>
            </div>

            {/* Coluna 2: Ações, Reviews, Links + Preview */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* (Removidos) Reviews e Gestão de Links — passam a existir na página de edição */}

              {/* Preview do Card com toolbar (URL) + DnD + modal de recorte */}
              <div className="bg-card/70 backdrop-blur-md p-4 rounded-xl border border-border shadow-sm shadow-black/5 dark:shadow-white/5">
                <div className="mb-3 text-center">
                  <h4 className="text-3xl font-extrabold tracking-wide uppercase text-foreground">CARD Preview</h4>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1 text-foreground/80">URL</label>
                  <input type="url" placeholder="Adicione uma imagem via URL" className="w-full p-3 text-sm border border-border bg-background text-foreground rounded-lg" onKeyDown={(e:any)=>{ if(e.key==='Enter'){ e.preventDefault(); openCropWithUrl(e.currentTarget.value); }}} />
                </div>
                {(() => {
                  const imageUrl = currentImageUrl || productData?.imageUrl || 'https://placehold.co/600x600/1C1C1E/F2F2F2?text=Produto';
                  const title = productData?.title || 'Título do Produto';
                  const description = productData?.summary || 'Sem resumo rápido.';
                  const category = (productData?.categoryId && categories.find(c => c.id === productData?.categoryId)?.name) || 'Sem Categoria';
                  const affiliate = productData?.links?.[0]?.url || '#';
                  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
                  const articleLink = `/produto/${slugify(title)}`;
                  const position = `${posX}% ${posY}%`;
                  return (
                    <div
                      className={`max-w-sm relative group ${isDraggingOver ? 'ring-2 ring-foreground ring-offset-2 rounded-2xl' : ''}`}
                      onClick={(e)=>{ const target = e.target as HTMLElement; if (target.closest('a')) return; const input = document.getElementById('novo-hidden-file') as HTMLInputElement | null; input?.click(); }}
                      onDragOver={(e)=>{ e.preventDefault(); setIsDraggingOver(true); }}
                      onDragLeave={()=>setIsDraggingOver(false)}
                      onDrop={async (e)=>{ e.preventDefault(); setIsDraggingOver(false); const f = e.dataTransfer.files?.[0]; if(f) openCropWithFile(f); }}
                    >
                      <ProductCard imageUrl={imageUrl} title={title} category={category} description={description} articleLink={articleLink} affiliateLink={affiliate} imageFit={imageFit} imagePosition={position} imageScale={imageScale} />
                      {/* Overlay hint de DnD / Clique para enviar (somente na área da imagem) */}
                      <div className="absolute inset-x-0 top-0 pointer-events-none group-hover:pointer-events-auto">
                        <div className="relative w-full" style={{ paddingTop: '100%' }}>
                          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-transparent group-hover:border-white/50 flex items-center justify-center text-center text-sm text-white drop-shadow-md bg-black/0 group-hover:bg-black/40 transition" onClick={(e)=>{ const input = document.getElementById('novo-hidden-file') as HTMLInputElement | null; input?.click(); }}>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/30">
                              <ImagePlus className="w-5 h-5"/>
                              <span>Arraste, solte ou clique para enviar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <input id="novo-hidden-file" type="file" accept="image/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(f) openCropWithFile(f); e.currentTarget.value=''; }} />
                    </div>
                  );
                })()}

                {/* Modal de recorte */}
                {isCropOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-card/70 backdrop-blur-md rounded-xl shadow-xl w-full max-w-xl p-4 border border-border">
                      <h3 className="font-semibold mb-3 text-foreground">Ajuste a imagem</h3>
                      <div className="relative w-full aspect-square bg-background rounded-md overflow-hidden">
                        <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <label className="text-xs text-foreground/80">Zoom
                          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="ml-2 align-middle" />
                        </label>
                        <div className="ml-auto flex gap-2">
                          <button type="button" className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground hover:bg-background/80" onClick={()=>setIsCropOpen(false)}>Cancelar</button>
                          <button type="button" className="px-3 py-2 text-sm rounded-md bg-foreground text-background hover:opacity-90" onClick={confirmCropAndUpload}>Aplicar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* (Removido) botão alinhado à direita — agora o botão fica no lugar do bloco "Full Article" */}
        </div>
      )}
    </>
  );
}
