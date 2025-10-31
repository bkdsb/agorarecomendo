import { NextResponse } from 'next/server';

// Basic helpers
function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

async function resolveFinalUrl(inputUrl: string): Promise<string> {
  try {
    const headRes = await fetch(inputUrl, { method: 'HEAD', redirect: 'follow' as RequestRedirect, headers: { 'User-Agent': 'AgoraRecomendoBot/1.0 (+https://github.com/)' } });
    if (headRes.ok) return headRes.url || inputUrl;
  } catch {}
  try {
    const getRes = await fetch(inputUrl, { method: 'GET', redirect: 'follow' as RequestRedirect, headers: { 'User-Agent': 'AgoraRecomendoBot/1.0 (+https://github.com/)' } });
    return getRes.url || inputUrl;
  } catch {
    return inputUrl;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Resolver para fins de fetch (moderno/seguro), mas SEM alterar o link salvo (preservar afiliado)
    const finalUrl = await resolveFinalUrl(url);

    // Fetch HTML
    const res = await fetch(finalUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Falha ao buscar HTML do produto', details: text.slice(0, 500) }, { status: 502 });
    }

    const html = await res.text();
    const urlObj = new URL(finalUrl);

    // Try JSON-LD first
    const ldMatches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    let ld: any = null;
    for (const m of ldMatches) {
      const raw = (m[1] || '').trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const prod = parsed.find((x) => x && (x['@type'] === 'Product' || (Array.isArray(x['@type']) && x['@type'].includes('Product'))));
          if (prod) { ld = prod; break; }
        } else if (parsed && (parsed['@type'] === 'Product' || (Array.isArray(parsed['@type']) && parsed['@type'].includes('Product')))) {
          ld = parsed; break;
        }
      } catch {}
    }

    // Extract fields
    const textFromHtml = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].trim() : '';
    };

    const ogTitle = textFromHtml(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const metaTitle = textFromHtml(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const pageTitle = textFromHtml(/<title[^>]*>([^<]+)<\/title>/i);
    let title = (ld?.name || ogTitle || metaTitle || pageTitle || '').replace(/\s+/g, ' ').trim();

    const ogImage = textFromHtml(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    let imageUrl: any = Array.isArray(ld?.image) ? ld.image[0] : (ld?.image || ogImage || '');
    // Normaliza imageUrl para string
    if (imageUrl && typeof imageUrl === 'object') {
      imageUrl = imageUrl.url || imageUrl.link || '';
    }

    // Price heuristics
    const priceFromLd = (ld?.offers && (Array.isArray(ld.offers) ? ld.offers[0]?.price : ld.offers?.price)) || '';
    const metaPrice = textFromHtml(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const price = String(priceFromLd || metaPrice || '').trim();

    // Amazon feature bullets
    let summary = '';
    if (/amazon\./i.test(urlObj.hostname)) {
      const bulletsBlock = html.match(/<div[^>]+id=["']feature-bullets["'][\s\S]*?<\/div>/i)?.[0] || '';
      const itemMatches = Array.from(bulletsBlock.matchAll(/<li[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/li>/gi));
      const cleaned = itemMatches
        .map((m) => m[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim())
        .filter(Boolean);
      if (cleaned.length) summary = cleaned.slice(0, 2).join(' • ');
    }

    // Fallback summary from description
    const scrapedDescription = (ld?.description || '').toString();
    if (!summary && scrapedDescription) {
      summary = scrapedDescription.split(/\.|\n/).map((s: string)=>s.trim()).filter(Boolean).slice(0,2).join(' • ');
    }

    const { locale, store } = guessLocaleAndStore(urlObj.hostname);

    const productPayload = {
      title,
      slug: slugify(title) || 'produto',
      price,
  imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
      summary,
      scrapedDescription,
      scrapedQnA: '',
      links: [
        {
          id: 'l1',
          // Preservar o link original (com parâmetros de afiliado)
          url,
          locale,
          store,
        },
      ],
      reviews: [] as any[],
    };

    return NextResponse.json(productPayload);
  } catch (err) {
    console.error('HTML product scrape error:', err);
    return NextResponse.json({ error: 'Erro interno ao processar o link' }, { status: 500 });
  }
}
