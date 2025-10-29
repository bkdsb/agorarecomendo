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
            reviews.push({ id: `scraped-${reviews.length + 1}-${Date.now()}`, author, rating, content, isManual: false });
          }
        }
        if (item.review) {
          const arr = Array.isArray(item.review) ? item.review : [item.review];
          for (const r of arr) {
            const author = (typeof r.author === 'string' ? r.author : r.author?.name) ?? 'Reviewer';
            const rating = parseFloat(r.reviewRating?.ratingValue ?? r.ratingValue ?? 0) || 0;
            const content = r.reviewBody ?? r.description ?? '';
            if (content) {
              reviews.push({ id: `scraped-${reviews.length + 1}-${Date.now()}`, author, rating, content, isManual: false });
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
      if (content) list.push({ id: `scraped-${list.length + 1}-${Date.now()}`, author, rating, content, isManual: false });
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
    let reviews = extractJsonLdReviews(html);
    if (reviews.length === 0) {
      reviews = extractAmazonHtmlReviews(html);
    }
    reviews = reviews.slice(0, 12);
    return NextResponse.json({ reviews });
  } catch (e) {
    return NextResponse.json({ reviews: [] }, { status: 200 });
  }
}
