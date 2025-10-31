import { NextResponse } from 'next/server';

// Attempt to extract JSON-LD reviews from a page
function extractJsonLdReviews(html: string) {
  const scripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const reviews: any[] = [];
  for (const m of scripts) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      const json = JSON.parse(raw);
      const candidates = Array.isArray(json) ? json : [json, ...(Array.isArray((json as any)['@graph']) ? (json as any)['@graph'] : [])];
      for (const item of candidates) {
        if (!item) continue;
        const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (type?.includes('Review')) {
          const author = (typeof item.author === 'string' ? item.author : item.author?.name) ?? 'Reviewer';
          const rating = parseFloat(item.reviewRating?.ratingValue ?? item.ratingValue ?? 0) || 0;
          const content = item.reviewBody ?? item.description ?? '';
          if (content) {
            const createdAt = (item.datePublished && !isNaN(Date.parse(item.datePublished))) ? new Date(item.datePublished).toISOString() : new Date().toISOString();
            reviews.push({ id: `scraped-${reviews.length + 1}-${Date.now()}`, author, rating, content, isManual: false, createdAt });
          }
        }
        if (item.review) {
          const arr = Array.isArray(item.review) ? item.review : [item.review];
          for (const r of arr) {
            const author = (typeof r.author === 'string' ? r.author : r.author?.name) ?? 'Reviewer';
            const rating = parseFloat(r.reviewRating?.ratingValue ?? r.ratingValue ?? 0) || 0;
            const content = r.reviewBody ?? r.description ?? '';
            if (content) {
              const createdAt = (r.datePublished && !isNaN(Date.parse(r.datePublished))) ? new Date(r.datePublished).toISOString() : new Date().toISOString();
              reviews.push({ id: `scraped-${reviews.length + 1}-${Date.now()}`, author, rating, content, isManual: false, createdAt });
            }
          }
        }
      }
    } catch(_) {
      // ignore json parse errors
    }
  }
  return reviews;
}

// Fallback: extract reviews from Amazon HTML when JSON-LD is missing/incomplete
function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(html: string) {
  return decodeEntities(
    html
      .replace(/<\s*script[\s\S]*?<\s*\/\s*script>/gi, '')
      .replace(/<\s*style[\s\S]*?<\s*\/\s*style>/gi, '')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[\u00A0\s]+/g, ' ') // collapse whitespace
    .trim();
}

function parseNumberRating(raw: string) {
  // Accepts "5,0 de 5 estrelas" (pt-BR) or "5.0 out of 5 stars" (en-US)
  const m = raw.match(/([0-9]+[\.,]?[0-9]*)/);
  if (!m) return 0;
  const num = m[1].replace(',', '.');
  const val = parseFloat(num);
  if (isNaN(val)) return 0;
  return Math.max(0, Math.min(5, val));
}

function extractAmazonHtmlReviews(html: string) {
  // Temporary simplified fallback if JSON-LD is missing
  const list: any[] = [];
  try {
    const scopeMatch = html.match(/<ul[^>]*id=["']cm-cr-dp-review-list["'][^>]*>([\s\S]*?)<\/ul>/i);
    const scope = scopeMatch ? scopeMatch[1] : '';
    if (!scope) return list;
    const parts = scope.split(/<li[^>]*data-hook=["']review["'][^>]*>/i).slice(1);
    for (const block of parts) {
      const li = block.split('</li>')[0] || block;
      const author = stripHtml((li.match(/<span[^>]*class=["'][^"']*a-profile-name[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '') || 'Reviewer';
      const ratingText = stripHtml((li.match(/<span[^>]*class=["'][^"']*a-icon-alt[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '') || '';
      const rating = parseNumberRating(ratingText) || 0;
      const bodyHtml = (li.match(/data-hook=["']review-collapsed["'][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1])
        || (li.match(/data-hook=["']review-body["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
        || '';
      const content = stripHtml(bodyHtml);
      // Avatar do autor (se disponível)
      let avatarUrl = '';
      const avatarBlock = li.match(/<div[^>]*class=["'][^"']*a-profile-avatar[^"']*["'][^>]*>\s*<img[^>]*>/i)?.[0] || '';
      if (avatarBlock) {
        const mDataSrc = avatarBlock.match(/data-src=["']([^"']+)["']/i);
        const mSrc = avatarBlock.match(/src=["']([^"']+)["']/i);
        avatarUrl = (mDataSrc?.[1] || mSrc?.[1] || '').trim();
      }
      if (content) list.push({ id: `scraped-${list.length + 1}-${Date.now()}`, author, rating, content, isManual: false, avatarUrl: avatarUrl || undefined, createdAt: new Date().toISOString() });
      if (list.length >= 24) break;
    }
  } catch {}
  return list;
}

// Fallback adicional: extrair reviews do bloco "Global reviews" da Amazon
function extractAmazonGlobalHtmlReviews(html: string) {
  const list: any[] = [];
  try {
    const scopeMatch = html.match(/<ul[^>]*id=["']cm-cr-global-review-list["'][^>]*>([\s\S]*?)<\/ul>/i);
    const scope = scopeMatch ? scopeMatch[1] : '';
    if (!scope) return list;
    const parts = scope.split(/<li[^>]*data-hook=["']review["'][^>]*>/i).slice(1);
    for (const block of parts) {
      const li = block.split('</li>')[0] || block;
      const author = stripHtml((li.match(/<span[^>]*class=["'][^"']*a-profile-name[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '') || 'Reviewer';
      const ratingText = stripHtml((li.match(/<i[^>]*data-hook=["']cmps-review-star-rating["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*a-icon-alt[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
        || (li.match(/<span[^>]*class=["'][^"']*a-icon-alt[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '') || '';
      const rating = parseNumberRating(ratingText) || 0;
      // Preferir conteúdo original (sem tradução) quando disponível
      const bodyOriginal = (li.match(/<span[^>]*class=["'][^"']*cr-original-review-content[^"']*["'][^>]*[^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '';
      const bodyHtml = bodyOriginal || (li.match(/data-hook=["']review-body["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) || '';
      const content = stripHtml(bodyHtml);
      let avatarUrl = '';
      const avatarBlock = li.match(/<div[^>]*class=["'][^"']*a-profile-avatar[^"']*["'][^>]*>\s*<img[^>]*>/i)?.[0] || '';
      if (avatarBlock) {
        const mDataSrc = avatarBlock.match(/data-src=["']([^"']+)["']/i);
        const mSrc = avatarBlock.match(/src=["']([^"']+)["']/i);
        avatarUrl = (mDataSrc?.[1] || mSrc?.[1] || '').trim();
      }
      if (content) list.push({ id: `scraped-${list.length + 1}-${Date.now()}`, author, rating, content, isManual: false, avatarUrl: avatarUrl || undefined, createdAt: new Date().toISOString() });
      if (list.length >= 24) break;
    }
  } catch {}
  return list;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ reviews: [] }, { status: 200 });
    }
    const res = await fetch(url, {
      headers: {
        // Use realistic headers to receive fully rendered HTML blocks
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
      },
    });
    const html = await res.text();
    // Coleta de múltiplas fontes: JSON-LD + HTML (dp) + HTML (global)
    let reviews: any[] = [];
    try { reviews = reviews.concat(extractJsonLdReviews(html)); } catch {}
    try { reviews = reviews.concat(extractAmazonHtmlReviews(html)); } catch {}
    try { reviews = reviews.concat(extractAmazonGlobalHtmlReviews(html)); } catch {}
    // Normalize + deduplicate within the scraped batch to avoid repeats
    const normalize = (s: string) => (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/["'`´’“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const keyOf = (r: any) => [
      normalize(String(r.author || 'anon')),
      normalize(String(r.content || '')),
      String(Math.round((Number(r.rating) || 0) * 10) / 10),
    ].join(' | ');
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const r of reviews) {
      const k = keyOf(r);
      if (k && !seen.has(k)) {
        seen.add(k);
        unique.push(r);
      }
    }
    reviews = unique.slice(0, 12);
    return NextResponse.json({ reviews });
  } catch (e) {
    return NextResponse.json({ reviews: [] }, { status: 200 });
  }
}
