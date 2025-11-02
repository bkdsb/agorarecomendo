import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

// GET /api/products/[id]/reviews - lista reviews de um produto
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const reviews = await prisma.review.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/products/[id]/reviews - cria uma review manual
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { author, rating, content, locale, avatarUrl } = await req.json();
    if (!content || !content.trim()) {
      return new NextResponse('Conteúdo é obrigatório', { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId: id,
        author: author || null,
        rating: typeof rating === 'number' ? rating : null,
        content: content.trim(),
        isManual: true,
        locale: (locale === 'pt-BR' || locale === 'en-US') ? locale : 'en-US',
        avatarUrl: avatarUrl || null,
      },
    });

    return NextResponse.json(review);
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
