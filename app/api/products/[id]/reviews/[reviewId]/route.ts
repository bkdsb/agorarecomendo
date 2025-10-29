import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';

// PATCH /api/products/[id]/reviews/[reviewId] - atualiza review manual
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { author, rating, content } = await req.json();
    const updated = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        ...(author !== undefined ? { author } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(content !== undefined ? { content } : {}),
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
  req: Request,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    await prisma.review.delete({ where: { id: params.reviewId } });
    return new NextResponse('Deleted', { status: 200 });
  } catch (e) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
