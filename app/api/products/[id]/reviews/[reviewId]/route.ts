import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';

// PATCH /api/products/[id]/reviews/[reviewId] - atualiza review manual
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { author, rating, content, locale, avatarUrl } = await req.json();
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(author !== undefined ? { author } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(locale !== undefined && (locale === 'pt-BR' || locale === 'en-US') ? { locale } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        isManual: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/products/[id]/reviews/[reviewId] - remove review
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    await prisma.review.delete({ where: { id: reviewId } });
    return new NextResponse('Deleted', { status: 200 });
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
