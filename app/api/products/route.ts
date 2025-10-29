import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { cleanHtml } from '@/lib/sanitize';
import { authOptions } from '@/lib/auth';

// Slug básico
function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const productData = await req.json();
    const baseSlug = slugify(productData.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const product = await prisma.product.create({
      data: {
        title: productData.title,
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