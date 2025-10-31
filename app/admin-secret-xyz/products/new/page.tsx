"use client";

import { useState, FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useLanguage } from '@/components/LanguageProvider';

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

// --- MAIN COMPONENT (New Product) ---
export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const [lastClick, setLastClick] = useState<{x:number;y:number}|null>(null);

  const [link, setLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  
  // Helpers para validar domínio suportado pela Rainforest (exige amazon.*)
  const getHostname = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
  const isAmazonDomain = (host: string) => /(^|\.)amazon\./.test(host);

  // Via API (Rainforest) – gets product data + reviews and combines
  const fetchViaAPI = async () => {
    setError('');
    setStatus('loading');
    const loadingId = toast.loading(t('newProduct.processingAPI') || 'Processing via API…', undefined, { placement: 'center' });
    try {
      const urlPayload = { url: link.trim() };
      // Fetch product and reviews in parallel
      const [prodRes, revRes] = await Promise.all([
        fetch('/api/scrape/product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(urlPayload) }),
        fetch('/api/scrape/reviews-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...urlPayload, max: 12 }) }),
      ]);

      if (!prodRes.ok) {
        const j = await prodRes.json().catch(() => ({} as any));
        throw new Error(j?.error || t('newProduct.fetchFailed') || 'Failed to fetch product via API');
      }
      let productPayload = await prodRes.json();
      let reviewsPayload: any = { reviews: [] };
      if (revRes.ok) {
        try { reviewsPayload = await revRes.json(); } catch {}
      } else {
        // Fallback: try reviews by HTML scraping without blocking creation
        try {
          const revHtml = await fetch('/api/scrape/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(urlPayload) });
          if (revHtml.ok) reviewsPayload = await revHtml.json();
        } catch {}
      }

      const combined = { ...productPayload, reviews: Array.isArray(reviewsPayload?.reviews) ? reviewsPayload.reviews : [] } as ProductData;

      // Create product and redirect
      await createProductAndRedirect(combined);
      setLink('');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : (t('newProduct.errorProcessing') || 'Error processing link. Please try again.'));
      setStatus('error');
      toast.error(err instanceof Error ? err.message : (t('newProduct.fetchFailedAPI') || 'Failed to fetch via API'), undefined, { placement: 'bottom-center' });
    } finally {
      toast.dismiss(loadingId);
    }
  };

  // Via Scraping (HTML)
  const fetchViaScraping = async () => {
    setError('');
    setStatus('loading');
    const loadingId = toast.loading(t('newProduct.scraping') || 'Scraping…', undefined, { placement: 'center' });
    try {
      const res = await fetch('/api/scrape/product-scraping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link.trim() }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || (t('newProduct.scrapingFailed') || 'Product scraping failed')); }
      const scrapedData = await res.json();
      // After getting data, create product and redirect
      await createProductAndRedirect(scrapedData);
      setLink('');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(t('newProduct.errorProcessing') || 'Error processing link. Please try again.');
      setStatus('error');
      toast.error(t('newProduct.scrapingFailed') || 'Scraping failed', undefined, { placement: 'bottom-center' });
    } finally {
      toast.dismiss(loadingId);
    }
  };

  // Create product and redirect to advanced editing
  const createProductAndRedirect = async (data: ProductData) => {
    const loadingId = toast.loading(t('newProduct.importing') || 'Importing product…', undefined, { placement: 'center' });
    try {
      // Normalizações defensivas
      const imgUrl = typeof (data as any)?.imageUrl === 'string'
        ? (data as any).imageUrl
        : ((data as any)?.imageUrl?.url || (data as any)?.imageUrl?.link || '');
      const linksArr = Array.isArray((data as any)?.links) ? (data as any).links : [];
      const reviewsArr = Array.isArray((data as any)?.reviews) ? (data as any).reviews : [];

      const minimalProduct = {
        title: data?.title || (t('newProduct.newProduct') || 'New Product'),
        slug: data?.slug || 'new-product',
        price: data?.price || '',
        imageUrl: imgUrl || '',
        summary: data?.summary || '',
        scrapedDescription: data?.scrapedDescription || '',
        scrapedQnA: data?.scrapedQnA || '',
        links: linksArr,
        reviews: reviewsArr,
        categoryId: null, // Será definido na edição avançada
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalProduct),
      });

      if (!response.ok) {
        let msg = t('newProduct.createFailed') || 'Failed to create product';
        try {
          const j = await response.json();
          msg = j?.error || j || msg;
        } catch { try { msg = await response.text(); } catch {} }
        toast.dismiss(loadingId);
        if (response.status === 401) {
          toast.error(t('auth.sessionExpired') || 'Session expired. Please login to continue.', undefined, { placement: 'bottom-center' });
          router.push('/auth/signin');
          return;
        }
        throw new Error(typeof msg === 'string' ? msg : (t('newProduct.createFailed') || 'Failed to create product'));
      }

      const created = await response.json();
  toast.dismiss(loadingId);
  toast.success(t('newProduct.productImported') || 'Product imported', t('newProduct.redirecting') || 'Redirecting to edit…', { placement: 'bottom-center' });
      
      // Redirect to advanced editing where the ENTIRE card will be configured
      router.push(`/admin-secret-xyz/products/${created.id}/edit`);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.dismiss(loadingId);
      toast.error(error instanceof Error ? error.message : 'Failed to create product', undefined, { anchor: lastClick ?? undefined });
      throw error;
    }
  };

  const handleOpenImportModal = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!link.startsWith('http')) {
      setError(t('newProduct.invalidLink') || 'Please enter a valid link (starting with http:// or https://).');
      toast.error(t('newProduct.invalidLinkTitle') || 'Invalid link', t('newProduct.invalidLinkDesc') || 'Use a full URL starting with http(s)://', { anchor: lastClick ?? undefined });
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleCreateManual = () => {
    // Create empty product and redirect immediately
    const emptyProduct = {
      title: '',
      slug: 'produto',
      price: '',
      imageUrl: '',
      summary: '',
      scrapedDescription: '',
      scrapedQnA: '',
      links: [],
      reviews: [],
      categoryId: null,
    };
    createProductAndRedirect(emptyProduct);
  };

  // --- Renderização Condicional ---
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin-secret-xyz" className="text-foreground/70 hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-3xl font-bold text-foreground">
          {t('newProduct.title') || 'New Product'}
        </h2>
      </div>

      {/* Import Form */}
      <form onSubmit={handleOpenImportModal} className="bg-card/70 backdrop-blur-md p-6 rounded-xl shadow-sm shadow-black/5 dark:shadow-white/5 border border-border max-w-2xl mx-auto space-y-4">
        <label htmlFor="productLink" className="block text-sm font-medium text-foreground">
          {t('newProduct.enterLink') || 'Enter the product link'}
        </label>
        <input
          id="productLink"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={t('newProduct.placeholder') || 'e.g., https://amzn.to/...'}
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
          {status === 'loading' ? (t('common.processing') || 'Processing…') : (t('newProduct.extract') || 'Extract product information')}
        </button>
        <div className="text-center">
          <button
            type="button"
            onClick={handleCreateManual}
            disabled={status === 'loading'}
            className="mt-2 text-sm px-3 py-2 rounded-md border border-border bg-background hover:bg-card/60 text-foreground disabled:opacity-50"
          >
            {t('newProduct.addManually') || 'Add manually'}
          </button>
        </div>
      </form>

      {/* Minimalist modal to choose extraction source */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setIsImportModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-xl p-4">
            <div className="text-center mb-3">
              <div className="text-sm text-foreground/70">{t('newProduct.extractInfo') || 'Extract product information'}</div>
              <div className="text-xl font-semibold text-foreground">{t('newProduct.chooseSource') || 'Choose source'}</div>
            </div>
            {(() => {
              const host = getHostname(link.trim());
              const apiAllowed = isAmazonDomain(host);
              return (
                <div className="mb-2 text-xs text-foreground/70 text-center">
                  {!apiAllowed && (
                    <span>
                      {t('newProduct.apiNote') || 'To use "Via API", paste a URL from'} <span className="font-medium">amazon.*</span> {t('newProduct.domain') || 'domain'}.
                      {t('newProduct.shortenedNote') || 'For shortened links (ex.:'} <span className="font-mono">amzn.to</span>), {t('newProduct.useScrapingNote') || 'use "Scraping (HTML)" or paste the final Amazon URL'}.
                    </span>
                  )}
                </div>
              );
            })()}
            <div className="grid grid-cols-1 gap-3">
              <button type="button" className="px-4 py-3 rounded-xl border border-border bg-background hover:bg-card/60 text-foreground transition transform hover:scale-[1.01]" onClick={()=>{ setIsImportModalOpen(false); fetchViaScraping(); }}>
                {t('newProduct.scrapingHTML') || 'Scraping (HTML)'}
              </button>
              {(() => {
                const host = getHostname(link.trim());
                const apiAllowed = isAmazonDomain(host);
                return (
                  <button
                    type="button"
                    disabled={!apiAllowed}
                    className={`px-4 py-3 rounded-xl border border-border ${apiAllowed ? 'bg-background hover:bg-card/60 text-foreground transform hover:scale-[1.01]' : 'bg-muted text-foreground/50 cursor-not-allowed'}`}
                    onClick={()=>{ setIsImportModalOpen(false); if(apiAllowed) fetchViaAPI(); }}
                    title={!apiAllowed ? (t('newProduct.apiTooltip') || 'Use an amazon.* URL for Via API, or choose Scraping (HTML)') : undefined}
                  >
                    {t('newProduct.viaAPI') || 'Via API'}
                  </button>
                );
              })()}
            </div>
            <div className="mt-3 flex justify-center">
              <button type="button" className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-card/60" onClick={()=>setIsImportModalOpen(false)}>{t('common.close') || 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
