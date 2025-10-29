import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

// GET /api/products/[id]/reviews - lista reviews de um produto
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const reviews = await prisma.review.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/products/[id]/reviews - cria uma review manual
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { author, rating, content } = await req.json();
    if (!content || !content.trim()) {
      return new NextResponse('Conteúdo é obrigatório', { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId: params.id,
        author: author || null,
        rating: typeof rating === 'number' ? rating : null,
        content: content.trim(),
        isManual: true,
      },
    });

    return NextResponse.json(review);
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
