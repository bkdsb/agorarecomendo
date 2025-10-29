import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanHtml } from '@/lib/sanitize';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || 'produto';
  let n = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

// GET /api/products/[id] - Busca um produto específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
        links: true,
        reviews: true,
      },
    });

    if (!product) {
      return new NextResponse('Produto não encontrado', { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/products/[id] - Atualiza um produto
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

  const body = await request.json();
  const { title, summary, article, imageUrl, categoryId, tags, links, reviews, scrapedQnA } = body;
  const safeArticle = typeof article === 'string' ? cleanHtml(article) : undefined;

    // Atualiza slug se título mudar
    let slugUpdate: string | undefined = undefined;
    if (typeof title === 'string' && title.trim().length > 0) {
      const base = slugify(title);
      slugUpdate = await ensureUniqueSlug(base, params.id);
    }

    // Se 'links' foi enviado, processa somente se houver pelo menos 1 link válido (com URL).
    // Isso evita sobrescrever/remover links existentes quando um payload vazio é enviado por engano.
    const validLinks = Array.isArray(links)
      ? links.filter((l: any) => typeof l?.url === 'string' && l.url.trim().length > 0)
      : undefined;
    const shouldReplaceLinks = Array.isArray(links) && (validLinks?.length ?? 0) > 0;
    if (shouldReplaceLinks) {
      await prisma.affiliateLink.deleteMany({ where: { productId: params.id } });
    }

    // Process reviews replacement if provided (allow clearing by sending empty array)
    const replaceReviews = Array.isArray(reviews);
    if (replaceReviews) {
      await prisma.review.deleteMany({ where: { productId: params.id } });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(summary !== undefined ? { summary } : {}),
  ...(safeArticle !== undefined ? { article: safeArticle } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
  ...(tags !== undefined ? { tags: tags || null } : {}),
    ...(scrapedQnA !== undefined ? { scrapedQnA: typeof scrapedQnA === 'string' ? scrapedQnA : JSON.stringify(scrapedQnA) } : {}),
        ...(slugUpdate ? { slug: slugUpdate } : {}),
        ...(shouldReplaceLinks
          ? {
              links: {
                create: (validLinks || []).map((l: any) => ({
                  url: l.url.trim(),
                  locale: l.locale || 'pt-br',
                  // Persist combined metadata in store as JSON to keep store label and custom title
                  store: (() => {
                    try {
                      return JSON.stringify({ store: l.store || l.title || 'Amazon', title: l.productTitle || '' });
                    } catch {
                      return l.store || l.title || 'Amazon';
                    }
                  })(),
                })),
              },
            }
          : {}),
        ...(replaceReviews
          ? {
              reviews: {
                create: (reviews || []).map((r: any) => ({
                  author: r.author ?? null,
                  rating: typeof r.rating === 'number' ? r.rating : null,
                  content: r.content ?? '',
                  isManual: !!r.isManual,
                  avatarUrl: r.avatarUrl ?? null,
                })),
              },
            }
          : {}),
      },
      include: { category: true, links: true, reviews: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/products/[id] - Deleta um produto
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Primeiro, remove todos os links
    await prisma.affiliateLink.deleteMany({
      where: {
        productId: params.id,
      },
    });

    // Então remove o produto
    await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse('Produto deletado com sucesso', { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}