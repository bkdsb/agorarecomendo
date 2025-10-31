import { NextResponse } from 'next/server';

// Simple slugify similar to server create route
function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type RainforestProductResponse = {
  request_info?: { success?: boolean; credits_used?: number; };
  product?: {
    title?: string;
    main_image?: string;
    images_list?: Array<{ link?: string }>;
    buybox_winner?: { price?: { raw?: string; value?: number; currency?: string } };
    buybox_price?: { raw?: string; value?: number; currency?: string };
    description?: string;
    feature_bullets?: string[];
    asin?: string;
    url?: string;
  };
};

function guessLocaleAndStore(domain: string) {
  const d = domain.toLowerCase();
  if (d.endsWith('amazon.com.br')) return { locale: 'pt-br', store: 'Amazon BR' };
  if (d.endsWith('amazon.com')) return { locale: 'en-us', store: 'Amazon US' };
  if (d.endsWith('amazon.es')) return { locale: 'es-es', store: 'Amazon ES' };
  if (d.endsWith('amazon.de')) return { locale: 'de-de', store: 'Amazon DE' };
  if (d.endsWith('amazon.fr')) return { locale: 'fr-fr', store: 'Amazon FR' };
  if (d.endsWith('amazon.it')) return { locale: 'it-it', store: 'Amazon IT' };
  if (d.endsWith('amazon.co.uk')) return { locale: 'en-gb', store: 'Amazon UK' };
  return { locale: 'pt-br', store: 'Amazon' };
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAINFOREST_API_KEY não configurada no ambiente' }, { status: 500 });
    }

    // Deixe a Rainforest API processar o link exatamente como enviado
    const endpoint = 'https://api.rainforestapi.com/request';
    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'product',
      url,
      output: 'json',
    });

    const rfRes = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      // Provide a reasonable UA
      headers: { 'User-Agent': 'AgoraRecomendoBot/1.0 (+https://github.com/)' },
      // Rainforest handles redirects internally; we still allow fetch defaults
    });
    if (!rfRes.ok) {
      const text = await rfRes.text().catch(() => '');
      return NextResponse.json({ error: 'Falha na Rainforest API', details: text }, { status: 502 });
    }

    const data = (await rfRes.json()) as RainforestProductResponse;
    const productData = data.product || {};

  const title = productData.title || '';
  const priceRaw = productData.buybox_winner?.price?.raw || productData.buybox_price?.raw || (productData.buybox_winner?.price?.value != null ? String(productData.buybox_winner.price.value) : '') || '';
  const imageUrl = productData.main_image || productData.images_list?.[0]?.link || '';
  const summary = Array.isArray(productData.feature_bullets) && productData.feature_bullets.length > 0 ? productData.feature_bullets.slice(0, 2).join(' • ') : '';
  const scrapedDescription = productData.description || (Array.isArray(productData.feature_bullets) ? productData.feature_bullets.join('\n') : '') || '';
  // Para não perder parâmetros de afiliado, mantenha o link exatamente como enviado
  const productUrl = url;
    const domain = getDomainFromUrl(productUrl);
    const { locale, store } = guessLocaleAndStore(domain);

    const productPayload = {
      title,
      slug: slugify(title) || 'produto',
      price: priceRaw,
      imageUrl,
      summary,
      scrapedDescription,
      scrapedQnA: '',
      links: [
        {
          id: 'l1',
          url: productUrl,
          locale,
          store,
        },
      ],
      reviews: [] as any[],
    };

    return NextResponse.json(productPayload);
  } catch (err) {
    console.error('Rainforest product scrape error:', err);
    return NextResponse.json({ error: 'Erro interno ao processar o link' }, { status: 500 });
  }
}
