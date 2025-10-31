import { NextResponse } from 'next/server';

type RFReview = {
  title?: string;
  body?: string;
  rating?: number;
  author?: string;
  date?: string;
};

type RainforestReviewsResponse = {
  request_info?: { success?: boolean };
  reviews?: RFReview[];
};

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'`´’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: Request) {
  try {
    const { url, asin, max = 12, locale } = await req.json();
    // Default to en-US if locale not provided
    const reviewLocale = (locale === 'pt-BR' || locale === 'en-US') ? locale : 'en-US';
    
    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAINFOREST_API_KEY ausente' }, { status: 500 });
    }
    if ((!url || typeof url !== 'string') && (!asin || typeof asin !== 'string')) {
      return NextResponse.json({ error: 'Informe url ou asin' }, { status: 400 });
    }

    // Validação defensiva de domínio suportado quando URL é fornecida
    if (url && typeof url === 'string') {
      try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        const isAmazon = /(^|\.)amazon\./.test(host);
        if (!isAmazon && !asin) {
          return NextResponse.json({ error: 'Via API aceita apenas URLs do domínio amazon.*. Use Scraping (HTML) para outros domínios ou links encurtados.' }, { status: 400 });
        }
      } catch {
        // URL inválida: deixe Rainforest retornar erro apropriado
      }
    }

    const endpoint = 'https://api.rainforestapi.com/request';
    const params = new URLSearchParams({ api_key: apiKey, type: 'reviews', output: 'json' });
    if (asin) params.set('asin', asin);
    if (url) params.set('url', url);
    // optional: you can add page or sort parameters in future

    const rfRes = await fetch(`${endpoint}?${params.toString()}`, { headers: { 'User-Agent': 'AgoraRecomendoBot/1.0' } });
    if (!rfRes.ok) {
      const text = await rfRes.text().catch(() => '');
      return NextResponse.json({ error: 'Falha na Rainforest Reviews', details: text }, { status: 502 });
    }

    const data = (await rfRes.json()) as RainforestReviewsResponse;
    let reviews = (data.reviews || []).map((r, i) => ({
      id: `rf-${i + 1}-${Date.now()}`,
      author: r.author || 'Reviewer',
      rating: typeof r.rating === 'number' ? r.rating : 0,
      content: r.body || r.title || '',
      isManual: false,
      // Atribui createdAt para melhor ordenação no preview/admin; DB terá seu próprio createdAt ao persistir
      createdAt: (r.date && !isNaN(Date.parse(r.date)) ? new Date(r.date).toISOString() : new Date().toISOString()),
    })).filter(r => r.content);

    // Dedup dentro do batch
    const keyOf = (r: any) => [normalize(String(r.author||'anon')), normalize(String(r.content||'')), String(Math.round((Number(r.rating)||0)*10)/10)].join(' | ');
    const seen = new Set<string>();
    const unique = [] as any[];
    for (const r of reviews) {
      const k = keyOf(r);
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push({ ...r, locale: reviewLocale }); // Add locale to each review
      if (unique.length >= Math.max(1, Math.min(Number(max) || 12, 50))) break;
    }

    return NextResponse.json({ reviews: unique });
  } catch (err) {
    console.error('Rainforest reviews error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
