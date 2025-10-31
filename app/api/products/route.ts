import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { cleanHtml } from '@/lib/sanitize';
import { authOptions } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base || 'produto';
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

async function ensureUniqueTitle(base: string): Promise<string> {
  let candidate = (base && base.trim()) || 'Produto';
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { title: candidate } });
    if (!existing) return candidate;
    counter += 1;
    // Use sufixo numérico discreto para evitar conflitos
    candidate = `${(base && base.trim()) || 'Produto'} ${counter}`;
  }
}

// GET /api/products - Lista produtos (somente autenticado)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const products = await prisma.product.findMany({
      include: {
        category: true,
        links: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return new NextResponse('Error fetching products', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const productData = await req.json();
    // Detect locale from first link (default to en-US)
    const firstLinkLocale = productData.links?.[0]?.locale || 'en-us';
    const productLocale = (firstLinkLocale === 'pt-br' ? 'pt-BR' : 'en-US') as 'en-US' | 'pt-BR';
    
    const uniqueTitle = await ensureUniqueTitle(String(productData.title || 'Produto'));
    const baseSlug = generateSlug(uniqueTitle, productLocale);
    const slug = await ensureUniqueSlug(baseSlug);

    const product = await prisma.product.create({
      data: {
        title: uniqueTitle,
        slug,
        price: productData.price ?? null,
        imageUrl: productData.imageUrl ?? null,
        summary: productData.summary ?? null,
        article: productData.article ? cleanHtml(productData.article) : null,
        tags: productData.tags ?? null,
        categoryId: productData.categoryId || null,
        scrapedDescription: productData.scrapedDescription ?? null,
        scrapedQnA: productData.scrapedQnA ?? null,
        links: {
          create: Array.isArray(productData.links)
            ? productData.links
                .filter((link: any) => typeof link?.url === 'string' && link.url.trim().length > 0)
                .map((link: any) => ({
                  url: link.url.trim(),
                  locale: link.locale || 'pt-br',
                  // Persist minimal store label and optional custom title in JSON for consistency with PATCH
                  store: (() => {
                    try {
                      return JSON.stringify({ store: link.store || link.title || 'Amazon', title: link.productTitle || '' });
                    } catch {
                      return link.store || link.title || 'Amazon';
                    }
                  })(),
                }))
            : [],
        },
        reviews: {
          create: Array.isArray(productData.reviews)
            ? productData.reviews.map((review: any) => ({
                author: review.author ?? null,
                rating: review.rating ?? null,
                content: review.content,
                isManual: !!review.isManual,
              }))
            : [],
        },
      },
      include: {
        links: true,
        reviews: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return new NextResponse('Error creating product', { status: 500 });
  }
}